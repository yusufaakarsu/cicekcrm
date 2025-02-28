import { Hono } from 'hono';

const router = new Hono();

router.get('/', async (c) => {
    const db = c.get('db');

    try {
        console.log('Dashboard request received');
        
        // Tenant ID referansını kaldırın (tenant_id artık kullanılmıyor)
        
        // Özet metrikleri tek sorguda al - Güvenlik için try/catch ile her sorguyu koru
        try {
            const dashboardSummary = await db.prepare(`
                SELECT 
                    (SELECT COUNT(*) FROM orders WHERE deleted_at IS NULL) as total_orders,
                    (SELECT COUNT(*) FROM orders WHERE status = 'new' AND deleted_at IS NULL) as new_orders,
                    (SELECT COUNT(*) FROM orders WHERE status = 'confirmed' AND deleted_at IS NULL) as confirmed_orders,
                    (SELECT COUNT(*) FROM orders WHERE status = 'preparing' AND deleted_at IS NULL) as preparing_orders,
                    (SELECT COUNT(*) FROM orders WHERE status = 'ready' AND deleted_at IS NULL) as ready_orders,
                    (SELECT COUNT(*) FROM orders WHERE status = 'delivering' AND deleted_at IS NULL) as delivering_orders,
                    (SELECT COUNT(*) FROM orders WHERE status = 'delivered' AND deleted_at IS NULL) as delivered_orders,
                    
                    -- Bugünkü ve haftanın siparişleri
                    (SELECT COUNT(*) FROM orders WHERE DATE(delivery_date) = DATE('now') AND deleted_at IS NULL) as today_orders,
                    (SELECT COUNT(*) FROM orders WHERE DATE(delivery_date) = DATE('now', '+1 day') AND deleted_at IS NULL) as tomorrow_orders,
                    (SELECT COUNT(*) FROM orders 
                     WHERE DATE(delivery_date) BETWEEN DATE('now') AND DATE('now', '+7 day') 
                     AND deleted_at IS NULL) as week_orders,
                    
                    -- Müşteri metrikleri
                    (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL) as customer_count,
                    (SELECT COUNT(*) FROM customers 
                     WHERE DATE(created_at) >= DATE('now', '-30 day')
                     AND deleted_at IS NULL) as new_customers,
                    
                    -- Finansal metrikler
                    (SELECT COALESCE(SUM(total_amount), 0) FROM orders 
                     WHERE status != 'cancelled' 
                     AND deleted_at IS NULL) as total_revenue,
                    (SELECT COALESCE(SUM(total_amount), 0) FROM orders 
                     WHERE DATE(created_at) >= DATE('now', '-30 day') 
                     AND status != 'cancelled'
                     AND deleted_at IS NULL) as monthly_revenue,
                    
                    -- Stok metrikleri
                    (SELECT COUNT(*) FROM raw_materials 
                     WHERE id IN (
                         SELECT material_id FROM (
                             SELECT m.id as material_id, 
                                    COALESCE(SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity ELSE -sm.quantity END), 0) as stock_level
                             FROM raw_materials m
                             LEFT JOIN stock_movements sm ON m.id = sm.material_id AND sm.deleted_at IS NULL
                             WHERE m.deleted_at IS NULL
                             GROUP BY m.id
                         )
                         WHERE stock_level <= 10
                     )) as low_stock_count
            `).first();
            
            // Bugünkü siparişler
            const { results: todayOrders } = await db.prepare(`
                SELECT 
                    o.id, o.status, o.delivery_time, o.delivery_date, o.total_amount, o.payment_status,
                    c.name as customer_name, c.phone as customer_phone,
                    r.name as recipient_name, r.phone as recipient_phone,
                    a.district, a.neighborhood, a.street,
                    GROUP_CONCAT(p.name || ' (x' || oi.quantity || ')') as products
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                LEFT JOIN recipients r ON o.recipient_id = r.id
                LEFT JOIN addresses a ON o.address_id = a.id
                LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.deleted_at IS NULL
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE DATE(o.delivery_date) = DATE('now')
                AND o.deleted_at IS NULL
                GROUP BY o.id
            `).all();

            // Yaklaşan siparişler (yarın)
            const { results: upcomingOrders } = await db.prepare(`
                SELECT 
                    o.id, o.status, o.delivery_time, o.delivery_date, o.total_amount,
                    c.name as customer_name,
                    r.name as recipient_name, 
                    a.district,
                    COUNT(oi.id) as item_count
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                LEFT JOIN recipients r ON o.recipient_id = r.id
                LEFT JOIN addresses a ON o.address_id = a.id
                LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.deleted_at IS NULL
                WHERE DATE(o.delivery_date) > DATE('now')
                AND DATE(o.delivery_date) <= DATE('now', '+3 day')
                AND o.status NOT IN ('delivered', 'cancelled')
                AND o.deleted_at IS NULL
                GROUP BY o.id
                ORDER BY o.delivery_date, 
                    CASE o.delivery_time
                        WHEN 'morning' THEN 1
                        WHEN 'afternoon' THEN 2
                        WHEN 'evening' THEN 3
                        ELSE 4
                    END
                LIMIT 5
            `).all();

            // Düşük stok
            const { results: lowStockItems } = await db.prepare(`
                SELECT 
                    m.id, m.name, m.description,
                    u.name as unit_name, u.code as unit_code,
                    COALESCE(SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity ELSE -sm.quantity END), 0) as stock_level
                FROM raw_materials m
                LEFT JOIN stock_movements sm ON m.id = sm.material_id AND sm.deleted_at IS NULL
                LEFT JOIN units u ON m.unit_id = u.id
                WHERE m.deleted_at IS NULL
                GROUP BY m.id
                HAVING stock_level <= 10
                ORDER BY stock_level
                LIMIT 5
            `).all();

            // Son finansal işlemler
            const { results: recentTransactions } = await db.prepare(`
                SELECT 
                    t.id, t.date, t.amount, t.type, t.payment_method, t.description,
                    a.name as account_name,
                    c.name as category_name
                FROM transactions t
                LEFT JOIN accounts a ON t.account_id = a.id
                LEFT JOIN transaction_categories c ON t.category_id = c.id
                WHERE t.deleted_at IS NULL
                ORDER BY t.date DESC
                LIMIT 5
            `).all();

            return c.json({
                success: true,
                summary: dashboardSummary,
                todayOrders: todayOrders || [],
                upcomingOrders: upcomingOrders || [],
                lowStockItems: lowStockItems || [],
                recentTransactions: recentTransactions || []
            });
            
        } catch (dbError) {
            console.error('Dashboard database error:', dbError);
            return c.json({
                success: false,
                error: 'Veritabanı sorgusu hatası',
                details: dbError.message
            }, 500);
        }

    } catch (error) {
        console.error('Dashboard error:', error);
        return c.json({
            success: false,
            error: 'Genel hata',
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
