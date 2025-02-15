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
    const [deliveryStats, finance, customers, stockStats, popularAreas, recentSales, stockWarnings] = await Promise.all([
      // Teslimat İstatistikleri
      db.prepare(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
          SUM(CASE WHEN status = 'delivering' THEN 1 ELSE 0 END) as pending_orders,
          SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing_orders
        FROM orders 
        WHERE DATE(delivery_date) = DATE('now')
        AND tenant_id = ?
      `).bind(tenant_id).first(),

      // Finansal İstatistikler
      db.prepare(`
        SELECT 
          SUM(CASE WHEN DATE(created_at) = DATE('now') THEN total_amount ELSE 0 END) as daily_revenue,
          SUM(CASE WHEN strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') THEN total_amount ELSE 0 END) as monthly_income,
          SUM(CASE WHEN payment_status = 'pending' THEN total_amount ELSE 0 END) as pending_payments,
          ROUND(AVG(profit_margin), 0) as profit_margin
        FROM orders
        WHERE tenant_id = ?
        AND status != 'cancelled'
      `).bind(tenant_id).first(),

      // Müşteri İstatistikleri
      db.prepare(`
        SELECT 
          COUNT(DISTINCT CASE WHEN DATE(created_at) >= DATE('now', '-30 days') THEN id END) as new_count,
          COUNT(DISTINCT id) as repeat_count,
          ROUND(AVG(total_amount), 0) as avg_basket
        FROM customers
        WHERE tenant_id = ?
      `).bind(tenant_id).first(),

      // Stok Durumu
      db.prepare(`
        SELECT COUNT(*) as low_stock
        FROM products
        WHERE stock <= min_stock
        AND tenant_id = ?
      `).bind(tenant_id).first(),

      // Popüler Bölgeler
      db.prepare(`
        SELECT delivery_district as name, COUNT(*) as count
        FROM orders
        WHERE tenant_id = ?
        AND DATE(delivery_date) >= DATE('now', '-30 days')
        GROUP BY delivery_district
        ORDER BY count DESC
        LIMIT 5
      `).bind(tenant_id).all(),

      // Son Satışlar
      db.prepare(`
        SELECT o.total_amount as amount, c.name as customer, o.created_at as date
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.tenant_id = ?
        ORDER BY o.created_at DESC
        LIMIT 5
      `).bind(tenant_id).all(),

      // Stok Uyarıları
      db.prepare(`
        SELECT name, stock as current, min_stock as minimum
        FROM products
        WHERE stock <= min_stock
        AND tenant_id = ?
        ORDER BY stock ASC
        LIMIT 5
      `).bind(tenant_id).all()
    ]);

    return c.json({
      deliveryStats,
      finance,
      customers,
      lowStock: stockStats.low_stock,
      popularAreas: popularAreas.results,
      recentSales: recentSales.results,
      stockWarnings: stockWarnings.results
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Dashboard özet istatistikleri
api.get('/api/dashboard/summary', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');

  try {
    const [delivery, finance, customers, stock] = await Promise.all([
      // Teslimat istatistikleri
      db.prepare(`
        SELECT 
          COUNT(*) as today_total,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN status = 'delivering' THEN 1 ELSE 0 END) as on_route,
          SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing
        FROM orders 
        WHERE DATE(delivery_date) = DATE('now')
        AND tenant_id = ?
      `).bind(tenant_id).first(),

      // Finansal istatistikler
      db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN DATE(created_at) = DATE('now') THEN total_amount ELSE 0 END), 0) as daily_revenue,
          COALESCE(SUM(CASE WHEN strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') THEN total_amount ELSE 0 END), 0) as monthly_income,
          COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN total_amount ELSE 0 END), 0) as pending_payments,
          ROUND(AVG(profit_margin), 1) as avg_margin
        FROM orders
        WHERE tenant_id = ?
        AND status != 'cancelled'
      `).bind(tenant_id).first(),

      // Müşteri istatistikleri
      db.prepare(`
        SELECT 
          COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-30 days') THEN 1 END) as new_customers,
          COUNT(DISTINCT customer_id) as repeat_customers,
          ROUND(AVG(total_amount), 0) as avg_basket
        FROM orders
        WHERE tenant_id = ?
        AND status != 'cancelled'
      `).bind(tenant_id).first(),

      // Stok istatistikleri
      db.prepare(`
        SELECT COUNT(*) as critical_count
        FROM products 
        WHERE stock <= min_stock 
        AND tenant_id = ?
      `).bind(tenant_id).first()
    ]);

    return c.json({
      delivery,
      finance,
      customers,
      stock
    });

  } catch (error) {
    console.error('Dashboard summary error:', error);
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

// Müşteri tipi dağılımı - Düzeltilmiş sorgu
api.get('/customers/distribution', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  try {
    const { results } = await db.prepare(`
      SELECT 
        COALESCE(customer_type, 'retail') as customer_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customers WHERE tenant_id = ?), 1) as percentage
      FROM customers
      WHERE tenant_id = ?
      AND is_deleted = 0
      GROUP BY customer_type
    `).bind(tenant_id, tenant_id).all();
    
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// Yeni API Endpointleri - Önerilen Yeni Kartlar İçin:

// 1. Aylık Satış Trendi
api.get('/analytics/sales-trend', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  try {
    const { results } = await db.prepare(`
      SELECT 
        strftime('%Y-%m-%d', delivery_date) as date,
        COUNT(*) as total_orders,
        SUM(total_amount) as revenue
      FROM orders
      WHERE tenant_id = ?
      AND date(delivery_date) >= date('now', '-30 days')
      GROUP BY date
      ORDER BY date DESC
    `).bind(tenant_id).all();
    
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// 2. En Aktif Müşteriler
api.get('/analytics/top-customers', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  try {
    const { results } = await db.prepare(`
      SELECT 
        c.name,
        c.customer_type,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_spent,
        MAX(o.delivery_date) as last_order_date
      FROM customers c
      JOIN orders o ON c.id = o.customer_id
      WHERE c.tenant_id = ?
      AND o.created_at >= date('now', '-90 days')
      GROUP BY c.id
      ORDER BY order_count DESC
      LIMIT 5
    `).bind(tenant_id).all();
    
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// 3. Teslimat Performansı
api.get('/analytics/delivery-performance', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');
  try {
    const { results } = await db.prepare(`
      SELECT 
        delivery_status,
        COUNT(*) as count,
        ROUND(AVG(CASE 
          WHEN delivery_status = 'completed' THEN 1 
          WHEN delivery_status = 'failed' THEN 0 
        END) * 100, 1) as success_rate
      FROM orders
      WHERE tenant_id = ?
      AND delivery_date >= date('now', '-30 days')
      GROUP BY delivery_status
    `).bind(tenant_id).all();
    
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

export default api
