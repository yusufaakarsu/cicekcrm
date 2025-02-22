import { Hono } from 'hono';

const router = new Hono();

router.get('/', async (c) => {
    const db = c.get('db');
    const tenant_id = c.get('tenant_id');

    try {
        // Debug için metrikler
        console.log('Fetching metrics for tenant:', tenant_id);

        // Tüm metrikleri tek sorguda al
        const metrics = await db.prepare(`
            SELECT 
                -- Toplam ve yeni siparişler
                (SELECT COUNT(*) FROM orders 
                    WHERE tenant_id = ? AND deleted_at IS NULL) as total_orders,
                (SELECT COUNT(*) FROM orders 
                    WHERE tenant_id = ? AND status = 'new' 
                    AND deleted_at IS NULL) as new_orders,

                -- Bugünün siparişleri ve durumları
                (SELECT COUNT(*) FROM orders 
                    WHERE tenant_id = ? AND DATE(delivery_date) = DATE('now') 
                    AND deleted_at IS NULL) as today_orders,
                (SELECT COUNT(*) FROM orders 
                    WHERE tenant_id = ? AND status = 'delivering' 
                    AND deleted_at IS NULL) as active_deliveries,
                (SELECT COUNT(*) FROM orders 
                    WHERE tenant_id = ? AND status = 'delivered' 
                    AND DATE(delivery_date) = DATE('now')
                    AND deleted_at IS NULL) as delivered_orders,
                (SELECT COUNT(*) FROM orders 
                    WHERE tenant_id = ? AND status IN ('new', 'preparing', 'ready') 
                    AND deleted_at IS NULL) as pending_deliveries,

                -- Gelir bilgisi
                (SELECT COALESCE(SUM(total_amount), 0) FROM orders 
                    WHERE tenant_id = ? AND status != 'cancelled' 
                    AND deleted_at IS NULL) as total_revenue
        `).bind(
            tenant_id, tenant_id, tenant_id, tenant_id, 
            tenant_id, tenant_id, tenant_id
        ).first();

        // Bugünün siparişleri
        const { results: todayOrders } = await db.prepare(`
            SELECT 
                o.id, o.delivery_time, o.status, o.total_amount,
                c.name as customer_name, c.phone as customer_phone,
                r.name as recipient_name, r.phone as recipient_phone,
                a.district as delivery_district,
                GROUP_CONCAT(p.name || ' x' || oi.quantity) as items
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN recipients r ON o.recipient_id = r.id
            LEFT JOIN addresses a ON o.address_id = a.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.tenant_id = ? 
            AND DATE(o.delivery_date) = DATE('now')
            AND o.deleted_at IS NULL
            GROUP BY o.id
            ORDER BY 
                CASE o.delivery_time
                    WHEN 'morning' THEN 1
                    WHEN 'afternoon' THEN 2
                    WHEN 'evening' THEN 3
                END,
                o.created_at ASC
        `).bind(tenant_id).all();

        // Debug için response
        console.log('Dashboard response:', { metrics, todayOrders });

        return c.json({
            success: true,
            metrics,
            todayOrders: todayOrders || []
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
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
