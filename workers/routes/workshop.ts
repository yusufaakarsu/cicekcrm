import { Hono } from 'hono'

const router = new Hono()

// Atölye siparişlerini getir
router.get('/', async (c) => {
    const db = c.get('db')
    const tenant_id = c.get('tenant_id')

    try {
        console.log('Loading workshop orders...');
        
        const { results } = await db.prepare(`
            SELECT 
                o.*,
                r.name as recipient_name,
                GROUP_CONCAT(p.name || ' x' || oi.quantity) as items_summary
            FROM orders o
            LEFT JOIN recipients r ON o.recipient_id = r.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.tenant_id = ? 
            AND o.status IN ('new', 'preparing', 'ready')
            AND o.deleted_at IS NULL
            GROUP BY o.id
            ORDER BY o.delivery_date ASC, o.delivery_time ASC
        `).bind(tenant_id).all()

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

// Hazırlamaya başla
router.post('/:id/start', async (c) => {
    const db = c.get('db')
    const tenant_id = c.get('tenant_id')
    const { id } = c.req.param()

    try {
        await db.prepare(`
            UPDATE orders 
            SET status = 'preparing',
                preparation_start = CURRENT_TIMESTAMP,
                prepared_by = ?
            WHERE id = ? AND tenant_id = ?
        `).bind(1, id, tenant_id).run()

        return c.json({ success: true })
    } catch (error) {
        return c.json({ success: false, error: error.message }, 500)
    }
})

// Hazırlamayı tamamla
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
