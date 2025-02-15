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

// Ana sayfa istatistikleri için tek endpoint
api.get('/api/dashboard', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');

  try {
    const [todayDeliveries, { results: tomorrowNeeds }, { results: orderSummary }, lowStock] = await Promise.all([
      // 1. Bugünün teslimat durumu
      db.prepare(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
          SUM(CASE WHEN status NOT IN ('delivered', 'cancelled') THEN 1 END) as pending_orders
        FROM orders 
        WHERE DATE(delivery_date) = DATE('now')
        AND tenant_id = ?
      `).bind(tenant_id).first(),

      // 2. Yarının siparişleri için ürün ihtiyacı
      db.prepare(`
        SELECT 
          p.name,
          p.stock as current_stock,
          SUM(oi.quantity) as needed_quantity
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE DATE(o.delivery_date) = DATE('now', '+1 day')
        AND o.tenant_id = ?
        GROUP BY p.id, p.name, p.stock
        ORDER BY needed_quantity DESC
      `).bind(tenant_id).all(),

      // 3. Teslimat programı
      db.prepare(`
        SELECT 
          date(delivery_date) as date,
          COUNT(*) as count
        FROM orders
        WHERE date(delivery_date) BETWEEN date('now') AND date('now', '+2 days')
        AND tenant_id = ?
        GROUP BY date(delivery_date)
        ORDER BY date
      `).bind(tenant_id).all(),

      // 4. Düşük stok sayısı
      db.prepare(`SELECT COUNT(*) as count FROM products WHERE stock <= min_stock AND tenant_id = ?`).bind(tenant_id).first()
    ]);

    return c.json({
      deliveryStats: todayDeliveries,
      tomorrowNeeds,
      orderSummary,
      lowStock: lowStock.count
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

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
api.post('/customers', async (c) => {
  const body = await c.req.json()
  const db = c.env.DB
  const tenant_id = c.get('tenant_id');
  
  try {
    // Önce telefon numarasını kontrol et
    const existing = await db.prepare(`
      SELECT id FROM customers WHERE phone = ? AND tenant_id = ?
    `).bind(body.phone, tenant_id).first();
    
    if (existing) {
      return c.json({ error: 'Phone number already exists', id: existing.id }, 400);
    }

    const result = await db
      .prepare(`
        INSERT INTO customers (name, phone, email, address, tenant_id)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(body.name, body.phone, body.email, body.address, tenant_id)
      .run()

    return c.json({ success: true, id: result.lastRowId })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
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
    const { results } = await db
      .prepare('SELECT * FROM products WHERE stock <= min_stock AND tenant_id = ? ORDER BY stock ASC')
      .bind(tenant_id)
      .all()
    return c.json(results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Sipariş özetlerini getir (3 günlük)
api.get('/orders/summary', async (c) => {
  const db = c.env.DB
  const tenant_id = c.get('tenant_id');
  try {
    const [today, tomorrow, nextDay] = await Promise.all([
      db.prepare("SELECT COUNT(*) as count FROM orders WHERE DATE(delivery_date) = DATE('now') AND tenant_id = ?").bind(tenant_id).first(),
      db.prepare("SELECT COUNT(*) as count FROM orders WHERE DATE(delivery_date) = DATE('now', '+1 day') AND tenant_id = ?").bind(tenant_id).first(),
      db.prepare("SELECT COUNT(*) as count FROM orders WHERE DATE(delivery_date) = DATE('now', '+2 day') AND tenant_id = ?").bind(tenant_id).first()
    ])

    return c.json({
      today: today.count,
      tomorrow: tomorrow.count,
      nextDay: nextDay.count
    })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Detaylı son siparişler
api.get('/orders/recent-detailed', async (c) => {
  const db = c.env.DB
  const tenant_id = c.get('tenant_id');
  try {
    const { results: orders } = await db.prepare(`
      SELECT o.*, c.name as customer_name 
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.tenant_id = ?
      ORDER BY o.created_at DESC 
      LIMIT 10
    `).bind(tenant_id).all()

    // Her sipariş için ürün detaylarını al
    for (let order of orders) {
      const { results: items } = await db.prepare(`
        SELECT oi.*, p.name 
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `).bind(order.id).all()
      order.items = items
    }

    return c.json(orders)
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
    // Müşteri bilgileri ve sipariş özeti
    const customer = await db.prepare(`
      SELECT 
        c.*,
        COUNT(o.id) as total_orders,
        MAX(o.created_at) as last_order,
        SUM(o.total_amount) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.id = ?
      AND c.tenant_id = ?
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

// Müşterinin siparişlerini getir
api.get('/customers/:id/orders', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  const { id } = c.req.param();
  
  try {
    const { results: orders } = await db.prepare(`
      SELECT o.*, GROUP_CONCAT(oi.quantity || 'x ' || p.name) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.customer_id = ?
      AND o.tenant_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).bind(id, tenant_id).all();

    return c.json(orders);
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
    await db.prepare(`
      UPDATE customers 
      SET name = ?, phone = ?, email = ?, address = ?
      WHERE id = ?
      AND tenant_id = ?
    `).bind(body.name, body.phone, body.email, body.address, id, tenant_id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// Filtrelenmiş siparişleri getir
api.get('/orders/filtered', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  const { status, date_filter, start_date, end_date, sort, page = '1', per_page = '10' } = c.req.query();
  
  try {
    let baseQuery = `
      SELECT 
        o.*,
        c.name as customer_name,
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
      baseQuery += ` AND DATE(o.delivery_date) BETWEEN ? AND ?`;
      params.push(start_date, end_date);
    }

    // Önce toplam kayıt sayısını al
    const countQuery = `
      SELECT COUNT(DISTINCT o.id) as total 
      FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.tenant_id = ?
      AND o.is_deleted = 0
      ${status ? 'AND o.status = ?' : ''}
      ${date_filter === 'today' ? "AND DATE(o.delivery_date) = DATE('now')" : ''}
      ${date_filter === 'tomorrow' ? "AND DATE(o.delivery_date) = DATE('now', '+1 day')" : ''}
      ${date_filter === 'week' ? "AND DATE(o.delivery_date) BETWEEN DATE('now') AND DATE('now', '+7 days')" : ''}
      ${date_filter === 'month' ? "AND strftime('%Y-%m', o.delivery_date) = strftime('%Y-%m', 'now')" : ''}
      ${(start_date && end_date) ? 'AND DATE(o.delivery_date) BETWEEN ? AND ?' : ''}
    `;
    
    const countParams = [tenant_id];
    if (status) countParams.push(status);
    if (start_date && end_date) countParams.push(start_date, end_date);
    
    const { total } = await db.prepare(countQuery).bind(...countParams).first() as { total: number };

    // Grup ve sıralama
    baseQuery += ` GROUP BY o.id`;

    // Sıralama
    if (sort) {
      const [field, direction] = sort.split('_');
      const sortField = field === 'date' ? 'o.delivery_date' : 'o.total_amount';
      baseQuery += ` ORDER BY ${sortField} ${direction.toUpperCase()}`;
    } else {
      baseQuery += ` ORDER BY o.delivery_date DESC`;
    }

    // Sayfalama
    const pageNum = parseInt(page);
    const perPage = parseInt(per_page);
    const offset = (pageNum - 1) * perPage;
    
    baseQuery += ` LIMIT ? OFFSET ?`;
    params.push(perPage, offset);

    // Ana sorguyu çalıştır
    const { results: orders } = await db.prepare(baseQuery).bind(...params).all();

    return c.json({
      orders,
      total,
      page: pageNum,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage)
    });

  } catch (error) {
    console.error('Orders filter error:', error);
    return c.json({ error: 'Database error' }, 500);
  }
});

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
        GROUP_CONCAT(oi.quantity || 'x ' || p.name) as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ?
      AND o.tenant_id = ?
      GROUP BY o.id
    `).bind(id, tenant_id).first();

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Alıcı bilgilerini ayrı bir obje olarak ekle
    order.recipient = {
      name: order.recipient_name,
      phone: order.recipient_phone,
      note: order.recipient_note,
      address: order.recipient_address,
      card_message: order.card_message
    };

    return c.json(order);
  } catch (error) {
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
        customer_id, delivery_date, delivery_address, 
        recipient_name, recipient_phone, recipient_note, recipient_address,
        card_message, status, total_amount, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)
    `).bind(
      body.customer_id, 
      body.delivery_date, 
      body.delivery_address,
      body.recipient.name,
      body.recipient.phone,
      body.recipient.note,
      body.recipient.address,
      body.recipient.card_message,
      body.total_amount,
      tenant_id
    ).run();

    // ...existing code for order items...

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

// Popüler teslimat bölgeleri
api.get('/orders/popular-areas', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  try {
    const { results } = await db.prepare(`
      SELECT 
        delivery_district as district,
        COUNT(*) as delivery_count,
        ROUND(COUNT(*) * 100.0 / (
          SELECT COUNT(*) FROM orders 
          WHERE tenant_id = ? AND status != 'cancelled'
        ), 1) as percentage
      FROM orders
      WHERE tenant_id = ?
      AND status != 'cancelled'
      GROUP BY delivery_district
      ORDER BY delivery_count DESC
      LIMIT 5
    `).bind(tenant_id, tenant_id).all();
    
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// Teslimat zaman dilimi analizi
api.get('/orders/time-slots', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  try {
    const { results } = await db.prepare(`
      SELECT 
        delivery_time_slot,
        COUNT(*) as count
      FROM orders
      WHERE tenant_id = ?
      AND status != 'cancelled'
      GROUP BY delivery_time_slot
    `).bind(tenant_id).all();
    
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// Müşteri tipi dağılımı
api.get('/customers/distribution', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  try {
    const { results } = await db.prepare(`
      SELECT 
        customer_type,
        COUNT(*) as count
      FROM customers
      WHERE tenant_id = ?
      AND is_deleted = 0
      GROUP BY customer_type
    `).bind(tenant_id).all();
    
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

export default api
