import { Hono } from 'hono';

const router = new Hono();

// Satın alma listesi
router.get('/orders', async (c) => {
    const db = c.get('db');
    
    try {
        // Filtre parametrelerini al
        const url = new URL(c.req.url);
        const supplier_id = url.searchParams.get('supplier_id');
        const payment_status = url.searchParams.get('payment_status');
        const date_filter = url.searchParams.get('date_filter');
        const start_date = url.searchParams.get('start_date');
        const end_date = url.searchParams.get('end_date');
        const min_amount = url.searchParams.get('min_amount');
        const max_amount = url.searchParams.get('max_amount');

        // Base SQL
        let sql = `
            SELECT 
                po.*,
                s.name as supplier_name,
                s.phone as supplier_phone,
                u.name as created_by_name,
                COUNT(poi.id) as item_count,
                COALESCE(SUM(poi.quantity * poi.unit_price), 0) as calculated_total
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            LEFT JOIN users u ON po.created_by = u.id
            LEFT JOIN purchase_order_items poi ON po.id = poi.order_id 
                AND poi.deleted_at IS NULL
            WHERE po.deleted_at IS NULL
        `;

        const params = [];

        // Tedarikçi filtresi
        if (supplier_id) {
            sql += ` AND po.supplier_id = ?`;
            params.push(supplier_id);
        }

        // Ödeme durumu filtresi
        if (payment_status) {
            sql += ` AND po.payment_status = ?`;
            params.push(payment_status);
        }

        // Tarih filtresi
        if (date_filter) {
            switch(date_filter) {
                case 'today':
                    sql += ` AND DATE(po.order_date) = DATE('now')`;
                    break;
                case 'week':
                    sql += ` AND po.order_date >= date('now', '-7 days')`;
                    break;
                case 'month':
                    sql += ` AND strftime('%Y-%m', po.order_date) = strftime('%Y-%m', 'now')`;
                    break;
                case 'custom':
                    if (start_date && end_date) {
                        sql += ` AND po.order_date BETWEEN ? AND ?`;
                        params.push(start_date, end_date);
                    }
                    break;
            }
        }

        // Tutar filtresi
        if (min_amount) {
            sql += ` AND po.total_amount >= ?`;
            params.push(min_amount);
        }
        if (max_amount) {
            sql += ` AND po.total_amount <= ?`;
            params.push(max_amount);
        }

        // Gruplama ve sıralama
        sql += ` GROUP BY po.id ORDER BY po.order_date DESC`;

        // Sorguyu çalıştır
        const { results } = await db.prepare(sql).bind(...params).all();
        
        return c.json({
            success: true,
            orders: results
        });
        
    } catch (error) {
        console.error('Database error:', error);
        return c.json({ 
            success: false, 
            error: 'Database error',
            message: error.message 
        }, 500);
    }
});

// Satın alma detayı
router.get('/orders/:id', async (c) => {
    const db = c.get('db');
    const { id } = c.req.param();
    
    try {
        // Ana sipariş bilgileri
        const order = await db.prepare(`
            SELECT 
                po.*,
                s.name as supplier_name,
                s.phone as supplier_phone,
                s.email as supplier_email,
                u.name as created_by_name
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            LEFT JOIN users u ON po.created_by = u.id
            WHERE po.id = ? 
            AND po.deleted_at IS NULL
        `).bind(id).first();

        if (!order) {
            return c.json({
                success: false,
                error: 'Sipariş bulunamadı'
            }, 404);
        }

        // Sipariş kalemleri
        const { results: items } = await db.prepare(`
            SELECT 
                poi.*,
                rm.name as material_name,
                rm.description as material_description,
                u.name as unit_name,
                u.code as unit_code
            FROM purchase_order_items poi
            LEFT JOIN raw_materials rm ON poi.material_id = rm.id
            LEFT JOIN units u ON rm.unit_id = u.id
            WHERE poi.order_id = ? 
            AND poi.deleted_at IS NULL
        `).bind(id).all();

        return c.json({
            success: true,
            order: {
                ...order,
                items: items || []
            }
        });

    } catch (error) {
        console.error('Purchase order detail error:', error);
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

// Yeni satın alma ekle
router.post('/orders', async (c) => {
    const db = c.get('db');
    const tenant_id = c.get('tenant_id');
    const user_id = c.get('user_id') || 1;
    
    try {
        const data = await c.req.json();
        const { supplier_id, order_date, items } = data;

        // Validasyonlar
        if (!supplier_id || !order_date || !Array.isArray(items) || items.length === 0) {
            return c.json({
                success: false,
                error: 'Eksik ya da hatalı veriler'
            }, 400);
        }

        // 1. Ana siparişi oluştur ve ID'sini al 
        const orderResult = await db.prepare(`
            INSERT INTO purchase_orders (
                tenant_id, supplier_id, order_date, created_by,
                created_at, payment_status
            ) VALUES (?, ?, ?, ?, datetime('now'), 'pending')
            RETURNING id
        `).bind(
            tenant_id,
            supplier_id,
            order_date,
            user_id
        ).first();

        const order_id = orderResult.id;

        // 2. Kalemleri batch olarak ekle
        const itemInserts = items.map(item => 
            db.prepare(`
                INSERT INTO purchase_order_items (
                    order_id, material_id, quantity, unit_price, created_at
                ) VALUES (?, ?, ?, ?, datetime('now'))
            `).bind(
                order_id, 
                item.material_id,
                item.quantity,
                item.unit_price
            )
        );

        await db.batch(itemInserts);

        return c.json({
            success: true,
            order_id: order_id,
            message: 'Satın alma kaydı oluşturuldu'
        });

    } catch (error) {
        console.error('Purchase order error:', error);
        return c.json({ 
            success: false, 
            error: 'İşlem başarısız',
            details: error.message
        }, 500);
    }
});

router.put('/orders/:id/status', async (c) => {
    const db = c.get('db');
    const { id } = c.req.param();
    
    try {
        // 1. Önce siparişi kontrol et
        const order = await db.prepare(`
            SELECT payment_status, paid_amount, deleted_at 
            FROM purchase_orders 
            WHERE id = ?
        `).bind(id).first();
        
        // 2. Sipariş kontrolü
        if (!order || order.deleted_at) {
            return c.json({
                success: false,
                error: 'Sipariş bulunamadı'
            }, 404);
        }

        // 3. İptal edilmiş siparişi tekrar iptal etmeye çalışma
        if (order.payment_status === 'cancelled') {
            return c.json({
                success: false,
                error: 'Sipariş zaten iptal edilmiş'
            }, 400);
        }

        // 4. Ödeme yapılmış siparişi iptal etmeye çalışma
        if (order.paid_amount > 0) {
            return c.json({
                success: false,
                error: 'Ödemesi yapılmış sipariş iptal edilemez'
            }, 400);
        }

        // 5. Durumu güncelle - updated_at KALDIRILDI!
        await db.prepare(`
            UPDATE purchase_orders 
            SET payment_status = 'cancelled'
            WHERE id = ?
        `).bind(id).run();

        return c.json({ 
            success: true,
            message: 'Sipariş başarıyla iptal edildi'
        });

    } catch (error) {
        console.error('Status update error:', error);
        return c.json({
            success: false,
            error: 'İptal işlemi başarısız',
            details: error.message
        }, 500);
    }
});

// Ödeme endpoint'i - transaction yerine batch kullanım
router.post('/orders/:id/payment', async (c) => {
  const db = c.get('db');
  const { id } = c.req.param();
  
  try {
    // Önce siparişi kontrol et
    const order = await db.prepare(`
      SELECT * FROM purchase_orders 
      WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();
    
    if (!order) {
      return c.json({ 
        success: false, 
        error: 'Sipariş bulunamadı' 
      }, 404);
    }
    
    // İptal edilmiş siparişe ödeme yapılamaz
    if (order.payment_status === 'cancelled') {
      return c.json({
        success: false, 
        error: 'İptal edilmiş siparişe ödeme yapılamaz'
      }, 400);
    }
    
    // Ödeme verilerini al
    const body = await c.req.json();
    const amount = parseFloat(body.amount);
    const paymentMethod = body.payment_method || 'cash';
    const accountId = body.account_id || 1;
    const notes = body.notes || null;
    
    // Validasyonlar
    if (isNaN(amount) || amount <= 0) {
      return c.json({ 
        success: false, 
        error: 'Geçersiz ödeme tutarı' 
      }, 400);
    }
    
    // Ödeme tutarı kontrolü
    const currentPaid = parseFloat(order.paid_amount || '0');
    const totalAmount = parseFloat(order.total_amount);
    
    if (currentPaid + amount > totalAmount) {
      return c.json({
        success: false,
        error: 'Ödeme tutarı, kalan tutardan fazla olamaz'
      }, 400);
    }
    
    // Yeni ödeme durumu
    const newPaidAmount = currentPaid + amount;
    const newPaymentStatus = newPaidAmount >= totalAmount ? 'paid' : 'partial';
    
    // Batch kullanarak tüm işlemleri atomik olarak yap
    await db.batch([
      // Sipariş güncelle
      db.prepare(`
        UPDATE purchase_orders
        SET paid_amount = ?,
            payment_status = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(newPaidAmount, newPaymentStatus, id),
      
      // Finansal kayıt oluştur
      db.prepare(`
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
        ) VALUES (?, 2, 'out', ?, datetime('now'), 'purchase', ?, ?, ?, ?, 'paid', 1)
      `).bind(
        accountId,
        amount,
        id,
        paymentMethod,
        `Satın alma #${id} ödemesi`,
        notes
      )
    ]);
    
    return c.json({
      success: true,
      payment_status: newPaymentStatus,
      paid_amount: newPaidAmount,
      message: 'Ödeme başarıyla kaydedildi'
    });
    
  } catch (error) {
    console.error('Payment error:', error);
    return c.json({
      success: false,
      error: 'Ödeme kaydedilemedi',
      details: error.message
    }, 500);
  }
});

export default router;
