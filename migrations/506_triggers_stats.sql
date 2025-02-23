
-- 1. Ürün Satış İstatistikleri
CREATE TRIGGER trg_product_sales_stats
AFTER UPDATE OF status ON orders
WHEN NEW.status = 'delivered' AND OLD.status != 'delivered'
BEGIN
    -- Ürün satış istatistiklerini güncelle
    INSERT OR REPLACE INTO product_stats (
        tenant_id,
        product_id,
        day_date,
        total_quantity,
        total_amount,
        order_count
    )
    SELECT 
        o.tenant_id,
        oi.product_id,
        date(o.delivered_at),
        SUM(oi.quantity),
        SUM(oi.total_amount),
        COUNT(DISTINCT o.id)
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.tenant_id = NEW.tenant_id 
    AND date(o.delivered_at) = date(NEW.delivered_at)
    GROUP BY o.tenant_id, oi.product_id, date(o.delivered_at);
END;

-- 2. Müşteri Alışveriş İstatistikleri
CREATE TRIGGER trg_customer_order_stats
AFTER INSERT ON orders
BEGIN
    -- Müşteri sipariş istatistiklerini güncelle
    UPDATE customer_stats 
    SET 
        total_orders = (
            SELECT COUNT(*) 
            FROM orders 
            WHERE customer_id = NEW.customer_id
        ),
        total_amount = (
            SELECT SUM(total_amount) 
            FROM orders 
            WHERE customer_id = NEW.customer_id
        ),
        last_order_date = NEW.created_at,
        favorite_products = (
            SELECT json_group_array(product_id)
            FROM (
                SELECT oi.product_id
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                WHERE o.customer_id = NEW.customer_id
                GROUP BY oi.product_id
                ORDER BY COUNT(*) DESC
                LIMIT 3
            )
        )
    WHERE customer_id = NEW.customer_id;
END;

-- 3. Teslimat Bölgesi Performansı
CREATE TRIGGER trg_delivery_region_stats
AFTER UPDATE OF status ON orders
WHEN NEW.status = 'delivered'
BEGIN
    -- Bölge bazlı teslimat istatistikleri
    INSERT OR REPLACE INTO delivery_stats (
        tenant_id,
        region_id,
        day_date,
        order_count,
        total_amount,
        avg_delivery_time,
        on_time_rate
    )
    SELECT 
        o.tenant_id,
        a.district,
        date(o.delivered_at),
        COUNT(*),
        SUM(o.total_amount),
        AVG(strftime('%s', o.delivered_at) - strftime('%s', o.preparation_end)),
        AVG(CASE 
            WHEN o.delivered_at <= datetime(o.delivery_date || ' ' ||
                CASE o.delivery_time 
                    WHEN 'morning' THEN '12:00'
                    WHEN 'afternoon' THEN '17:00'
                    WHEN 'evening' THEN '21:00'
                END
            ) THEN 1 
            ELSE 0 
        END)
    FROM orders o
    JOIN addresses a ON o.address_id = a.id
    WHERE o.tenant_id = NEW.tenant_id 
    AND date(o.delivered_at) = date(NEW.delivered_at)
    GROUP BY o.tenant_id, a.district, date(o.delivered_at);
END;

-- 4. Stok ve Fire İstatistikleri
CREATE TRIGGER trg_stock_waste_stats
AFTER INSERT ON stock_movements
WHEN NEW.source_type = 'waste'
BEGIN
    -- Fire oranı istatistikleri
    INSERT OR REPLACE INTO waste_stats (
        tenant_id,
        material_id,
        month_date,
        waste_quantity,
        waste_cost,
        waste_rate
    )
    SELECT 
        sm.tenant_id,
        sm.material_id,
        strftime('%Y-%m', NEW.created_at),
        SUM(CASE WHEN sm.source_type = 'waste' THEN sm.quantity ELSE 0 END),
        SUM(CASE WHEN sm.source_type = 'waste' THEN sm.quantity * mph.unit_price ELSE 0 END),
        CAST(SUM(CASE WHEN sm.source_type = 'waste' THEN sm.quantity ELSE 0 END) AS FLOAT) /
        NULLIF(SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0)
    FROM stock_movements sm
    LEFT JOIN material_price_history mph ON sm.material_id = mph.material_id
    WHERE sm.tenant_id = NEW.tenant_id 
    AND sm.material_id = NEW.material_id
    AND strftime('%Y-%m', sm.created_at) = strftime('%Y-%m', NEW.created_at)
    GROUP BY sm.tenant_id, sm.material_id, strftime('%Y-%m', NEW.created_at);
END;
