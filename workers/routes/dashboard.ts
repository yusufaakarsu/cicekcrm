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

    // 3. Kritik Durumlar - complaints tablosunu kaldırdık
    const criticalStats = await db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'delivering' AND 
          DATETIME(delivery_date) < DATETIME('now') THEN 1 END) as delayed_deliveries,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancellations,
        0 as complaints  -- Şimdilik sabit 0 değeri
      FROM orders 
      WHERE tenant_id = ? 
      AND DATE(delivery_date) = DATE('now')
      AND is_deleted = 0
    `).bind(tenant_id).first()

    // 4. Günlük Hedefler
    const targets = await db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM orders 
         WHERE status = 'delivered' 
         AND DATE(delivery_date) = DATE('now')
         AND tenant_id = ?) as delivered_orders,
        (SELECT COUNT(*) FROM orders 
         WHERE DATE(delivery_date) = DATE('now')
         AND tenant_id = ?) as delivery_target,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders 
         WHERE DATE(created_at) = DATE('now')
         AND tenant_id = ?) as daily_revenue,
        (SELECT COALESCE(AVG(total_amount), 0) FROM orders 
         WHERE status = 'delivered'
         AND tenant_id = ?) as revenue_target
    `).bind(tenant_id, tenant_id, tenant_id, tenant_id).first()

    // 5. Düşük Stok
    const lowStock = await db.prepare(`
      SELECT COUNT(*) as count
      FROM products
      WHERE tenant_id = ?
      AND stock <= min_stock
      AND is_deleted = 0
    `).bind(tenant_id).first()

    return c.json({
      success: true,
      deliveryStats,
      finance,
      criticalStats,
      targets,
      lowStock: lowStock.count || 0
    })

  } catch (error) {
    console.error('Dashboard Error:', error)
    return c.json({ 
      success: false,
      error: 'Dashboard Error',
      message: error.message 
    }, 500)
  }
})

export default router