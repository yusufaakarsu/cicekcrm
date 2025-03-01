import { Hono } from 'hono';

const router = new Hono();

// Yardımcı fonksiyonlar
function getTimeFilter(timeRange: string): string {
  switch (timeRange) {
    case '30days':
      return "DATE('now', '-30 days')";
    case 'thismonth':
      return "DATE('now', 'start of month')";
    case 'thisyear':
      return "DATE('now', 'start of year')";
    default:
      return "DATE('now', '-30 days')";
  }
}

function getPreviousPeriodFilter(timeRange: string): string {
  switch (timeRange) {
    case '30days':
      return "DATE('now', '-60 days')";
    case 'thismonth':
      return "DATE('now', 'start of month', '-1 month')";
    case 'thisyear':
      return "DATE('now', 'start of year', '-1 year')";
    default:
      return "DATE('now', '-60 days')";
  }
}

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Ana dashboard
router.get('/', async (c) => {
    const db = c.get('db');

    try {
        console.log('Dashboard request received');
        
        // Özet metrikleri tek sorguda al
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

// Son siparişler endpoint'i
router.get('/recent-orders', async (c) => {
    const db = c.get('db');

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
            WHERE o.deleted_at IS NULL
            GROUP BY o.id
            ORDER BY o.created_at DESC
            LIMIT 10
        `).all();

        return c.json({
            success: true,
            orders
        });

    } catch (error) {
        console.error('Recent orders error:', error);
        return c.json({
            success: false,
            error: 'Veritabanı hatası',
            details: error.message
        }, 500);
    }
});

// Dashboard özet verileri
router.get('/summary', async (c) => {
  const db = c.get('db')
  const timeRange = c.req.query('timeRange') || '30days'
  
  try {
    // Zaman filtresi oluştur
    const timeFilter = getTimeFilter(timeRange)
    
    // Geçen dönem için zaman filtresi
    const prevTimeFilter = getPreviousPeriodFilter(timeRange)
    
    // Dönem siparişleri
    const currentPeriodOrders = await db.prepare(`
      SELECT COUNT(*) as count, SUM(total_amount) as revenue
      FROM orders
      WHERE created_at >= ${timeFilter}
      AND deleted_at IS NULL
    `).first()
    
    // Geçen dönem siparişleri
    const previousPeriodOrders = await db.prepare(`
      SELECT COUNT(*) as count, SUM(total_amount) as revenue
      FROM orders
      WHERE created_at >= ${prevTimeFilter} AND created_at < ${timeFilter}
      AND deleted_at IS NULL
    `).first()
    
    // Trendleri hesapla
    const ordersTrend = calculateTrend(
      currentPeriodOrders?.count || 0, 
      previousPeriodOrders?.count || 0
    )
    
    const revenueTrend = calculateTrend(
      currentPeriodOrders?.revenue || 0, 
      previousPeriodOrders?.revenue || 0
    )
    
    // Ortalama sipariş tutarı
    const averageOrderCurrent = currentPeriodOrders?.count > 0 
      ? (currentPeriodOrders.revenue / currentPeriodOrders.count) 
      : 0
    
    const averageOrderPrevious = previousPeriodOrders?.count > 0 
      ? (previousPeriodOrders.revenue / previousPeriodOrders.count) 
      : 0
    
    const averageOrderTrend = calculateTrend(
      averageOrderCurrent, 
      averageOrderPrevious
    )
    
    // Yeni müşteriler
    const newCustomers = await db.prepare(`
      SELECT COUNT(*) as count
      FROM customers
      WHERE created_at >= ${timeFilter}
      AND deleted_at IS NULL
    `).first()
    
    // Önceki dönem yeni müşteriler
    const previousNewCustomers = await db.prepare(`
      SELECT COUNT(*) as count
      FROM customers
      WHERE created_at >= ${prevTimeFilter} AND created_at < ${timeFilter}
      AND deleted_at IS NULL
    `).first()
    
    const newCustomersTrend = calculateTrend(
      newCustomers?.count || 0,
      previousNewCustomers?.count || 0
    )
    
    return c.json({
      success: true,
      summary: {
        orders: {
          total: currentPeriodOrders?.count || 0,
          trend: ordersTrend
        },
        revenue: {
          total: currentPeriodOrders?.revenue || 0,
          trend: revenueTrend
        },
        average_order: {
          total: averageOrderCurrent,
          trend: averageOrderTrend
        },
        new_customers: {
          total: newCustomers?.count || 0,
          trend: newCustomersTrend
        }
      }
    })
    
  } catch (error) {
    console.error('Dashboard summary error:', error)
    return c.json({
      success: false,
      error: 'Özet verileri alınamadı',
      details: error.message
    }, 500)
  }
})

// Trend verileri - zaman bazlı satış trendi grafiği için
router.get('/trends', async (c) => {
  const db = c.get('db')
  const timeRange = c.req.query('timeRange') || '30days'
  const grouping = c.req.query('grouping') || 'daily' // daily, weekly, monthly
  
  try {
    // Sorgu için format bilgisi
    let dateFormat: string
    let interval: string
    let dayCount: number
    
    switch (grouping) {
      case 'weekly':
        dateFormat = "'Hafta' || strftime('%W', created_at)"
        interval = "7 day"
        dayCount = 10 // 10 hafta
        break
      case 'monthly':
        dateFormat = "strftime('%Y-%m', created_at)"
        interval = "1 month"
        dayCount = 12 // 12 ay
        break
      default: // daily
        dateFormat = "date(created_at)"
        interval = "1 day"
        dayCount = 30 // 30 gün
    }
    
    // Zaman aralığına göre başlangıç tarihi hesapla
    const startDate = timeRange === 'thisyear' 
      ? "date('now', 'start of year')" 
      : (timeRange === 'thismonth' 
          ? "date('now', 'start of month')" 
          : `date('now', '-${dayCount} day')`)
    
    // Verileri getir
    const { results } = await db.prepare(`
      WITH date_series AS (
        SELECT 
          date(
            ${startDate}, 
            '+' || seq || ' ${interval}'
          ) AS date_point
        FROM 
          (WITH RECURSIVE seq(seq) AS (
            SELECT 0
            UNION ALL
            SELECT seq + 1
            FROM seq
            LIMIT ${dayCount}
          )
          SELECT seq FROM seq)
      )
      
      SELECT 
        ds.date_point as date,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as revenue
      FROM 
        date_series ds
      LEFT JOIN 
        orders o ON ${dateFormat} = ds.date_point AND o.deleted_at IS NULL
      GROUP BY 
        ds.date_point
      ORDER BY 
        ds.date_point ASC
    `).all()
    
    // Etiketler ve veri dizilerini oluştur
    const labels = results.map(r => r.date)
    const orders = results.map(r => r.order_count)
    const revenue = results.map(r => r.revenue)
    
    return c.json({
      success: true,
      trends: {
        labels,
        orders,
        revenue
      }
    })
    
  } catch (error) {
    console.error('Dashboard trends error:', error)
    return c.json({
      success: false,
      error: 'Trend verileri alınamadı',
      details: error.message
    }, 500)
  }
})

// Kategori dağılımı - pasta grafik için
router.get('/categories', async (c) => {
  const db = c.get('db')
  const timeRange = c.req.query('timeRange') || '30days'
  
  try {
    // Zaman filtresi
    const timeFilter = getTimeFilter(timeRange)
    
    // Kategori verileri
    const { results } = await db.prepare(`
      SELECT 
        pc.name as category,
        COALESCE(SUM(oi.total_amount), 0) as amount
      FROM 
        product_categories pc
      LEFT JOIN 
        products p ON pc.id = p.category_id AND p.deleted_at IS NULL
      LEFT JOIN 
        order_items oi ON p.id = oi.product_id AND oi.deleted_at IS NULL
      LEFT JOIN 
        orders o ON oi.order_id = o.id AND o.deleted_at IS NULL
                   AND o.created_at >= ${timeFilter}
      WHERE 
        pc.deleted_at IS NULL
      GROUP BY 
        pc.id
      HAVING
        amount > 0
      ORDER BY 
        amount DESC
    `).all()
    
    // Etiketler ve veriler
    const labels = results.map(r => r.category)
    const data = results.map(r => r.amount)
    
    return c.json({
      success: true,
      categories: {
        labels,
        data
      }
    })
    
  } catch (error) {
    console.error('Dashboard categories error:', error)
    return c.json({
      success: false,
      error: 'Kategori verileri alınamadı', 
      details: error.message
    }, 500)
  }
})

// Hedefler
router.get('/targets', async (c) => {
  const db = c.get('db')
  
  try {
    // Varsayılan hedef değerleri
    // NOT: Gerçekte bu değerler veritabanından gelmeli
    const currentMonth = new Date().getMonth() + 1 // 1-12
    
    // Bu ay için gerçek değerler
    const currentStats = await db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM orders 
         WHERE strftime('%m', created_at) = '${currentMonth.toString().padStart(2, '0')}'
         AND deleted_at IS NULL) AS order_count,
         
        (SELECT SUM(total_amount) FROM orders 
         WHERE strftime('%m', created_at) = '${currentMonth.toString().padStart(2, '0')}'
         AND deleted_at IS NULL) AS revenue,
         
        (SELECT COUNT(*) FROM customers 
         WHERE strftime('%m', created_at) = '${currentMonth.toString().padStart(2, '0')}'
         AND deleted_at IS NULL) AS new_customers
    `).first()
    
    // Hedefler
    const targets = {
      orders: {
        current: currentStats?.order_count || 0,
        target: 100 // Sabit değer, ileride ayarlanabilir
      },
      revenue: {
        current: currentStats?.revenue || 0,
        target: 10000 // Sabit değer, ileride ayarlanabilir
      },
      new_customers: {
        current: currentStats?.new_customers || 0,
        target: 50 // Sabit değer, ileride ayarlanabilir
      }
    }
    
    return c.json({
      success: true,
      targets
    })
    
  } catch (error) {
    console.error('Dashboard targets error:', error)
    return c.json({
      success: false,
      error: 'Hedef verileri alınamadı',
      details: error.message
    }, 500)
  }
})

export default router;
