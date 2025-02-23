
-- 1. Günlük Özet İstatistikleri
CREATE TRIGGER trg_daily_summary_stats
AFTER UPDATE OF status ON orders
WHEN NEW.status = 'delivered'
BEGIN
    -- Günlük satış özeti
    INSERT OR REPLACE INTO daily_sales_stats (
        tenant_id,
        day_date,
        total_orders,
        total_revenue,
        avg_order_value,
        total_delivery_fee,
        most_sold_product,
        busiest_region
    )
    SELECT 
        o.tenant_id,
        date(NEW.delivered_at),
        COUNT(DISTINCT o.id),
        SUM(o.total_amount),
        AVG(o.total_amount),
        SUM(o.delivery_fee),
        (
            SELECT product_id 
            FROM order_items oi2 
            WHERE oi2.order_id IN (SELECT id FROM orders WHERE date(delivered_at) = date(NEW.delivered_at))
            GROUP BY product_id 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ),
        (
            SELECT district 
            FROM addresses a2 
            WHERE a2.id IN (SELECT address_id FROM orders WHERE date(delivered_at) = date(NEW.delivered_at))
            GROUP BY district 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        )
    FROM orders o
    WHERE date(o.delivered_at) = date(NEW.delivered_at)
    GROUP BY o.tenant_id, date(o.delivered_at);

    -- Ürün kategorisi performansı
    INSERT OR REPLACE INTO category_performance_stats (
        tenant_id,
        day_date,
        category_id,
        total_orders,
        total_revenue,
        avg_prep_time
    )
    SELECT 
        o.tenant_id,
        date(NEW.delivered_at),
        p.category_id,
        COUNT(DISTINCT o.id),
        SUM(oi.total_amount),
        AVG(strftime('%s', o.preparation_end) - strftime('%s', o.preparation_start))
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE date(o.delivered_at) = date(NEW.delivered_at)
    GROUP BY o.tenant_id, date(o.delivered_at), p.category_id;

    -- Bölge performansı
    INSERT OR REPLACE INTO region_performance_stats (
        tenant_id,
        day_date,
        district,
        total_orders,
        total_revenue,
        avg_delivery_time,
        delivery_success_rate
    )
    SELECT 
        o.tenant_id,
        date(NEW.delivered_at),
        a.district,
        COUNT(DISTINCT o.id),
        SUM(o.total_amount),
        AVG(strftime('%s', o.delivered_at) - strftime('%s', o.preparation_end)),
        AVG(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END)
    FROM orders o
    JOIN addresses a ON o.address_id = a.id
    WHERE date(o.delivered_at) = date(NEW.delivered_at)
    GROUP BY o.tenant_id, date(o.delivered_at), a.district;
END;

-- 2. Müşteri Segmentasyon İstatistikleri
CREATE TRIGGER trg_customer_segment_update
AFTER INSERT ON orders
BEGIN
    -- RFM (Recency, Frequency, Monetary) analizi
    INSERT OR REPLACE INTO customer_segments (
        tenant_id,
        customer_id,
        last_order_date,
        order_count_6m,
        total_spent_6m,
        avg_order_value,
        segment
    )
    SELECT 
        o.tenant_id,
        o.customer_id,
        MAX(o.created_at) as last_order,
        COUNT(*) as frequency,
        SUM(o.total_amount) as monetary,
        AVG(o.total_amount) as avg_value,
        CASE 
            WHEN COUNT(*) > 5 AND SUM(o.total_amount) > 5000 THEN 'VIP'
            WHEN COUNT(*) > 3 THEN 'Regular'
            ELSE 'New'
        END as segment
    FROM orders o
    WHERE o.created_at >= date('now', '-6 months')
    GROUP BY o.tenant_id, o.customer_id;
END;
