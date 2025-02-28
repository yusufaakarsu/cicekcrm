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

// Hazırlamayı tamamla - "preparing" siparişleri için
router.post('/:id/complete', async (c) => {
    const db = c.get('db')
    const tenant_id = c.get('tenant_id')
    const { id } = c.req.param()
    const { materials } = await c.req.json()

    try {
        // 1. Malzemeleri kaydet - fiyatlar trigger ile hesaplanacak
        for (const material of materials) {
            const { material_id, quantity } = material

            await db.prepare(`
                INSERT INTO order_items_materials (
                    tenant_id,
                    order_id,
                    material_id,
                    quantity,
                    created_at
                ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(tenant_id, id, material_id, quantity).run()
        }

        // 2. Sipariş durumunu güncelle
        await db.prepare(`
            UPDATE orders 
            SET status = 'ready',
                preparation_end = CURRENT_TIMESTAMP
            WHERE id = ? AND tenant_id = ?
        `).bind(id, tenant_id).run()

        return c.json({ success: true })

    } catch (error) {
        // Stok yetersiz hatası özel olarak yakala
        if (error.message.includes('Yetersiz stok')) {
            return c.json({ 
                success: false, 
                error: 'Yetersiz stok miktarı'
            }, 400)
        }

        return c.json({ 
            success: false, 
            error: error.message 
        }, 500)
    }
})

export default router
