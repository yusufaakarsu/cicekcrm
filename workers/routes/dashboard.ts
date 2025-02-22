import { Hono } from 'hono';

const router = new Hono();

router.get('/', async (c) => {
    const db = c.get('db');
    const tenant_id = c.get('tenant_id');

    try {
        // Teslimat istatistikleri
        const deliveryStats = await db.prepare(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
                SUM(CASE WHEN status IN ('new','preparing','ready') THEN 1 ELSE 0 END) as pending_orders
            FROM orders 
            WHERE tenant_id = ?
            AND delivery_date = CURRENT_DATE
        `).bind(tenant_id).first();

        // Sipariş özeti - bugün/yarın/gelecek
        const { results: orderSummary } = await db.prepare(`
            SELECT 
                date(delivery_date) as date,
                COUNT(*) as count
            FROM orders
            WHERE tenant_id = ?
            AND delivery_date >= CURRENT_DATE
            AND status != 'cancelled'
            GROUP BY date(delivery_date)
            ORDER BY delivery_date ASC
            LIMIT 3
        `).bind(tenant_id).all();

        // Kritik stok
        const { results: tomorrowNeeds } = await db.prepare(`
            SELECT m.name, m.current_stock, m.min_stock,
                   (m.min_stock - m.current_stock) as needed_quantity
            FROM raw_materials m
            WHERE m.tenant_id = ?
            AND m.current_stock < m.min_stock
            ORDER BY needed_quantity DESC
            LIMIT 5
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
