
-- 1. Hazırlama Süresi İstatistikleri
CREATE TRIGGER trg_preparation_time_stats
AFTER UPDATE OF preparation_end ON orders
WHEN NEW.preparation_end IS NOT NULL AND OLD.preparation_end IS NULL
BEGIN
    INSERT OR REPLACE INTO preparation_stats (
        tenant_id,
        day_date,
        category_id,
        avg_prep_time,
        total_orders,
        on_time_rate
    )
    SELECT 
        o.tenant_id,
        date(o.preparation_end),
        p.category_id,
        AVG(strftime('%s', o.preparation_end) - strftime('%s', o.preparation_start)),
        COUNT(DISTINCT o.id),
        AVG(CASE 
            WHEN strftime('%s', o.preparation_end) - strftime('%s', o.preparation_start) <= 3600 
            THEN 1 ELSE 0 
        END)
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.tenant_id = NEW.tenant_id 
    AND date(o.preparation_end) = date(NEW.preparation_end)
    GROUP BY o.tenant_id, date(o.preparation_end), p.category_id;
END;

-- 2. Malzeme Kullanım Raporları
CREATE TRIGGER trg_material_usage_stats
AFTER INSERT ON order_items_materials
BEGIN
    INSERT OR REPLACE INTO material_usage_stats (
        tenant_id,
        material_id,
        month_date,
        total_used,
        total_cost,
        order_count
    )
    SELECT 
        oim.tenant_id,
        oim.material_id,
        strftime('%Y-%m', NEW.created_at),
        SUM(oim.quantity),
        SUM(oim.quantity * oim.unit_price),
        COUNT(DISTINCT oim.order_id)
    FROM order_items_materials oim
    WHERE oim.tenant_id = NEW.tenant_id 
    AND oim.material_id = NEW.material_id
    AND strftime('%Y-%m', oim.created_at) = strftime('%Y-%m', NEW.created_at)
    GROUP BY 
        oim.tenant_id, 
        oim.material_id, 
        strftime('%Y-%m', NEW.created_at);
END;

-- 3. Personel Performans İstatistikleri
CREATE TRIGGER trg_staff_performance_stats
AFTER UPDATE OF status ON orders
WHEN NEW.status = 'delivered'
BEGIN
    -- Hazırlayan personel istatistikleri
    INSERT OR REPLACE INTO staff_stats (
        tenant_id,
        staff_id,
        day_date,
        total_orders,
        total_items,
        avg_prep_time
    )
    SELECT 
        o.tenant_id,
        o.prepared_by,
        date(o.delivered_at),
        COUNT(DISTINCT o.id),
        SUM(oi.quantity),
        AVG(strftime('%s', o.preparation_end) - strftime('%s', o.preparation_start))
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.tenant_id = NEW.tenant_id 
    AND o.prepared_by IS NOT NULL
    AND date(o.delivered_at) = date(NEW.delivered_at)
    GROUP BY o.tenant_id, o.prepared_by, date(o.delivered_at);

    -- Kurye istatistikleri
    INSERT OR REPLACE INTO delivery_staff_stats (
        tenant_id,
        staff_id,
        day_date,
        total_deliveries,
        avg_delivery_time,
        on_time_rate
    )
    SELECT 
        o.tenant_id,
        o.delivered_by,
        date(o.delivered_at),
        COUNT(DISTINCT o.id),
        AVG(strftime('%s', o.delivered_at) - strftime('%s', o.preparation_end)),
        AVG(CASE 
            WHEN o.delivered_at <= datetime(o.delivery_date || ' ' ||
                CASE o.delivery_time 
                    WHEN 'morning' THEN '12:00'
                    WHEN 'afternoon' THEN '17:00'
                    WHEN 'evening' THEN '21:00'
                END
            ) THEN 1 ELSE 0 
        END)
    FROM orders o
    WHERE o.tenant_id = NEW.tenant_id 
    AND o.delivered_by IS NOT NULL
    AND date(o.delivered_at) = date(NEW.delivered_at)
    GROUP BY o.tenant_id, o.delivered_by, date(o.delivered_at);
END;
