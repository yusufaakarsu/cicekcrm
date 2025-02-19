import { Hono } from 'hono'

const router = new Hono()

// Tüm siparişleri listele
router.get('/', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT o.*, 
             c.name as customer_name,
             c.phone as customer_phone,
             GROUP_CONCAT(oi.quantity || 'x ' || p.name) as items_list,
             o.delivery_time_slot,
             DATE(o.delivery_date) as delivery_date
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.tenant_id = ?
      GROUP BY o.id
      ORDER BY o.delivery_date DESC
    `).bind(tenant_id).all()
    
    return c.json(results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Bugünün siparişleri
router.get('/today', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
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

// Sipariş detayları
router.get('/:id/details', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const { id } = c.req.param()
  
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
    `).bind(id, tenant_id).first()

    if (!order) {
      return c.json({ error: 'Order not found' }, 404)
    }

    return c.json(order)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Filtrelenmiş siparişler 
router.get('/filtered', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const { status, date_filter, start_date, end_date, sort = 'id_desc', page = '1', per_page = '10' } = c.req.query()
  
  try {
    let baseQuery = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        a.district as delivery_district,
        a.street as delivery_street,
        GROUP_CONCAT(p.name || ' x' || oi.quantity) as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN addresses a ON o.delivery_address_id = a.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.tenant_id = ?
    `
    
    const params: any[] = [tenant_id]

    // Status filtresi
    if (status) {
      baseQuery += ` AND o.status = ?`
      params.push(status)
    }

    // Tarih filtresi
    if (date_filter) {
      switch (date_filter) {
        case 'today':
          baseQuery += ` AND DATE(o.delivery_date) = DATE('now')`
          break
        case 'tomorrow':
          baseQuery += ` AND DATE(o.delivery_date) = DATE('now', '+1 day')`
          break
        case 'week':
          baseQuery += ` AND DATE(o.delivery_date) BETWEEN DATE('now') AND DATE('now', '+7 days')`
          break
        case 'month':
          baseQuery += ` AND strftime('%Y-%m', o.delivery_date) = strftime('%Y-%m', 'now')`
          break
      }
    } else if (start_date && end_date) {
      baseQuery += ` AND DATE(o.delivery_date) BETWEEN DATE(?) AND DATE(?)`
      params.push(start_date, end_date)
    }

    baseQuery += ` GROUP BY o.id`

    // Sıralama
    switch(sort) {
      case 'date_asc':
        baseQuery += ` ORDER BY o.delivery_date ASC, o.id ASC`
        break
      case 'date_desc':
        baseQuery += ` ORDER BY o.delivery_date DESC, o.id DESC`
        break
      case 'amount_asc':
        baseQuery += ` ORDER BY o.total_amount ASC`
        break
      case 'amount_desc':
        baseQuery += ` ORDER BY o.total_amount DESC`
        break
      default:
        baseQuery += ` ORDER BY o.id DESC`
    }

    // Sayfalama
    baseQuery += ` LIMIT ? OFFSET ?`
    const pageNum = parseInt(page)
    const perPage = parseInt(per_page)
    params.push(perPage, (pageNum - 1) * perPage)

    // Toplam kayıt sayısı
    const countQuery = baseQuery.replace(
      'SELECT o.*, c.name', 
      'SELECT COUNT(DISTINCT o.id) as total'
    )
    const { total } = await db.prepare(countQuery).bind(...params).first() as any

    // Kayıtları getir
    const orders = await db.prepare(baseQuery).bind(...params).all()

    return c.json({
      success: true,
      orders: orders.results,
      total: total,
      page: pageNum,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage)
    })

  } catch (error) {
    console.error('Orders query error:', error)
    return c.json({ 
      success: false, 
      error: 'Database error',
      details: error.message 
    }, 500)
  }
})

// Sipariş durumunu güncelle
router.put('/:id/status', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const { id } = c.req.param()
  const { status } = await c.req.json()
  
  try {
    await db.prepare(`
      UPDATE orders 
      SET status = ?,
          updated_at = DATETIME('now')
      WHERE id = ?
      AND tenant_id = ?
    `).bind(status, id, tenant_id).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Sipariş iptal et
router.put('/:id/cancel', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const { id } = c.req.param()
  
  try {
    await db.prepare(`
      UPDATE orders 
      SET status = 'cancelled',
          updated_at = DATETIME('now')
      WHERE id = ?
      AND tenant_id = ?
    `).bind(id, tenant_id).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Sipariş teslimat bilgilerini kaydet
router.post("/delivery", async (c) => {
  const body = await c.req.json();
  const db = c.get("db");
  const tenant_id = c.get("tenant_id");

  try {
    // Zorunlu alanları kontrol et
    const required = ['delivery_date', 'delivery_time_slot', 'recipient_name', 'recipient_phone'];
    for (const field of required) {
      if (!body[field]) {
        return c.json({
          success: false,
          error: `${field} alanı zorunludur`
        }, 400);
      }
    }

    // Adres bilgisi kontrolü
    if (!body.address_id && !body.new_address) {
      return c.json({
        success: false, 
        error: "Teslimat adresi gereklidir"
      }, 400);
    }

    // Yeni adres varsa önce onu kaydet
    let delivery_address_id = body.address_id;
    if (body.new_address) {
      const addressResult = await db.prepare(`
        INSERT INTO addresses (
          tenant_id, customer_id, district, city, street, building_no, 
          label, neighborhood, floor, directions, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        tenant_id,
        body.customer_id,
        body.new_address.district,
        'İstanbul',
        body.new_address.street,
        body.new_address.building_no,
        'Teslimat Adresi',
        body.new_address.neighborhood || null,
        body.new_address.floor || null,
        body.new_address.directions || null
      ).run();

      if (!addressResult.success) {
        throw new Error("Adres kaydedilemedi");
      }

      delivery_address_id = addressResult.meta?.last_row_id;
    }

    // Sipariş teslimat bilgilerini oluştur
    const result = await db.prepare(`
      INSERT INTO orders (
        tenant_id, customer_id, delivery_date, delivery_time_slot,
        recipient_name, recipient_phone, recipient_alternative_phone,
        recipient_note, card_message, delivery_address_id,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', datetime('now'), datetime('now'))
    `).bind(
      tenant_id,
      body.customer_id,
      body.delivery_date,
      body.delivery_time_slot,
      body.recipient_name,
      body.recipient_phone,
      body.recipient_alternative_phone || null,
      body.recipient_note || null,
      body.card_message || null,
      delivery_address_id
    ).run();

    if (!result.success) {
      throw new Error("Sipariş oluşturulamadı");
    }

    return c.json({
      success: true,
      order_id: result.meta?.last_row_id
    });

  } catch (error) {
    console.error("Teslimat bilgileri kaydedilemedi:", error);
    return c.json({
      success: false,
      error: "Teslimat bilgileri kaydedilemedi",
      details: error.message
    }, 500);
  }
});

// Yeni sipariş oluşturma endpoint'i düzeltildi
router.post('/', async (c) => {
  const db = c.get('db');
  const tenant_id = c.get('tenant_id');
  
  try {
    const body = await c.req.json();
    console.log('[DEBUG] Gelen sipariş verisi:', body);

    // Veri doğrulama
    if (!body.customer_id || !body.delivery_date || !body.items?.length) {
      return c.json({ 
        success: false, 
        error: 'Eksik veya hatalı bilgi',
        received: body
      }, 400);
    }

    // 1. Siparişi oluştur
    const orderResult = await db.prepare(`
      INSERT INTO orders (
        tenant_id, customer_id, delivery_address_id,
        status, delivery_date, delivery_time_slot,
        recipient_name, recipient_phone, recipient_alternative_phone,
        recipient_note, card_message,
        subtotal, total_amount, payment_method, payment_status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now'), DATETIME('now'))
    `).bind(
      tenant_id,
      body.customer_id,
      body.delivery_address_id,
      body.status || 'new',
      body.delivery_date,
      body.delivery_time_slot,
      body.recipient_name,
      body.recipient_phone,
      body.recipient_alternative_phone,
      body.recipient_note,
      body.card_message,
      body.subtotal,
      body.total_amount,
      body.payment_method || 'cash',
      body.payment_status || 'pending'
    ).run();

    const orderId = orderResult.meta?.last_row_id;
    if (!orderId) throw new Error('Sipariş ID alınamadı');

    // 2. Sipariş kalemlerini ekle
    const insertPromises = body.items.map(item => 
      db.prepare(`
        INSERT INTO order_items (
          tenant_id, order_id, product_id, 
          quantity, unit_price, cost_price
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        tenant_id,
        orderId,
        item.product_id,
        item.quantity,
        item.unit_price,
        item.cost_price || 0
      ).run()
    );

    await Promise.all(insertPromises);

    return c.json({
      success: true,
      message: 'Sipariş başarıyla oluşturuldu',
      order: {
        id: orderId
      }
    });

  } catch (error) {
    console.error('[Sipariş Hatası]:', error);
    return c.json({
      success: false,
      error: 'Sipariş oluşturulamadı',
      message: error.message
    }, 500);
  }
});

// Helper function: Sipariş sayısını getir
async function getOrdersCount(db: D1Database, tenant_id: number, status?: string, date_filter?: string, start_date?: string, end_date?: string) {
  let countQuery = `
    SELECT COUNT(DISTINCT o.id) as total 
    FROM orders o 
    WHERE o.tenant_id = ?
    AND o.is_deleted = 0
  `
  
  const params: any[] = [tenant_id]

  if (status) {
    countQuery += ` AND o.status = ?`
    params.push(status)
  }

  if (date_filter) {
    switch (date_filter) {
      case 'today':
        countQuery += ` AND date(o.delivery_date) = date('now')`
        break
      case 'tomorrow':
        countQuery += ` AND date(o.delivery_date) = date('now', '+1 day')`
        break
      case 'week':
        countQuery += ` AND date(o.delivery_date) BETWEEN date('now') AND date('now', '+7 days')`
        break
      case 'month':
        countQuery += ` AND strftime('%Y-%m', o.delivery_date) = strftime('%Y-%m', 'now')`
        break
    }
  } else if (start_date && end_date) {
    countQuery += ` AND date(o.delivery_date) BETWEEN date(?) AND date(?)`
    params.push(start_date, end_date)
  }

  const result = await db.prepare(countQuery).bind(...params).first()
  return (result as any).total
}

export default router