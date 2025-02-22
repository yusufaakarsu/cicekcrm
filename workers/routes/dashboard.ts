import { Hono } from 'hono';

const router = new Hono();

router.get('/', async (c) => {
    const db = c.get('db');
    const tenant_id = c.get('tenant_id');

    try {
        // Özet metrikleri al
        const metrics = await db.prepare(`
            SELECT 
                COUNT(DISTINCT o.id) as total_orders,
                COUNT(DISTINCT CASE WHEN o.status = 'new' THEN o.id END) as new_orders,
                COUNT(DISTINCT CASE WHEN o.status = 'delivering' THEN o.id END) as active_deliveries,
                COUNT(DISTINCT CASE WHEN DATE(o.delivery_date) = DATE('now') THEN o.id END) as today_deliveries,
                COUNT(DISTINCT c.id) as total_customers,
                COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount END), 0) as total_revenue
            FROM orders o
            LEFT JOIN customers c ON c.tenant_id = o.tenant_id
            WHERE o.tenant_id = ? AND o.deleted_at IS NULL
        `).bind(tenant_id).first();

        // Bugünün siparişleri
        const todayOrders = await db.prepare(`
            SELECT 
                o.*,
                c.name as customer_name,
                c.phone as customer_phone,
                r.name as recipient_name,
                r.phone as recipient_phone,
                a.district as delivery_district,
                GROUP_CONCAT(p.name || ' x' || oi.quantity) as items
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN recipients r ON o.recipient_id = r.id
            LEFT JOIN addresses a ON o.address_id = a.id
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.tenant_id = ? 
            AND DATE(o.delivery_date) = DATE('now')
            AND o.status != 'cancelled'
            AND o.deleted_at IS NULL
            GROUP BY o.id
            ORDER BY o.delivery_time ASC
        `).bind(tenant_id).all();

        return c.json({
            success: true,
            metrics,
            todayOrders: todayOrders.results
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        return c.json({
            success: false,
            error: 'Database error'
        }, 500);
    }
});

// Son siparişler endpoint'i ekle
router.get('/recent-orders', async (c) => {
    const db = c.get('db');
    const tenant_id = c.get('tenant_id');

    try {
        const { results: orders } = await db.prepare(`
            SELECT 
                o.id,
                o.delivery_date,
                o.delivery_time,
                o.status,
                o.total_amount,
                c.name as customer_name,
                c.phone as customer_phone,
                GROUP_CONCAT(p.name) as items_summary
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.tenant_id = ?
            AND o.deleted_at IS NULL
            GROUP BY o.id
            ORDER BY o.created_at DESC
            LIMIT 10
        `).bind(tenant_id).all();

        return c.json({
            success: true,
            orders
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
