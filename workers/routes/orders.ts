import { Hono } from 'hono'

const router = new Hono()

// Sipariş listesi SQL'i güncellendi
router.get('/', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        r.name as recipient_name,
        r.phone as recipient_phone,
        a.district,
        a.label as delivery_address,
        COALESCE(o.total_amount, 0) as total_amount,
        COALESCE(o.payment_status, 'pending') as payment_status,
        GROUP_CONCAT(
          p.name || ' x' || oi.quantity
        ) as items_summary
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN recipients r ON o.recipient_id = r.id
      LEFT JOIN addresses a ON o.address_id = a.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.tenant_id = ? 
      AND o.deleted_at IS NULL
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).bind(tenant_id).all()
    
    return c.json({
      success: true,
      orders: results
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
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

// Sipariş detay SQL'i güncellendi
router.get('/:id/details', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const { id } = c.req.param()
  
  try {
    // Ana sipariş bilgileri
    const order = await db.prepare(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        r.name as recipient_name,
        r.phone as recipient_phone,
        a.district,
        a.label as delivery_address,
        a.directions as delivery_directions,
        COALESCE(o.custom_card_message, cm.content) as card_message,
        GROUP_CONCAT(
          p.name || ' x' || oi.quantity || 
          CASE WHEN oi.notes IS NOT NULL THEN ' (' || oi.notes || ')' ELSE '' END
        ) as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN recipients r ON o.recipient_id = r.id
      LEFT JOIN addresses a ON o.address_id = a.id
      LEFT JOIN card_messages cm ON o.card_message_id = cm.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ? AND o.tenant_id = ?
      AND o.deleted_at IS NULL
      GROUP BY o.id
    `).bind(id, tenant_id).first()

    if (!order) {
      return c.json({ error: 'Order not found' }, 404)
    }

    // Sipariş kalemleri
    const { results: items } = await db.prepare(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.description as product_description
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      AND oi.deleted_at IS NULL
    `).bind(id).all()

    return c.json({
      success: true,
      order: {
        ...order,
        items: items || []
      }
    })

  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Filtrelenmiş siparişleri getir
router.get('/filtered', async (c) => {
    const db = c.get('db');
    const tenant_id = c.get('tenant_id');

    try {
        // URL parametrelerini al
        const url = new URL(c.req.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const per_page = parseInt(url.searchParams.get('per_page') || '10');
        const sort = url.searchParams.get('sort') || 'id_desc';
        const date_filter = url.searchParams.get('date_filter') || 'all';
        
        // Offset hesapla
        const offset = (page - 1) * per_page;

        // Temel SQL sorgusu
        let sql = `
            SELECT 
                o.*,
                c.name as customer_name,
                c.phone as customer_phone,
                r.name as recipient_name,
                r.phone as recipient_phone,
                a.district,
                a.label as delivery_address,
                GROUP_CONCAT(p.name || ' x' || oi.quantity) as items_summary
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN recipients r ON o.recipient_id = r.id
            LEFT JOIN addresses a ON o.address_id = a.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.tenant_id = ? AND o.deleted_at IS NULL
        `;

        // Tarih filtresi ekle
        const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        switch(date_filter) {
            case 'today':
                sql += ` AND DATE(o.delivery_date) = '${now}'`;
                break;
            case 'tomorrow':
                sql += ` AND DATE(o.delivery_date) = DATE('${now}', '+1 day')`;
                break;
            case 'week':
                sql += ` AND DATE(o.delivery_date) BETWEEN '${now}' AND DATE('${now}', '+7 days')`;
                break;
            // Diğer filtreler eklenebilir...
        }

        // Grup ve sıralama
        sql += ` GROUP BY o.id `;
        
        // Sıralama
        sql += ` ORDER BY o.${sort.includes('desc') ? 'id DESC' : 'id ASC'}`;

        // Sayfalama
        sql += ` LIMIT ? OFFSET ?`;

        // Sorguyu çalıştır
        const { results } = await db.prepare(sql)
            .bind(tenant_id, per_page, offset)
            .all();

        // Toplam kayıt sayısını al
        const { total } = await db.prepare(`
            SELECT COUNT(*) as total FROM orders 
            WHERE tenant_id = ? AND deleted_at IS NULL
        `).bind(tenant_id).first();

        return c.json({
            success: true,
            orders: results || [],
            pagination: {
                total,
                page,
                per_page,
                total_pages: Math.ceil(total / per_page)
            }
        });

    } catch (error) {
        console.error('Orders filtered error:', error);
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

// Workshop siparişlerini getir
router.get('/workshop', async (c) => {
    const db = c.get('db')
    const tenant_id = c.get('tenant_id')

    try {
        // Query parametrelerini al
        const url = new URL(c.req.url)
        const dateFilter = url.searchParams.get('date_filter') || 'today'
        const timeSlot = url.searchParams.get('time_slot')
        const status = url.searchParams.get('status')

        // SQL sorgusunu oluştur
        let sql = `
            SELECT 
                o.*,
                r.name as recipient_name,
                r.phone as recipient_phone,
                GROUP_CONCAT(p.name || ' x' || oi.quantity) as items_summary
            FROM orders o
            LEFT JOIN recipients r ON o.recipient_id = r.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.tenant_id = ? 
            AND o.deleted_at IS NULL
        `

        const params = [tenant_id]

        // Tarih filtresi
        switch (dateFilter) {
            case 'today':
                sql += ` AND DATE(o.delivery_date) = DATE('now')`
                break
            case 'tomorrow':
                sql += ` AND DATE(o.delivery_date) = DATE('now', '+1 day')`
                break
            case 'week':
                sql += ` AND DATE(o.delivery_date) BETWEEN DATE('now') AND DATE('now', '+7 days')`
                break
        }

        // Saat dilimi filtresi
        if (timeSlot) {
            sql += ` AND o.delivery_time = ?`
            params.push(timeSlot)
        }

        // Durum filtresi
        if (status) {
            sql += ` AND o.status = ?`
            params.push(status)
        }

        // Grup ve sıralama
        sql += `
            GROUP BY o.id
            ORDER BY 
                o.delivery_date ASC,
                CASE o.delivery_time 
                    WHEN 'morning' THEN 1 
                    WHEN 'afternoon' THEN 2 
                    WHEN 'evening' THEN 3 
                END,
                o.created_at ASC
        `

        // Sorguyu çalıştır
        const { results } = await db.prepare(sql).bind(...params).all()

        return c.json({
            success: true,
            orders: results || []
        })

    } catch (error) {
        console.error('Workshop orders error:', error)
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
        // Geçerli durumları kontrol et
        const validStatuses = ['new', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']
        if (!validStatuses.includes(status)) {
            return c.json({
                success: false,
                error: 'Invalid status'
            }, 400)
        }

        // Durumu güncelle
        await db.prepare(`
            UPDATE orders 
            SET status = ?,
                status_updated_at = datetime('now'),
                updated_at = datetime('now')
            WHERE id = ?
            AND tenant_id = ?
        `).bind(status, id, tenant_id).run()

        return c.json({ success: true })

    } catch (error) {
        console.error('Status update error:', error)
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500)
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

// Yeni sipariş oluşturma SQL'i güncellendi
router.post('/', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const body = await c.req.json()
    console.log('Order request body:', body)

    // 1. Orders tablosuna bakalım
    /*
    CREATE TABLE orders (
        tenant_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        recipient_id INTEGER NOT NULL,    
        address_id INTEGER NOT NULL,      
        delivery_date DATE NOT NULL,
        delivery_time TEXT CHECK(delivery_time IN ('morning','afternoon','evening')) NOT NULL,
        status TEXT DEFAULT 'new',
        payment_method TEXT CHECK(payment_method IN ('cash','credit_card','bank_transfer')),
        payment_status TEXT DEFAULT 'pending',
        subtotal DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        created_by INTEGER NOT NULL,
        // ...
    )
    */

    // 2. Önce alıcı (recipient) kaydı yap
    const recipientResult = await db.prepare(`
      INSERT INTO recipients (
        tenant_id, customer_id, name, phone, 
        notes, created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      tenant_id,
      body.customer_id,
      body.recipient_name,
      body.recipient_phone,
      body.recipient_note || null
    ).run()

    const recipient_id = recipientResult.meta?.last_row_id
    if (!recipient_id) throw new Error('Alıcı kaydedilemedi')

    // 3. Siparişi kaydet - required fields ekledik
    const orderResult = await db.prepare(`
      INSERT INTO orders (
        tenant_id,             -- 1 
        customer_id,          -- 2
        recipient_id,         -- 3 
        address_id,           -- 4
        delivery_date,        -- 5 
        delivery_time,        -- 6
        status,              -- 7
        payment_method,       -- 8 
        payment_status,       -- 9
        subtotal,            -- 10
        total_amount,        -- 11
        created_by,          -- 12 - REQUIRED!
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      tenant_id,                    // 1
      body.customer_id,            // 2  
      recipient_id,                // 3 
      body.address_id,             // 4
      body.delivery_date,          // 5
      body.delivery_time,          // 6
      'new',                       // 7
      body.payment_method,         // 8
      'pending',                   // 9
      body.subtotal,              // 10
      body.total_amount,          // 11
      1                           // 12 - created_by eklendi
    ).run()

    // Debug log ekleyelim
    console.log('Order insert result:', orderResult)

    const order_id = orderResult.meta?.last_row_id
    if (!order_id) throw new Error('Sipariş kaydedilemedi')

    // 3. Sipariş kalemlerini ekle
    for (const item of body.items) {
      await db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, 
          quantity, unit_price, total_amount,
          created_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        order_id,
        item.product_id,
        item.quantity,
        item.unit_price,
        item.quantity * item.unit_price
      ).run()
    }

    return c.json({
      success: true,
      order: {
        id: order_id
      }
    })

  } catch (error) {
    // Hata detaylarını logla
    console.error('[Order Error]:', {
      message: error.message,
      stack: error.stack,
      body: body
    })
    
    return c.json({
      success: false,
      error: 'Sipariş oluşturulamadı',
      details: error.message
    }, 500)
  }
})

// Helper function: Sipariş sayısını getir - SQL güncellendi
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