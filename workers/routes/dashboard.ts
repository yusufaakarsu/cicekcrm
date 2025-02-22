import { Hono } from 'hono';

const router = new Hono();

router.get('/', async (c) => {
    const db = c.get('db');
    const tenant_id = c.get('tenant_id');

    try {
        // Teslimat istatistikleri için view kullan
        const deliveryStats = await db.prepare(`
            SELECT * FROM vw_delivery_stats 
            WHERE tenant_id = ?
        `).bind(tenant_id).first();

        // Sipariş özeti için view kullan
        const { results: orderSummary } = await db.prepare(`
            SELECT * FROM vw_order_summary 
            WHERE tenant_id = ?
            ORDER BY delivery_date ASC 
            LIMIT 3
        `).bind(tenant_id).all();

        // Düşük stok için view kullan
        const { results: tomorrowNeeds } = await db.prepare(`
            SELECT * FROM vw_critical_stock
            WHERE tenant_id = ?
        `).bind(tenant_id).all();

        return c.json({
            success: true,
            deliveryStats,
            orderSummary,
            tomorrowNeeds
        });

    } catch (error) {
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

export default router;
