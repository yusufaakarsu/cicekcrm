import { Hono } from 'hono'

const router = new Hono()

// Atölye siparişlerini getir - doğrudan yeni siparişleri alacak şekilde değiştirildi
router.get('/', async (c) => {
    const db = c.get('db')
    
    try {
        console.log('Loading workshop orders...');
        
        // Filtreleri URL'den al
        const dateFilter = c.req.query('date_filter') || 'today';
        const timeSlot = c.req.query('time_slot');
        
        // Tarih filtresi için SQL koşulu
        let dateCondition = "DATE(o.delivery_date) = DATE('now')";
        if (dateFilter === 'tomorrow') {
            dateCondition = "DATE(o.delivery_date) = DATE('now', '+1 day')";
        } else if (dateFilter === 'week') {
            dateCondition = "DATE(o.delivery_date) BETWEEN DATE('now') AND DATE('now', '+7 days')";
        }
        
        // Zaman dilimi filtresi için SQL koşulu
        const timeCondition = timeSlot ? `AND o.delivery_time = '${timeSlot}'` : '';
        
        const { results } = await db.prepare(`
            SELECT 
                o.*,
                r.name as recipient_name,
                r.phone as recipient_phone,
                a.district, a.neighborhood,
                GROUP_CONCAT(p.name || ' x' || oi.quantity) as items_summary,
                COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN recipients r ON o.recipient_id = r.id
            LEFT JOIN addresses a ON o.address_id = a.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE ${dateCondition}
            ${timeCondition}
            AND o.status IN ('new', 'preparing', 'ready')
            AND o.deleted_at IS NULL
            GROUP BY o.id
            ORDER BY 
                CASE o.status
                    WHEN 'new' THEN 1
                    WHEN 'preparing' THEN 2
                    WHEN 'ready' THEN 3
                END,
                o.delivery_date ASC, 
                CASE o.delivery_time
                    WHEN 'morning' THEN 1
                    WHEN 'afternoon' THEN 2
                    WHEN 'evening' THEN 3
                END
        `).all()

        console.log('Workshop orders loaded:', results?.length || 0);

        return c.json({ 
            success: true, 
            orders: results || [] 
        })

    } catch (error) {
        console.error('Workshop orders error:', error);
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500)
    }
})

// Hazırlamaya başla - "new" siparişleri için
router.post('/:id/start', async (c) => {
    const db = c.get('db')
    const { id } = c.req.param()
    
    try {
        // Önce sipariş durumunu kontrol et
        const { results: orders } = await db.prepare(`
            SELECT status FROM orders WHERE id = ?
        `).bind(id).all();
        
        if (!orders || orders.length === 0) {
            return c.json({
                success: false,
                error: 'Sipariş bulunamadı'
            }, 404);
        }
        
        const order = orders[0];
        
        // Sadece "new" durumunda olan siparişler hazırlanmaya başlanabilir
        if (order.status !== 'new') {
            return c.json({
                success: false,
                error: 'Bu sipariş hazırlamaya başlanamaz'
            }, 400);
        }

        // Hazırlamaya başla
        await db.prepare(`
            UPDATE orders 
            SET status = 'preparing',
                preparation_start = CURRENT_TIMESTAMP,
                prepared_by = ?
            WHERE id = ?
        `).bind(1, id).run()

        return c.json({ 
            success: true,
            message: 'Sipariş hazırlanmaya başlandı'
        })
    } catch (error) {
        return c.json({ 
            success: false, 
            error: error.message 
        }, 500)
    }
})

// Hazırlamayı tamamla - STOK HAREKETLERİYLE BİRLİKTE
router.post('/:id/complete', async (c) => {
    const db = c.get('db')
    const { id } = c.req.param()
    const { materials } = await c.req.json()

    try {
        // Bağlantı için geçerli bir user ID bul
        const { results: users } = await db.prepare(`
            SELECT id FROM users LIMIT 1
        `).all();
        
        const userId = users && users.length > 0 ? users[0].id : 1;
        console.log(`Kullanıcı ID: ${userId} kullanılıyor`);

        // 1. Malzemeleri kaydet ve stok hareketi oluştur
        let savedMaterials = 0;
        for (const material of materials) {
            try {
                const { material_id, quantity } = material;
                
                // Önce bu siparişin order_item_id'sini bulalım
                const { results: items } = await db.prepare(`
                    SELECT id FROM order_items 
                    WHERE order_id = ? 
                    LIMIT 1
                `).bind(id).all();
                
                if (items && items.length > 0) {
                    const order_item_id = items[0].id;
                    
                    // 1. Order_items_materials tablosuna kaydet
                    await db.prepare(`
                        INSERT INTO order_items_materials (
                            order_id,
                            order_item_id, 
                            material_id,
                            quantity,
                            unit_price,
                            total_amount
                        ) VALUES (?, ?, ?, ?, 0, 0)
                    `).bind(id, order_item_id, material_id, quantity).run();
                    
                    // 2. Stok hareketi oluştur
                    await db.prepare(`
                        INSERT INTO stock_movements (
                            material_id,
                            movement_type,
                            quantity,
                            source_type,
                            source_id,
                            notes,
                            created_by
                        ) VALUES (?, 'out', ?, 'sale', ?, 'Sipariş hazırlama', ?)
                    `).bind(material_id, quantity, id, userId).run();
                    
                    savedMaterials++;
                }
            } catch (materialError) {
                console.error(`Malzeme kaydı hatası:`, materialError);
                // Hata olsa bile devam et
            }
        }

        // 3. Sipariş durumunu güncelle
        await db.prepare(`
            UPDATE orders 
            SET status = 'ready',
                preparation_end = CURRENT_TIMESTAMP,
                prepared_by = ?
            WHERE id = ?
        `).bind(userId, id).run();

        return c.json({ 
            success: true,
            status: 'ready',
            saved_materials: savedMaterials
        });

    } catch (error) {
        console.error('Sipariş tamamlama hatası:', error);
        return c.json({ 
            success: false, 
            error: error.message 
        }, 500);
    }
})

export default router
