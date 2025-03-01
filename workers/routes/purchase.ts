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

// Yeni satın alma ekle - Mevcut veritabanı şemasına uygun
router.post('/orders', async (c) => {
    const db = c.get('db');
    const user_id = c.get('user_id') || 1;
    
    try {
        const data = await c.req.json();
        console.log('Satın alma verisi:', data); 
        const { supplier_id, order_date, items, total_amount } = data;

        // Validasyonlar
        if (!supplier_id || !order_date || !Array.isArray(items) || items.length === 0) {
            return c.json({
                success: false,
                error: 'Eksik ya da hatalı veriler'
            }, 400);
        }

        // 1. Ana siparişi oluştur - created_at alanı kaldırıldı
        const orderResult = await db.prepare(`
            INSERT INTO purchase_orders (
                supplier_id, order_date, created_by,
                payment_status, total_amount
            ) VALUES (?, ?, ?, 'pending', ?)
            RETURNING id
        `).bind(
            supplier_id,
            order_date,
            user_id,
            total_amount || 0
        ).first();

        const order_id = orderResult.id;

        // 2. Kalemleri batch olarak ekle
        if (items && items.length > 0) {
            const itemInserts = items.map(item => 
                db.prepare(`
                    INSERT INTO purchase_order_items (
                        order_id, material_id, quantity, unit_price
                    ) VALUES (?, ?, ?, ?)
                `).bind(
                    order_id, 
                    item.material_id,
                    item.quantity,
                    item.unit_price
                )
            );

            await db.batch(itemInserts);
        }

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

// Ödeme endpoint'i - updated_at alanı kaldırıldı
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
    
    // Ödeme yöntemine göre doğru kategori ID'sini belirle
    let categoryId = 2; // Varsayılan değer
    
    switch (paymentMethod) {
      case 'cash':
        categoryId = 1; // Nakit Alışveriş
        break;
      case 'credit_card':
        categoryId = 2; // Kredi Kartı Alışveriş
        break;
      case 'bank_transfer':
        categoryId = 3; // Banka Havalesi
        break;
      default:
        categoryId = 1; // Bilinmeyen durumda nakit varsay
    }
    
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
      // Sipariş güncelle - updated_at alanı kaldırıldı
      db.prepare(`
        UPDATE purchase_orders
        SET paid_amount = ?,
            payment_status = ?
        WHERE id = ?
      `).bind(newPaidAmount, newPaymentStatus, id),
      
      // Finansal kayıt oluştur - kategori ID'si dinamik olarak atanıyor
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
        ) VALUES (?, ?, 'out', ?, datetime('now'), 'purchase', ?, ?, ?, ?, 'paid', 1)
      `).bind(
        accountId,
        categoryId, // Artık dinamik olarak belirleniyor
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

/**
 * Ham madde ihtiyaçları listesi
 * Filtreler: kategori, stok durumu, tarih aralığı
 */
router.get('/needs', async (c) => {
    const db = c.get('db')
    
    try {
        // Query parametrelerini al
        const categoryId = c.req.query('category_id')
        const stockStatus = c.req.query('stock_status')
        const timeRange = c.req.query('time_range')
        const startDate = c.req.query('start_date')
        const endDate = c.req.query('end_date')
        
        // Tarih aralığını belirle
        let dateFilterStart, dateFilterEnd
        if (startDate && endDate) {
            dateFilterStart = startDate
            dateFilterEnd = endDate
        } else {
            // Varsayılan tarih aralığı hesapla
            const today = new Date()
            dateFilterStart = today.toISOString().split('T')[0]
            
            let days = 3 // Default: 3 gün
            switch (timeRange) {
                case 'today':
                    days = 0
                    break
                case 'tomorrow':
                    days = 1
                    break
                case 'week':
                    days = 7
                    break
                case '2weeks':
                    days = 14
                    break
                case 'month':
                    days = 30
                    break
                default:
                    days = parseInt(timeRange) || 3
            }
            
            const endDate = new Date(today)
            endDate.setDate(today.getDate() + days)
            dateFilterEnd = endDate.toISOString().split('T')[0]
        }
        
        // SQL sorgusu oluştur - Sipariş temelli ham madde ihtiyaçları
        const query = `
            WITH order_materials AS (
                -- Sipariş ürünlerinden ham madde ihtiyaçlarını hesapla
                SELECT
                    o.id as order_id,
                    o.delivery_date,
                    oim.material_id,
                    SUM(oim.quantity) as needed_quantity
                FROM
                    orders o
                JOIN
                    order_items_materials oim ON o.id = oim.order_id
                WHERE
                    o.status NOT IN ('cancelled', 'delivered')
                    AND o.deleted_at IS NULL
                    AND o.delivery_date BETWEEN ? AND ?
                    ${categoryId ? 'AND oim.material_id IN (SELECT id FROM raw_materials WHERE category_id = ?)' : ''}
                GROUP BY
                    o.id, o.delivery_date, oim.material_id
            ),
            stock_summary AS (
                -- Her malzeme için stok durumu hesapla
                SELECT
                    sm.material_id,
                    SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity ELSE 0 END) -
                    SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as stock_quantity
                FROM
                    stock_movements sm
                WHERE
                    sm.deleted_at IS NULL
                GROUP BY
                    sm.material_id
            )
            SELECT
                rm.id as material_id,
                rm.name as material_name,
                rm.description,
                rmc.id as category_id,
                rmc.name as category_name,
                u.name as unit_name,
                u.code as unit_code,
                SUM(om.needed_quantity) as needed_quantity,
                COUNT(DISTINCT om.order_id) as order_count,
                COALESCE(ss.stock_quantity, 0) as stock_quantity,
                COALESCE(rm.min_stock, 0) as min_stock,
                CASE
                    WHEN COALESCE(ss.stock_quantity, 0) = 0 THEN 'out_of_stock'
                    WHEN COALESCE(ss.stock_quantity, 0) < COALESCE(rm.min_stock, 0) THEN 'low_stock'
                    WHEN COALESCE(ss.stock_quantity, 0) < SUM(om.needed_quantity) THEN 'insufficient'
                    ELSE 'in_stock'
                END as stock_status,
                COALESCE(rm.avg_unit_price, 0) * 
                  GREATEST(0, SUM(om.needed_quantity) - COALESCE(ss.stock_quantity, 0)) as estimated_cost
            FROM
                order_materials om
            JOIN
                raw_materials rm ON om.material_id = rm.id
            LEFT JOIN
                raw_material_categories rmc ON rm.category_id = rmc.id
            LEFT JOIN
                units u ON rm.unit_id = u.id
            LEFT JOIN
                stock_summary ss ON rm.id = ss.material_id
            WHERE
                rm.deleted_at IS NULL
                ${stockStatus ? "AND (CASE WHEN COALESCE(ss.stock_quantity, 0) = 0 THEN 'out_of_stock' " +
                                "WHEN COALESCE(ss.stock_quantity, 0) < COALESCE(rm.min_stock, 0) THEN 'low_stock' " +
                                "WHEN COALESCE(ss.stock_quantity, 0) < SUM(om.needed_quantity) THEN 'insufficient' " +
                                "ELSE 'in_stock' END) = ?" : ''}
            GROUP BY
                rm.id, rm.name, rm.description, rmc.id, rmc.name, u.name, u.code, ss.stock_quantity, rm.min_stock
            ORDER BY
                stock_status, rmc.name, rm.name
        `
        
        // Parametreleri hazırla
        const params = [dateFilterStart, dateFilterEnd]
        if (categoryId) params.push(categoryId)
        if (stockStatus) params.push(stockStatus)
        
        // Sorguyu çalıştır
        const { results } = await db.prepare(query).bind(...params).all()
        
        return c.json({
            success: true,
            needs: results || [],
            filters: {
                date_range: {
                    start: dateFilterStart,
                    end: dateFilterEnd
                },
                category_id: categoryId,
                stock_status: stockStatus
            }
        })
    } catch (error) {
        console.error('Purchases needs error:', error)
        return c.json({
            success: false,
            error: 'Sipariş bazlı ihtiyaçlar yüklenirken hata oluştu',
            details: error.message
        }, 500)
    }
})

/**
 * Ham madde detayı ve kullanıldığı siparişler
 */
router.get('/needs/:materialId', async (c) => {
    const materialId = c.req.param('materialId')
    const db = c.get('db')
    
    try {
        // Ham madde bilgisi
        const material = await db.prepare(`
            SELECT
                rm.*,
                rmc.name as category_name,
                u.name as unit_name,
                u.code as unit_code,
                (
                    SELECT
                        SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity ELSE -sm.quantity END)
                    FROM
                        stock_movements sm
                    WHERE
                        sm.material_id = rm.id
                        AND sm.deleted_at IS NULL
                ) as current_stock
            FROM
                raw_materials rm
            LEFT JOIN
                raw_material_categories rmc ON rm.category_id = rmc.id
            LEFT JOIN
                units u ON rm.unit_id = u.id
            WHERE
                rm.id = ?
                AND rm.deleted_at IS NULL
        `).bind(materialId).first()
        
        if (!material) {
            return c.json({
                success: false,
                error: 'Ham madde bulunamadı'
            }, 404)
        }
        
        // Malzemenin kullanıldığı siparişler
        const { results: orderNeeds } = await db.prepare(`
            SELECT
                o.id as order_id,
                o.delivery_date,
                oi.product_id,
                p.name as product_name,
                oim.quantity
            FROM
                order_items_materials oim
            JOIN
                orders o ON oim.order_id = o.id
            JOIN
                order_items oi ON oim.order_item_id = oi.id
            JOIN
                products p ON oi.product_id = p.id
            WHERE
                oim.material_id = ?
                AND o.status NOT IN ('cancelled', 'delivered')
                AND o.deleted_at IS NULL
            ORDER BY
                o.delivery_date
        `).bind(materialId).all()
        
        return c.json({
            success: true,
            material,
            needs: orderNeeds || []
        })
    } catch (error) {
        console.error('Material needs detail error:', error)
        return c.json({
            success: false,
            error: 'Ham madde detayları yüklenirken hata oluştu',
            details: error.message
        }, 500)
    }
})

export default router;
