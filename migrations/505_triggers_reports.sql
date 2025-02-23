
-- 1. Günlük satış özeti
CREATE TRIGGER trg_daily_sales_summary
AFTER UPDATE OF status ON orders
WHEN NEW.status = 'delivered' AND OLD.status != 'delivered'
BEGIN
    -- Günlük teslimat sayısı
    INSERT OR REPLACE INTO daily_stats (
        tenant_id,
        date,
        total_orders,
        total_amount,
        total_items,
        district_summary -- JSON
    )
    SELECT 
        NEW.tenant_id,
        date(NEW.delivered_at),
        COUNT(DISTINCT o.id),
        SUM(o.total_amount),
        SUM(oi.quantity),
        json_group_array(
            json_object(
                'district', a.district,
                'count', COUNT(*),
                'amount', SUM(o.total_amount)
            )
        )
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN addresses a ON o.address_id = a.id
    WHERE o.tenant_id = NEW.tenant_id
    AND date(o.delivered_at) = date(NEW.delivered_at)
    GROUP BY o.tenant_id, date(o.delivered_at);
END;

-- 2. Stok takip raporu
CREATE TRIGGER trg_stock_level_alert
AFTER INSERT ON stock_movements
BEGIN
    -- Kritik stok seviyesi kontrolü
    INSERT INTO notifications (
        tenant_id,
        type,
        title,
        content,
        related_type,
        related_id
    )
    SELECT
        NEW.tenant_id,
        'STOCK_ALERT',
        'Kritik Stok Seviyesi',
        m.name || ' stok seviyesi kritik',
        'material',
        m.id
    FROM raw_materials m
    WHERE m.id = NEW.material_id
    AND (
        SELECT COALESCE(SUM(
            CASE movement_type 
                WHEN 'in' THEN quantity 
                WHEN 'out' THEN -quantity 
            END
        ), 0)
        FROM stock_movements
        WHERE material_id = m.id
    ) <= m.min_stock_level;
END;

-- 3. Müşteri özel gün hatırlatması
CREATE TRIGGER trg_special_dates_reminder
AFTER INSERT ON recipients
WHEN NEW.special_dates IS NOT NULL
BEGIN
    -- Özel günleri hatırlatma tablosuna ekle
    INSERT INTO reminders (
        tenant_id,
        customer_id,
        recipient_id,
        reminder_date,
        type,
        description
    )
    SELECT 
        NEW.tenant_id,
        NEW.customer_id,
        NEW.id,
        date(strftime('%Y-', 'now') || substr(json_extract(special_dates, '$.anniversary'), 1, 5)),
        'ANNIVERSARY',
        'Yıldönümü - ' || NEW.name
    WHERE json_extract(NEW.special_dates, '$.anniversary') IS NOT NULL
    
    UNION ALL
    
    SELECT 
        NEW.tenant_id,
        NEW.customer_id,
        NEW.id,
        date(strftime('%Y-', 'now') || substr(json_extract(special_dates, '$.birthday'), 1, 5)),
        'BIRTHDAY',
        'Doğum Günü - ' || NEW.name
    WHERE json_extract(NEW.special_dates, '$.birthday') IS NOT NULL;
END;
