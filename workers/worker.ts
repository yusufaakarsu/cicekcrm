import { Hono } from 'hono'
import { cors } from 'hono/cors'

const api = new Hono()

// CORS middleware
api.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

// Tenant middleware
api.use('*', async (c, next) => {
  // Basit başlangıç için sabit tenant_id kullanalım
  c.set('tenant_id', 1)
  await next()
})

api.get('/', () => new Response('API Running'))

// Ana sayfa istatistikleri için endpoint'i düzelt
api.get('/api/dashboard', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');

  try {
    // 1. Teslimat İstatistikleri 
    const deliveryStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN status = 'delivering' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing_orders
      FROM orders 
      WHERE DATE(delivery_date) = DATE('now')
      AND tenant_id = ?
      AND is_deleted = 0
    `).bind(tenant_id).first();

    // 2. Finansal İstatistikler
    const finance = await db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN DATE(created_at) = DATE('now') THEN total_amount ELSE 0 END), 0) as daily_revenue,
        COALESCE(ROUND(AVG(total_amount), 2), 0) as avg_order_value
      FROM orders
      WHERE tenant_id = ? 
      AND status != 'cancelled'
      AND is_deleted = 0
    `).bind(tenant_id).first();

    // 3. Kritik Durumlar
    const criticalStats = await db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'delivering' AND 
          DATETIME(delivery_date) < DATETIME('now') THEN 1 END) as delayed_deliveries,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancellations,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as complaints
      FROM orders
      WHERE tenant_id = ? 
      AND DATE(delivery_date) = DATE('now')
      AND is_deleted = 0
    `).bind(tenant_id).first();

    return c.json({
      deliveryStats: {
        total_orders: deliveryStats?.total_orders || 0,
        delivered_orders: deliveryStats?.delivered_orders || 0,
        pending_orders: deliveryStats?.pending_orders || 0,
        preparing_orders: deliveryStats?.preparing_orders || 0
      },
      finance: {
        daily_revenue: finance?.daily_revenue || 0,
        avg_order_value: finance?.avg_order_value || 0
      },
      criticalStats: {
        delayed_deliveries: criticalStats?.delayed_deliveries || 0,
        cancellations: criticalStats?.cancellations || 0,
        complaints: criticalStats?.complaints || 0
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// REMOVED: /api/dashboard/summary endpoint

// Finans istatistikleri
api.get('/api/finance/stats', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  try {
    const [dailyRevenue, monthlyIncome, pendingPayments, paymentStatus] = await Promise.all([
      // Günlük ciro
      db.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as revenue
        FROM orders 
        WHERE DATE(created_at) = DATE('now')
        AND status != 'cancelled'
        AND tenant_id = ?
      `).bind(tenant_id).first(),

      // Aylık gelir
      db.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as revenue
        FROM orders 
        WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
        AND status != 'cancelled'
        AND tenant_id = ?
      `).bind(tenant_id).first(),

      // Bekleyen ödemeler
      db.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as amount
        FROM orders 
        WHERE payment_status = 'pending'
        AND tenant_id = ?
      `).bind(tenant_id).first(),

      // Ödeme durumu dağılımı
      db.prepare(`
        SELECT 
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid,
          COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN payment_status = 'cancelled' THEN 1 END) as cancelled
        FROM orders
        WHERE tenant_id = ?
      `).bind(tenant_id).first()
    ]);

    // Kar marjı hesapla
    const costs = await db.prepare(`
      SELECT COALESCE(SUM(oi.quantity * oi.cost_price), 0) as total_cost
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE strftime('%Y-%m', o.created_at) = strftime('%Y-%m', 'now')
      AND o.status != 'cancelled'
      AND o.tenant_id = ?
    `).bind(tenant_id).first();

    const profitMargin = monthlyIncome.revenue > 0 
      ? Math.round((monthlyIncome.revenue - costs.total_cost) / monthlyIncome.revenue * 100) 
      : 0;

    return c.json({
      dailyRevenue: dailyRevenue.revenue,
      monthlyIncome: monthlyIncome.revenue,
      pendingPayments: pendingPayments.amount,
      profitMargin,
      paymentStatus
    });

  } catch (error) {
    console.error('Finance stats error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Son finansal işlemler
api.get('/api/finance/transactions', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  try {
    const { results } = await db.prepare(`
      SELECT 
        o.id as order_id,
        o.created_at,
        o.total_amount as amount,
        o.payment_status as status,
        c.name as customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.tenant_id = ?
      ORDER BY o.created_at DESC
      LIMIT 20
    `).bind(tenant_id).all();

    return c.json(results);

  } catch (error) {
    console.error('Transactions error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Müşterileri listele
api.get('/customers', async (c) => {
  const db = c.env.DB
  const tenant_id = c.get('tenant_id');
  try {
    const { results } = await db.prepare(`
      SELECT 
        c.*,
        COUNT(o.id) as total_orders,
        MAX(o.created_at) as last_order,
        SUM(o.total_amount) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.tenant_id = ?
      GROUP BY c.id, c.name, c.phone, c.email, c.address
      ORDER BY c.name
    `).bind(tenant_id).all()
    return c.json(results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Telefon numarasına göre müşteri ara
api.get('/customers/search/phone/:phone', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  const { phone } = c.req.param();
  
  try {
    const customer = await db.prepare(`
      SELECT * FROM customers 
      WHERE phone = ?
      AND tenant_id = ?
      LIMIT 1
    `).bind(phone, tenant_id).first();
    
    return c.json(customer || { found: false });
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// Yeni müşteri ekle
api.post('/api/customers', async (c) => {
  const body = await c.req.json();
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  
  try {
    // Telefon numarası temizleme
    const phone = body.phone.replace(/\D/g, '');

    // Zorunlu alanları kontrol et
    if (!body.name || !phone || !body.district) {
      return c.json({ 
        success: false, 
        error: 'Ad, telefon ve ilçe alanları zorunludur' 
      }, 400);
    }

    // Telefon numarası kontrolü
    const existing = await db.prepare(`
      SELECT id FROM customers 
      WHERE phone = ? AND tenant_id = ? AND is_deleted = 0
    `).bind(phone, tenant_id).first();
    
    if (existing) {
      return c.json({ 
        success: false, 
        error: 'Bu telefon numarası zaten kayıtlı',
        id: existing.id 
      }, 400);
    }

    console.log('Kaydedilecek veri:', { 
      tenant_id,
      name: body.name,
      phone,
      district: body.district,
      customer_type: body.customer_type || 'retail',
      email: body.email || null,
      city: body.city || 'İstanbul',
      special_dates: body.special_dates || null,
      notes: body.notes || null,
      tax_number: body.tax_number || null,
      company_name: body.company_name || null
    });

    // Yeni müşteri ekle
    const result = await db.prepare(`
      INSERT INTO customers (
        tenant_id,
        name,
        phone,
        district,
        customer_type,
        email,
        city,
        special_dates,
        notes,
        tax_number,
        company_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tenant_id,
      body.name,
      phone,
      body.district,
      body.customer_type || 'retail',
      body.email || null,
      body.city || 'İstanbul',
      body.special_dates || null,
      body.notes || null,
      body.tax_number || null,
      body.company_name || null
    ).run();

    // Eklenen müşteriyi getir
    const customer = await db.prepare(`
      SELECT * FROM customers WHERE id = last_insert_rowid()
    `).first();

    return c.json({ 
      success: true, 
      customer: customer
    });
    
  } catch (error) {
    console.error('Müşteri kayıt hatası:', error);
    return c.json({ 
      success: false, 
      error: 'Veritabanı hatası',
      details: error.message 
    }, 500);
  }
})

// Son müşteriler
api.get('/customers/recent', async (c) => {
  const db = c.env.DB
  const tenant_id = c.get('tenant_id');
  try {
    const { results } = await db.prepare(`
      SELECT * FROM customers 
      WHERE tenant_id = ?
      ORDER BY created_at DESC 
      LIMIT 5
    `).bind(tenant_id).all()
    return c.json(results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Müşteri detaylarını getir
api.get('/customers/:id', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  const { id } = c.req.param();
  
  try {
    // Müşteri bilgileri + özet istatistikler
    const customer = await db.prepare(`
      SELECT 
        c.*,
        COUNT(o.id) as total_orders,
        MAX(o.created_at) as last_order,
        SUM(o.total_amount) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND o.is_deleted = 0
      WHERE c.id = ?
      AND c.tenant_id = ?
      AND c.is_deleted = 0
      GROUP BY c.id
    `).bind(id, tenant_id).first();

    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    return c.json(customer);
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// Müşteri güncelle
api.put('/customers/:id', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  try {
    const result = await db.prepare(`
      UPDATE customers 
      SET 
        name = ?,
        phone = ?,
        email = ?,
        address = ?,
        city = ?,
        district = ?,
        customer_type = ?,
        company_name = ?,
        tax_number = ?,
        special_dates = ?,
        notes = ?,
        updated_at = DATETIME('now')
      WHERE id = ?
      AND tenant_id = ?
      AND is_deleted = 0
    `).bind(
      body.name,
      body.phone,
      body.email,
      body.address,
      body.city,
      body.district,
      body.customer_type,
      body.company_name,
      body.tax_number, 
      body.special_dates,
      body.notes,
      id,
      tenant_id
    ).run();

    if (result.changes === 0) {
      return c.json({ error: 'Customer not found or no changes made' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// Müşterinin siparişlerini getir
api.get('/customers/:id/orders', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  const { id } = c.req.param();
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        o.*,
        GROUP_CONCAT(oi.quantity || 'x ' || p.name) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.customer_id = ?
      AND o.tenant_id = ?
      AND o.is_deleted = 0
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).bind(id, tenant_id).all();

    return c.json(results || []);
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// Müşterinin kayıtlı adreslerini getir
api.get('/customers/:id/addresses', async (c) => {
    const db = c.env.DB;
    const tenant_id = c.get('tenant_id');
    const { id } = c.req.param();
    
    try {
        const { results } = await db.prepare(`
            SELECT * FROM addresses 
            WHERE customer_id = ?
            AND tenant_id = ?
            AND is_deleted = 0
            ORDER BY is_default DESC, created_at DESC
        `).bind(id, tenant_id).all();
        
        return c.json(results || []);
    } catch (error) {
        console.error('Addresses error:', error);
        return c.json({ error: 'Database error' }, 500);
    }
});

// Bugünün teslimatları
api.get('/orders/today', async (c) => {
  const db = c.env.DB
  const tenant_id = c.get('tenant_id');
  try {
    const { results } = await db.prepare(`
      SELECT o.*, c.name as customer_name 
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE DATE(o.delivery_date) = DATE('now')
      AND o.tenant_id = ?
      ORDER BY o.delivery_date ASC
    `).bind(tenant_id).all()
    return c.json(results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Tüm siparişleri listele
api.get('/orders', async (c) => {
  const db = c.env.DB
  const tenant_id = c.get('tenant_id');
  try {
    const { results } = await db
      .prepare(`
        SELECT o.*, 
               c.name as customer_name,
               c.phone as customer_phone,
               GROUP_CONCAT(
                 oi.quantity || 'x ' || p.name
               ) as items_list,
               o.delivery_time_slot,
               DATE(o.delivery_date) as delivery_date
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.tenant_id = ?
        GROUP BY o.id
        ORDER BY o.delivery_date DESC
      `)
      .bind(tenant_id)
      .all()
    return c.json(results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Son siparişler
api.get('/orders/recent', async (c) => {
  const db = c.env.DB
  const tenant_id = c.get('tenant_id');
  try {
    const { results } = await db.prepare(`
      SELECT o.*, c.name as customer_name 
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.tenant_id = ?
      ORDER BY o.created_at DESC 
      LIMIT 5
    `).bind(tenant_id).all()
    return c.json(results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Düşük stoklu ürünleri getir
api.get('/products/low-stock', async (c) => {
  const db = c.env.DB
  const tenant_id = c.get('tenant_id');
  try {
    const { results } = await db.prepare(`
      SELECT 
        p.*,
        COALESCE(SUM(oi.quantity), 0) as reserved_quantity,  -- Siparişler için ayrılan miktar
        (p.stock - COALESCE(SUM(oi.quantity), 0)) as available_stock,  -- Kullanılabilir stok
        CASE 
          WHEN p.stock <= p.min_stock THEN 'critical'
          WHEN p.stock <= p.min_stock * 1.5 THEN 'warning'
          ELSE 'ok'
        END as stock_status
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('new', 'preparing')
      WHERE p.tenant_id = ?
      AND p.is_deleted = 0
      GROUP BY p.id
      HAVING available_stock <= p.min_stock * 1.5
      ORDER BY available_stock ASC
    `).bind(tenant_id).all();
    
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
})

// Filtrelenmiş siparişleri getir
api.get('/orders/filtered', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  const { status, date_filter, start_date, end_date, sort = 'id_desc', page = '1', per_page = '10' } = c.req.query();
  
  try {
    // Debug
    console.log('Received dates:', { start_date, end_date });

    let baseQuery = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        GROUP_CONCAT(oi.quantity || 'x ' || p.name) as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.tenant_id = ?
      AND o.is_deleted = 0
    `;
    
    const params: any[] = [tenant_id];

    // Status filtresi
    if (status) {
      baseQuery += ` AND o.status = ?`;
      params.push(status);
    }

    // Tarih filtresi
    if (date_filter) {
      switch (date_filter) {
        case 'today':
          baseQuery += ` AND DATE(o.delivery_date) = DATE('now')`;
          break;
        case 'tomorrow':
          baseQuery += ` AND DATE(o.delivery_date) = DATE('now', '+1 day')`;
          break;
        case 'week':
          baseQuery += ` AND DATE(o.delivery_date) BETWEEN DATE('now') AND DATE('now', '+7 days')`;
          break;
        case 'month':
          baseQuery += ` AND strftime('%Y-%m', o.delivery_date) = strftime('%Y-%m', 'now')`;
          break;
      }
    } else if (start_date && end_date) {
      // Özel tarih aralığı için kesin zaman kontrolü
      baseQuery += ` 
        AND DATETIME(o.delivery_date) >= DATETIME(?)
        AND DATETIME(o.delivery_date) <= DATETIME(?)
      `;
      params.push(start_date, end_date);
      
      // Debug
      console.log('SQL Query with dates:', {
        query: baseQuery,
        params: params
      });
    }

    // Grup ve sıralama
    baseQuery += ` GROUP BY o.id`;

    // Sıralama
    switch(sort) {
      case 'id_asc':
        baseQuery += ` ORDER BY o.id ASC`;
        break;
      case 'id_desc':
        baseQuery += ` ORDER BY o.id DESC`;
        break;
      case 'date_asc':
        baseQuery += ` ORDER BY o.delivery_date ASC, o.id ASC`;
        break;
      case 'date_desc':
        baseQuery += ` ORDER BY o.delivery_date DESC, o.id DESC`;
        break;
      case 'amount_asc':
        baseQuery += ` ORDER BY o.total_amount ASC, o.id DESC`;
        break;
      case 'amount_desc':
        baseQuery += ` ORDER BY o.total_amount DESC, o.id DESC`;
        break;
      default:
        baseQuery += ` ORDER BY o.id DESC`;
    }

    // Sayfalama
    baseQuery += ` LIMIT ? OFFSET ?`;
    const pageNum = parseInt(page);
    const perPage = parseInt(per_page);
    const offset = (pageNum - 1) * perPage;
    params.push(perPage, offset);

    // Debug için
    console.log('Query:', baseQuery);
    console.log('Params:', params);

    const { results: orders } = await db.prepare(baseQuery).bind(...params).all();
    const total = await getOrdersCount(db, tenant_id, status, date_filter, start_date, end_date);

    return c.json({
      orders: orders || [],
      total,
      page: pageNum,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage)
    });

  } catch (error) {
    console.error('Orders filter error:', error);
    return c.json({ 
      error: 'Database error', 
      details: error.message,
      query_params: { status, date_filter, start_date, end_date } // Debug için
    }, 500);
  }
});

// Toplam kayıt sayısını almak için yardımcı fonksiyon
async function getOrdersCount(db: D1Database, tenant_id: number, status?: string, date_filter?: string, start_date?: string, end_date?: string) {
  let countQuery = `
    SELECT COUNT(DISTINCT o.id) as total 
    FROM orders o 
    WHERE o.tenant_id = ?
    AND o.is_deleted = 0
  `;
  
  const params: any[] = [tenant_id];

  if (status) {
    countQuery += ` AND o.status = ?`;
    params.push(status);
  }

  if (date_filter) {
    switch (date_filter) {
      case 'today':
        countQuery += ` AND date(o.delivery_date) = date('now')`;
        break;
      case 'tomorrow':
        countQuery += ` AND date(o.delivery_date) = date('now', '+1 day')`;
        break;
      case 'week':
        countQuery += ` AND date(o.delivery_date) BETWEEN date('now') AND date('now', '+7 days')`;
        break;
      case 'month':
        countQuery += ` AND strftime('%Y-%m', o.delivery_date) = strftime('%Y-%m', 'now')`;
        break;
    }
  } else if (start_date && end_date) {
    countQuery += ` AND date(o.delivery_date) BETWEEN date(?) AND date(?)`;
    params.push(start_date, end_date);
  }

  const result = await db.prepare(countQuery).bind(...params).first();
  return (result as any).total;
}

// Sipariş iptal et
api.put('/orders/:id/cancel', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  const { id } = c.req.param();
  
  try {
    await db.prepare(`
      UPDATE orders 
      SET status = 'cancelled',
          updated_at = DATETIME('now')
      WHERE id = ?
      AND tenant_id = ?
    `).bind(id, tenant_id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// Sipariş durumu güncelle
api.put('/orders/:id/status', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  const { id } = c.req.param();
  const { status } = await c.req.json();
  
  try {
    await db.prepare(`
      UPDATE orders 
      SET status = ?,
          updated_at = DATETIME('now')
      WHERE id = ?
      AND tenant_id = ?
    `).bind(status, id, tenant_id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// Sipariş detaylarını getir
api.get('/orders/:id/details', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  const { id } = c.req.param();
  
  try {
    const order = await db.prepare(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        a.label as delivery_address,
        a.city as delivery_city,
        a.district as delivery_district,
        a.street as delivery_street,
        a.building_no,
        a.postal_code,
        GROUP_CONCAT(oi.quantity || 'x ' || p.name) as items,
        CASE 
          WHEN o.payment_method = 'credit_card' THEN 'Kredi Kartı'
          WHEN o.payment_method = 'bank_transfer' THEN 'Havale/EFT'
          WHEN o.payment_method = 'cash' THEN 'Nakit'
          ELSE o.payment_method 
        END as payment_method_text
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN addresses a ON o.delivery_address_id = a.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ?
      AND o.tenant_id = ?
      GROUP BY o.id
    `).bind(id, tenant_id).first();

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    return c.json(order);
  } catch (error) {
    console.error('Order details error:', error);
    return c.json({ error: 'Database error' }, 500);
  }
});

// Yeni sipariş ekle
api.post('/orders', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  const body = await c.req.json();
  
  try {
    // Sipariş ana bilgilerini ekle
    const orderResult = await db.prepare(`
      INSERT INTO orders (
        tenant_id,
        customer_id, 
        delivery_date,
        delivery_time_slot,
        delivery_address_id,
        delivery_type,
        recipient_name, 
        recipient_phone,
        recipient_note,
        card_message,
        status,
        total_amount,
        payment_method,
        payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, 'pending')
    `).bind(
      tenant_id,
      body.customer_id,
      body.delivery_date,
      body.delivery_time_slot,
      body.delivery_address_id,
      body.delivery_type,
      body.recipient_name,
      body.recipient_phone,
      body.recipient_note,
      body.card_message,
      body.total_amount,
      body.payment_method
    ).run();

    // ...existing order items code...

    return c.json({ success: true, id: orderResult.lastRowId });
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// Sipariş güncelleme endpoint'i
api.put('/orders/:id', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  try {
    await db.prepare(`
      UPDATE orders 
      SET delivery_date = ?,
          delivery_address = ?,
          status = ?,
          updated_at = DATETIME('now')
      WHERE id = ?
      AND tenant_id = ?
    `).bind(
      body.delivery_date,
      body.delivery_address,
      body.status,
      id,
      tenant_id
    ).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// En çok satan ürünleri getir
api.get('/products/top-selling', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  try {
    const { results } = await db.prepare(`
      SELECT 
        p.name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.unit_price) as total_revenue
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      AND p.tenant_id = ?
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 5
    `).bind(tenant_id).all();
    
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// Yeni adres ekle
api.post('/addresses', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  const body = await c.req.json();
  
  try {
    console.log('Gelen veri:', body); // Debug için

    // Veri dönüşümü
    const addressData = {
      tenant_id,
      label: body.label,
      country_code: 'TUR',
      country_name: 'Türkiye',
      city: body.city || 'İstanbul',
      district: body.district,
      postal_code: body.postal_code,
      street: body.street || null,
      building_no: null,
      lat: body.position?.lat,
      lng: body.position?.lng,
      source: body.source || 'here_api',
      here_place_id: body.here_place_id
    };

    console.log('Kaydedilecek veri:', addressData); // Debug için

    const result = await db.prepare(`
      INSERT INTO addresses (
        tenant_id, label, country_code, country_name,
        city, district, postal_code, street, building_no,
        lat, lng, source, here_place_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      addressData.tenant_id,
      addressData.label,
      addressData.country_code,
      addressData.country_name,
      addressData.city,
      addressData.district,
      addressData.postal_code,
      addressData.street,
      addressData.building_no,
      addressData.lat,
      addressData.lng,
      addressData.source,
      addressData.here_place_id
    ).run();

    return c.json({ 
      success: true, 
      id: result.lastRowId,
      data: addressData
    });
  } catch (error) {
    console.error('Address save error:', error); // Debug için
    return c.json({ 
      error: 'Database error',
      details: error.message,
      data: body 
    }, 500);
  }
});

// Adres endpoints
api.post('/addresses', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  const body = await c.req.json();
  
  try {
    const result = await db.prepare(`
      INSERT INTO addresses (
        tenant_id, label, city, district, street,
        building_no, postal_code, lat, lng,
        source, here_place_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tenant_id,
      body.label,
      body.city,
      body.district,
      body.street,
      body.building_no,
      body.postal_code,
      body.position?.lat,
      body.position?.lng,
      body.source || 'manual',
      body.here_place_id
    ).run();

    return c.json({ 
      success: true, 
      id: result.lastRowId 
    });
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// Adres listele
api.get('/addresses', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  
  try {
    const { results } = await db.prepare(`
      SELECT * FROM addresses
      WHERE tenant_id = ?
      ORDER BY created_at DESC
    `).bind(tenant_id).all();
    
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// Helper function for phone number cleaning
function cleanPhoneNumber(phone: string): string {
    // Remove all non-digits
    let clean = phone.replace(/\D/g, '');
    
    // Remove leading 0 if exists
    if (clean.startsWith('0')) {
        clean = clean.substring(1);
    }
    
    return clean;
}

// Telefon ile müşteri arama endpoint'i - Düzeltilmiş versiyon
api.get('/customers/phone/:phone', async (c) => {
    try {
        const phone = c.req.param('phone').replace(/\D/g, '').replace(/^0+/, '');
        const tenant_id = c.get('tenant_id');
        const db = c.env.DB;

        console.log('Debug:', { phone, tenant_id }); // Debug için
        
        const customer = await db.prepare(`
            SELECT * FROM customers 
            WHERE phone = ? 
            AND tenant_id = ? 
            AND is_deleted = 0
        `).bind(phone, tenant_id).first();
        
        console.log('Bulunan müşteri:', customer); // Debug için

        return c.json({
            success: true,
            customer: customer || null
        });

    } catch (error) {
        console.error('Müşteri arama hatası:', error);
        
        return c.json({
            success: false,
            message: 'Müşteri araması başarısız',
            error: error.message
        });
    }
});

// Ürünleri listele
api.get('/products', async (c) => {
    const db = c.env.DB;
    const tenant_id = c.get('tenant_id');
    
    try {
        const { results } = await db.prepare(`
            SELECT * FROM products 
            WHERE tenant_id = ?
            AND is_deleted = 0
            ORDER BY name
        `).bind(tenant_id).all();
        
        return c.json(results);
    } catch (error) {
        return c.json({ error: 'Database error' }, 500);
    }
});

export default api
