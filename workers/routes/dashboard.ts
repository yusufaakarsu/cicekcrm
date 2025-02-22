import { Hono } from 'hono';

const router = new Hono();

router.get('/', async (c) => {
    const db = c.get('db');
    const tenant_id = c.get('tenant_id');

    try {
        // Teslimat istatistikleri - bugünün siparişleri
        const deliveryStats = await db.prepare(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
                SUM(CASE WHEN status IN ('new','preparing','ready','delivering') THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_revenue
            FROM orders 
            WHERE tenant_id = ?
            AND date(delivery_date) = date('now')
            AND status != 'cancelled'
        `).bind(tenant_id).first();

        // Kritik stok seviyesi - malzeme bazlı
        const { results: lowStock } = await db.prepare(`
            SELECT rm.id, rm.name, rm.current_stock, u.name as unit
            FROM raw_materials rm
            JOIN units u ON rm.unit_id = u.id
            WHERE rm.tenant_id = ?
            AND rm.current_stock <= rm.min_stock
            AND rm.status = 'active'
            ORDER BY (rm.min_stock - rm.current_stock) DESC
            LIMIT 5
        `).bind(tenant_id).all();

        // Sipariş özeti (bugün/yarın/gelecek)
        const { results: orderSummary } = await db.prepare(`
            SELECT 
                date(delivery_date) as date,
                COUNT(*) as count,
                SUM(total_amount) as total_amount
            FROM orders
            WHERE tenant_id = ?
            AND delivery_date >= date('now')
            AND status NOT IN ('delivered', 'cancelled')
            GROUP BY date(delivery_date)
            ORDER BY delivery_date ASC
            LIMIT 3
        `).bind(tenant_id).all();

        // Son 5 sipariş
        const { results: recentOrders } = await db.prepare(`
            SELECT 
                o.id,
                o.delivery_date,
                o.delivery_time,
                o.status,
                o.total_amount,
                c.name as customer_name,
                c.phone as customer_phone,
                GROUP_CONCAT(oi.quantity || 'x ' || p.name) as items_summary
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.tenant_id = ?
            AND o.deleted_at IS NULL
            GROUP BY o.id
            ORDER BY o.created_at DESC
            LIMIT 5
        `).bind(tenant_id).all();

        return c.json({
            success: true,
            deliveryStats,
            lowStock,
            orderSummary,
            recentOrders
        });

    } catch (error) {
        console.error('Dashboard veri hatası:', error);
        return c.json({ success: false, error: error.message }, 500);
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
