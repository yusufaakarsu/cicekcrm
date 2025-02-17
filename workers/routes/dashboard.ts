import { Hono } from 'hono'

const router = new Hono()

router.get('/', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')

  try {
    // 1. Teslimat İstatistikleri 
    const deliveryStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN status = 'delivering' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing_orders
      FROM orders 
      WHERE DATE(delivery_date) = DATE('now')
      AND tenant_id = ?
      AND is_deleted = 0
    `).bind(tenant_id).first()

    // 2. Finansal İstatistikler
    const finance = await db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN DATE(created_at) = DATE('now') THEN total_amount ELSE 0 END), 0) as daily_revenue,
        COALESCE(ROUND(AVG(total_amount), 2), 0) as avg_order_value
      FROM orders
      WHERE tenant_id = ? 
      AND status != 'cancelled'
      AND is_deleted = 0
    `).bind(tenant_id).first()

    // 3. Kritik Durumlar
    const criticalStats = await db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'delivering' AND 
          DATETIME(delivery_date) < DATETIME('now') THEN 1 END) as delayed_deliveries,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancellations,
        COUNT(o.id) as complaints
      FROM orders o
      LEFT JOIN complaints c ON o.id = c.order_id
      WHERE o.tenant_id = ? 
      AND DATE(o.delivery_date) = DATE('now')
      AND o.is_deleted = 0
    `).bind(tenant_id).first()

    // 4. Düşük Stok Uyarıları
    const lowStock = await db.prepare(`
      SELECT 
        COUNT(*) as count
      FROM products p
      WHERE p.tenant_id = ?
      AND p.is_deleted = 0
      AND p.stock <= p.min_stock
    `).bind(tenant_id).first()

    // 5. Günlük Hedefler
    const targets = await db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM orders 
         WHERE status = 'delivered' 
         AND DATE(delivery_date) = DATE('now')
         AND tenant_id = ?) as delivered_orders,
        (SELECT COUNT(*) FROM orders 
         WHERE DATE(delivery_date) = DATE('now')
         AND tenant_id = ?) as delivery_target,
        (SELECT SUM(total_amount) FROM orders 
         WHERE DATE(created_at) = DATE('now')
         AND tenant_id = ?) as daily_revenue,
        (SELECT AVG(total_amount) FROM orders 
         WHERE status = 'delivered'
         AND tenant_id = ?) as revenue_target
    `).bind(tenant_id, tenant_id, tenant_id, tenant_id).first()

    // Tüm verileri birleştir ve döndür
    return c.json({
      deliveryStats: {
        total_orders: deliveryStats?.total_orders || 0,
        delivered_orders: deliveryStats?.delivered_orders || 0,
        pending_orders: deliveryStats?.pending_orders || 0,
        preparing_orders: deliveryStats?.preparing_orders || 0
      },
      finance: {
        daily_revenue: finance?.daily_revenue || 0,
        avg_order_value: finance?.avg_order_value || 0
      },
      criticalStats: {
        delayed_deliveries: criticalStats?.delayed_deliveries || 0,
        cancellations: criticalStats?.cancellations || 0,
        complaints: criticalStats?.complaints || 0
      },
      lowStock: lowStock?.count || 0,
      targets: {
        delivered_orders: targets?.delivered_orders || 0,
        delivery_target: targets?.delivery_target || 0,
        daily_revenue: targets?.daily_revenue || 0,
        revenue_target: targets?.revenue_target || 0
      }
    })

  } catch (error) {
    console.error('Dashboard error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

export default router
