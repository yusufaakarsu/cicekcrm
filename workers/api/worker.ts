api.get('/api/dashboard', async (c) => {
  const db = c.env.DB;
  const tenant_id = c.get('tenant_id');

  try {
    // 1. Teslimat İstatistikleri 
    const deliveryStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN status = 'delivering' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing_orders,
        ROUND(AVG(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) * 100, 1) as delivery_success_rate
      FROM orders 
      WHERE DATE(delivery_date) = DATE('now')
      AND tenant_id = ?
    `).bind(tenant_id).first();

    // 2. Finansal İstatistikler - Sadece gerekli alanlar
    const finance = await db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN DATE(created_at) = DATE('now') THEN total_amount ELSE 0 END), 0) as daily_revenue,
        ROUND(AVG(total_amount), 2) as avg_order_value
      FROM orders
      WHERE tenant_id = ? AND status != 'cancelled'
    `).bind(tenant_id).first();

    // 3. Kritik Durumlar
    const criticalStats = await db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'delivering' AND 
          DATETIME(delivery_date) < DATETIME('now') THEN 1 END) as delayed_deliveries,
        COUNT(CASE WHEN customer_satisfaction < 3 THEN 1 END) as complaints,
        COUNT(CASE WHEN cancel_request = 1 THEN 1 END) as potential_cancellations
      FROM orders
      WHERE tenant_id = ? 
      AND DATE(delivery_date) = DATE('now')
    `).bind(tenant_id).first();

    // 4. Günlük Hedefler
    const targets = await db.prepare(`
      SELECT 
        (SELECT target_value FROM daily_targets WHERE type = 'delivery' AND DATE(date) = DATE('now')) as delivery_target,
        (SELECT target_value FROM daily_targets WHERE type = 'revenue' AND DATE(date) = DATE('now')) as revenue_target,
        (SELECT AVG(customer_satisfaction) FROM orders WHERE DATE(delivery_date) = DATE('now')) as satisfaction_rate
      FROM daily_targets
      LIMIT 1
    `).first();

    return c.json({
      deliveryStats: deliveryStats || {
        total_orders: 0,
        delivered_orders: 0,
        pending_orders: 0,
        preparing_orders: 0,
        delivery_success_rate: 0
      },
      finance: finance || {
        daily_revenue: 0,
        avg_order_value: 0
      },
      criticalStats: criticalStats || {
        delayed_deliveries: 0,
        complaints: 0,
        potential_cancellations: 0
      },
      targets: targets || {
        delivery_target: 0,
        revenue_target: 0,
        satisfaction_rate: 0
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// ... remove other unused dashboard endpoints ...
