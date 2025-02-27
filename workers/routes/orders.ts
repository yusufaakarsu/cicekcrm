import { Hono } from 'hono'

const router = new Hono()

// Sipariş listesi SQL'i düzeltildi - tenant_id kaldırıldı
router.get('/', async (c) => {
  const db = c.get('db')
  
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
      LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.deleted_at IS NULL
      LEFT JOIN products p ON oi.product_id = p.id AND p.deleted_at IS NULL
      WHERE o.deleted_at IS NULL
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).all()
    
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

// Bugünün siparişleri - tenant_id kaldırıldı
router.get('/today', async (c) => {
  const db = c.get('db')
  try {
    const { results } = await db.prepare(`
      SELECT o.*, c.name as customer_name 
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE DATE(o.delivery_date) = DATE('now')
      AND o.deleted_at IS NULL
      ORDER BY o.delivery_date ASC
    `).all()
    return c.json({
      success: true,
      orders: results || []
    })
  } catch (error) {
    return c.json({ 
      success: false,
      error: 'Database error' 
    }, 500)
  }
})

// Sipariş detay endpoint'i düzeltildi - tenant_id kaldırıldı
router.get('/:id/details', async (c) => {
  const db = c.get('db')
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
        COALESCE(o.custom_card_message, cm.content) as card_message
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN recipients r ON o.recipient_id = r.id
      LEFT JOIN addresses a ON o.address_id = a.id
      LEFT JOIN card_messages cm ON o.card_message_id = cm.id
      WHERE o.id = ?
      AND o.deleted_at IS NULL
    `).bind(id).first()

    if (!order) {
      return c.json({ 
        success: false,
        error: 'Order not found' 
      }, 404)
    }

    // Sipariş kalemleri ayrı sorgu ile al
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
    console.error('Order detail error:', error)
    return c.json({ 
      success: false,
      error: 'Database error',
      details: error.message 
    }, 500)
  }
})

// Filtrelenmiş siparişleri getir - tenant_id kaldırıldı, is_deleted → deleted_at olarak değiştirildi
router.get('/filtered', async (c) => {
    const db = c.get('db');

    try {
        // URL parametrelerini al
        const url = new URL(c.req.url);
        const status = url.searchParams.get('status');
        const page = parseInt(url.searchParams.get('page') || '1');
        const per_page = parseInt(url.searchParams.get('per_page') || '10');
        const sort = url.searchParams.get('sort') || 'id_desc';
        const date_filter = url.searchParams.get('date_filter') || 'all';
        const start_date = url.searchParams.get('start_date');
        const end_date = url.searchParams.get('end_date');
        
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
            LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.deleted_at IS NULL
            LEFT JOIN products p ON oi.product_id = p.id AND p.deleted_at IS NULL
            WHERE o.deleted_at IS NULL
        `;

        const params: any[] = [];

        // Status filtresi
        if (status) {
            sql += ` AND o.status = ?`;
            params.push(status);
        }

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
            case 'month':
                sql += ` AND strftime('%Y-%m', o.delivery_date) = strftime('%Y-%m', 'now')`;
                break;
            case 'custom':
                if (start_date && end_date) {
                    sql += ` AND DATE(o.delivery_date) BETWEEN ? AND ?`;
                    params.push(start_date, end_date);
                }
                break;
        }

        // Grup ve sıralama
        sql += ` GROUP BY o.id `;
        
        // Sıralama
        switch(sort) {
            case 'id_desc':
                sql += ` ORDER BY o.id DESC`;
                break;
            case 'id_asc':
                sql += ` ORDER BY o.id ASC`;
                break;
            case 'date_desc':
                sql += ` ORDER BY o.delivery_date DESC`;
                break;
            case 'date_asc':
                sql += ` ORDER BY o.delivery_date ASC`;
                break;
            case 'amount_desc':
                sql += ` ORDER BY o.total_amount DESC`;
                break;
            case 'amount_asc':
                sql += ` ORDER BY o.total_amount ASC`;
                break;
            default:
                sql += ` ORDER BY o.id DESC`;
        }

        // Sayfalama
        sql += ` LIMIT ? OFFSET ?`;
        params.push(per_page, offset);

        // Sorguyu çalıştır
        const { results } = await db.prepare(sql)
            .bind(...params)
            .all();

        // Toplam kayıt sayısını al - COUNT için ayrı sorgu
        let countSql = `
            SELECT COUNT(*) as total 
            FROM orders o
            WHERE o.deleted_at IS NULL
        `;
        
        // Status filtresi ekle
        if (status) {
            countSql += ` AND o.status = ?`;
        }

        // Tarih filtresi ekle
        switch(date_filter) {
            case 'today':
                countSql += ` AND DATE(o.delivery_date) = '${now}'`;
                break;
            case 'tomorrow':
                countSql += ` AND DATE(o.delivery_date) = DATE('${now}', '+1 day')`;
                break;
            case 'week':
                countSql += ` AND DATE(o.delivery_date) BETWEEN '${now}' AND DATE('${now}', '+7 days')`;
                break;
            case 'month':
                countSql += ` AND strftime('%Y-%m', o.delivery_date) = strftime('%Y-%m', 'now')`;
                break;
            case 'custom':
                if (start_date && end_date) {
                    countSql += ` AND DATE(o.delivery_date) BETWEEN ? AND ?`;
                }
                break;
        }

        // Count sorgu parametreleri - sadece status ve date filtrelerini içermeli
        const countParams = status ? [status] : [];
        if (date_filter === 'custom' && start_date && end_date) {
            countParams.push(start_date, end_date);
        }

        const { total } = await db.prepare(countSql)
            .bind(...countParams)
            .first() as any;

        return c.json({
            success: true,
            orders: results || [],
            pagination: {
                total: total || 0,
                page,
                per_page,
                total_pages: Math.ceil((total || 0) / per_page)
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

// Sipariş durumunu güncelle - tenant_id kaldırıldı, updated_by eklendi
router.put('/:id/status', async (c) => {
    const db = c.get('db')
    const { id } = c.req.param()
    const { status } = await c.req.json()

    try {
        // Geçerli durumları kontrol et
        const validStatuses = ['new', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']
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
                updated_at = datetime('now'),
                updated_by = ?
            WHERE id = ?
            AND deleted_at IS NULL
        `).bind(status, 1, id).run() // updated_by = 1 (admin user için)

        // Hazır durumuna geçince stok düşüm işlemi
        if (status === 'ready') {
            // Burada stok düşüm işlemi eklenmeli - sipariş malzemelerine göre stoktan düş
            await processStockMovements(db, parseInt(id));
        }

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

// Sipariş iptal et - tenant_id kaldırıldı, updated_by eklendi
router.put('/:id/cancel', async (c) => {
  const db = c.get('db')
  const { id } = c.req.param()
  
  try {
    await db.prepare(`
      UPDATE orders 
      SET status = 'cancelled',
          updated_at = DATETIME('now'),
          updated_by = ?
      WHERE id = ?
      AND deleted_at IS NULL
    `).bind(1, id).run() // updated_by = 1 (admin user için)

    return c.json({ success: true })
  } catch (error) {
    return c.json({ 
      success: false,
      error: 'Database error',
      details: error.message 
    }, 500)
  }
})

// Yeni sipariş oluşturma - tenant_id ve diğer gereksiz alanlar kaldırıldı
router.post('/', async (c) => {
  const db = c.get('db')
  
  try {
    const body = await c.req.json()
    console.log('Order request body:', body)

    // 1. Önce alıcı (recipient) kaydı yap
    const recipientResult = await db.prepare(`
      INSERT INTO recipients (
        customer_id, name, phone, 
        notes, special_dates
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      body.customer_id,
      body.recipient_name,
      body.recipient_phone,
      body.recipient_note || null,
      null // special_dates - gerekirse doldurulabilir
    ).run()

    const recipient_id = recipientResult.meta?.last_row_id
    if (!recipient_id) throw new Error('Alıcı kaydedilemedi')

    // 2. Siparişi kaydet - tablo şemasına uygun alanlar
    const orderResult = await db.prepare(`
      INSERT INTO orders (
        customer_id,          -- 1
        recipient_id,         -- 2 
        address_id,           -- 3
        delivery_date,        -- 4 
        delivery_time,        -- 5
        delivery_region,      -- 6
        delivery_fee,         -- 7
        status,               -- 8
        total_amount,         -- 9
        paid_amount,          -- 10 
        payment_status,       -- 11
        custom_card_message,  -- 12
        created_by,           -- 13
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      body.customer_id,            // 1
      recipient_id,                // 2 
      body.address_id,             // 3
      body.delivery_date,          // 4
      body.delivery_time,          // 5
      "Istanbul",                  // 6 - default value
      body.delivery_fee || 0,      // 7
      'new',                       // 8
      body.total_amount,           // 9
      0,                           // 10 - paid_amount default 0
      body.payment_status || 'pending', // 11
      body.card_message || null,   // 12
      1                            // 13 - created_by (admin user ID)
    ).run()

    const order_id = orderResult.meta?.last_row_id
    if (!order_id) throw new Error('Sipariş kaydedilemedi')

    // 3. Sipariş kalemlerini ekle
    for (const item of body.items) {
      await db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, 
          quantity, unit_price, total_amount,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        order_id,
        item.product_id,
        item.quantity,
        item.unit_price,
        item.quantity * item.unit_price,
        item.notes || null
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
      stack: error.stack
    })
    
    return c.json({
      success: false,
      error: 'Sipariş oluşturulamadı',
      details: error.message
    }, 500)
  }
})

// Stok düşüm işlemi - bu fonksiyon status ready olduğunda çağrılır
async function processStockMovements(db: D1Database, orderId: number) {
  try {
    // 1. Sipariş kalemlerini ve kullanılan malzemeleri al
    const { results: materials } = await db.prepare(`
      SELECT oim.* 
      FROM order_items_materials oim
      WHERE oim.order_id = ?
      AND oim.deleted_at IS NULL
    `).bind(orderId).all();

    // 2. Eğer malzeme kayıtları varsa stoktan düş
    if (materials && materials.length > 0) {
      for (const material of materials) {
        await db.prepare(`
          INSERT INTO stock_movements (
            material_id, movement_type, quantity,
            source_type, source_id, notes, created_by
          ) VALUES (?, 'out', ?, 'sale', ?, ?, ?)
        `).bind(
          material.material_id,
          material.quantity,
          orderId,
          'Sipariş malzeme kullanımı',
          1 // created_by = admin user
        ).run();
      }
    } else {
      // 3. Eğer malzeme kaydı yoksa, order_items'lardan ürünleri al ve
      // ürünlerin varsayılan reçetesini kullan
      const { results: orderItems } = await db.prepare(`
        SELECT oi.*, p.id as product_id
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ? AND oi.deleted_at IS NULL
      `).bind(orderId).all();

      for (const item of orderItems) {
        // Her ürün için malzeme kullanımını al
        const { results: productMaterials } = await db.prepare(`
          SELECT pm.material_id, pm.default_quantity * ? as quantity, pm.notes
          FROM product_materials pm
          WHERE pm.product_id = ?
          AND pm.deleted_at IS NULL
        `).bind(item.quantity, item.product_id).all();

        // Stok hareketlerini kaydet
        for (const material of productMaterials) {
          await db.prepare(`
            INSERT INTO stock_movements (
              material_id, movement_type, quantity,
              source_type, source_id, notes, created_by
            ) VALUES (?, 'out', ?, 'sale', ?, ?, ?)
          `).bind(
            material.material_id,
            material.quantity,
            orderId,
            'Otomatik stok düşümü: ' + (material.notes || ''),
            1 // created_by = admin user
          ).run();
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Stock movement processing error:', error);
    throw new Error('Stok düşüm işlemi başarısız: ' + error.message);
  }
}

export default router