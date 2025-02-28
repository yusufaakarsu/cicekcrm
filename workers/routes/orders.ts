import { Hono } from 'hono'
import { createOrder, saveDeliveryInfo } from './new-order'

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

// Sipariş oluşturma endpoint'i - createOrder fonksiyonunu kullanır
router.post('/', async (c) => {
  const db = c.get('db')
  
  try {
    const body = await c.req.json()
    const result = await createOrder(c, db, body)
    return c.json(result)
  } catch (error) {
    return c.json({
      success: false,
      error: 'Sipariş oluşturulamadı',
      details: error.message
    }, 500)
  }
})

// Sipariş teslimat bilgilerini kaydet
router.post("/delivery", async (c) => {
  const db = c.get("db")
  
  try {
    const body = await c.req.json()
    const result = await saveDeliveryInfo(c, db, body)
    
    if (!result.success) {
      return c.json(result, 400)
    }
    
    return c.json(result)
  } catch (error) {
    return c.json({
      success: false,
      error: "Teslimat bilgileri kaydedilemedi",
      details: error.message
    }, 500)
  }
})

// Sipariş ödeme al endpoint'i kontrolü
router.post('/:id/payment', async (c) => {
  const db = c.get('db');
  const { id } = c.req.param();
  
  try {
    // Transaction başlat
    await db.exec('BEGIN TRANSACTION');
    
    // 1. Siparişi kontrol et
    const order = await db.prepare(`
      SELECT * FROM orders 
      WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();
    
    if (!order) {
      await db.exec('ROLLBACK');
      return c.json({ 
        success: false, 
        error: 'Sipariş bulunamadı' 
      }, 404);
    }

    // İptal edilmiş siparişe ödeme yapılamaz
    if (order.payment_status === 'cancelled' || order.status === 'cancelled') {
      await db.exec('ROLLBACK');
      return c.json({
        success: false,
        error: 'İptal edilmiş siparişe ödeme yapılamaz'
      }, 400);
    }
    
    // 2. Ödeme verilerini doğrula
    const body = await c.req.json();
    const amount = parseFloat(body.amount);
    const paymentMethod = body.payment_method || 'cash';
    const accountId = body.account_id || 1;
    const notes = body.notes || null;
    
    // Tutar validasyonu
    if (isNaN(amount) || amount <= 0) {
      await db.exec('ROLLBACK');
      return c.json({ 
        success: false, 
        error: 'Geçersiz ödeme tutarı' 
      }, 400);
    }
    
    // Toplam tutarı aşan ödeme kontrolü
    const currentPaid = parseFloat(order.paid_amount || '0');
    const totalAmount = parseFloat(order.total_amount);
    
    if (currentPaid + amount > totalAmount) {
      await db.exec('ROLLBACK');
      return c.json({
        success: false,
        error: 'Ödeme tutarı, kalan tutardan fazla olamaz'
      }, 400);
    }
    
    // 3. Siparişi güncelle - ödenen miktarı artır, durumu güncelle
    const newPaidAmount = currentPaid + amount;
    const newPaymentStatus = newPaidAmount >= totalAmount ? 'paid' : currentPaid > 0 ? 'partial' : 'pending';
    
    await db.prepare(`
      UPDATE orders
      SET 
        paid_amount = ?,
        payment_status = ?,
        updated_at = datetime('now'),
        updated_by = 1
      WHERE id = ?
    `).bind(
      newPaidAmount,
      newPaymentStatus,
      id
    ).run();
    
    // 4. Ödeme işlemini finans tablosuna kaydet
    await db.prepare(`
      INSERT INTO transactions (
        account_id, 
        category_id,
        type,
        amount,
        date,
        related_type,
        related_id,
        payment_method,
        description,
        notes,
        status,
        created_by
      ) VALUES (?, 1, 'in', ?, datetime('now'), 'order', ?, ?, ?, ?, 'paid', 1)
    `).bind(
      accountId,
      amount,
      id,
      paymentMethod,
      `Sipariş #${id} ödemesi`,
      notes
    ).run();
    
    // 5. Hesap bakiyesini güncelle (isteğe bağlı)
    await db.prepare(`
      UPDATE accounts
      SET balance_calculated = balance_calculated + ?
      WHERE id = ?
    `).bind(amount, accountId).run();
    
    // Transaction'ı commitle
    await db.exec('COMMIT');
    
    return c.json({
      success: true,
      payment_status: newPaymentStatus,
      paid_amount: newPaidAmount
    });
    
  } catch (error) {
    // Hata durumunda transaction'ı rollback yap
    await db.exec('ROLLBACK');
    
    console.error('Payment error:', error);
    return c.json({ 
      success: false, 
      error: 'Ödeme kaydedilirken bir hata oluştu',
      details: error.message 
    }, 500);
  }
});

export default router