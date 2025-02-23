
-- 1. Satın alma sonrası stok girişi
CREATE TRIGGER trg_after_purchase_received 
AFTER UPDATE ON purchase_orders
WHEN NEW.status = 'received' AND OLD.status != 'received'
BEGIN
    -- Her kalem için stok hareketi oluştur
    INSERT INTO stock_movements (
        tenant_id,
        material_id,
        movement_type,
        quantity,
        source_type,
        source_id,
        created_by
    )
    SELECT 
        po.tenant_id,
        poi.material_id,
        'in',
        poi.quantity,
        'purchase',
        po.id,
        po.created_by
    FROM purchase_orders po
    JOIN purchase_order_items poi ON poi.order_id = po.id
    WHERE po.id = NEW.id;

    -- Material fiyat geçmişi güncelle
    INSERT INTO material_price_history (
        tenant_id,
        material_id,
        supplier_id,
        unit_price,
        valid_from
    )
    SELECT 
        po.tenant_id,
        poi.material_id,
        po.supplier_id,
        poi.unit_price,
        po.order_date
    FROM purchase_orders po
    JOIN purchase_order_items poi ON poi.order_id = po.id
    WHERE po.id = NEW.id;
END;

-- 2. Stok hareketi sonrası ortalama fiyat
CREATE TRIGGER trg_after_stock_movement
AFTER INSERT ON stock_movements
WHEN NEW.movement_type = 'in'
BEGIN
    -- Son 30 günlük ortalama fiyatı hesapla
    UPDATE raw_materials 
    SET avg_price = (
        SELECT AVG(unit_price)
        FROM purchase_order_items poi
        JOIN purchase_orders po ON po.id = poi.order_id
        WHERE poi.material_id = NEW.material_id
        AND po.order_date >= date('now', '-30 days')
    )
    WHERE id = NEW.material_id;
END;

-- 3. Stok çıkışı kontrolü
CREATE TRIGGER trg_before_stock_out
BEFORE INSERT ON stock_movements
WHEN NEW.movement_type = 'out'
BEGIN
    -- Tenant ayarlarını kontrol et
    SELECT CASE
        WHEN NOT EXISTS (
            -- Tenant negatif stoka izin veriyor mu?
            SELECT 1 FROM tenant_settings 
            WHERE tenant_id = NEW.tenant_id 
            AND (allow_negative_stock = 1 OR require_stock = 0)
        )
        -- Yeterli stok var mı?
        AND (
            SELECT COALESCE(SUM(
                CASE movement_type 
                    WHEN 'in' THEN quantity 
                    WHEN 'out' THEN -quantity 
                END
            ), 0)
            FROM stock_movements
            WHERE material_id = NEW.material_id
            AND tenant_id = NEW.tenant_id
        ) < NEW.quantity
        THEN RAISE(ABORT, 'Yetersiz stok')
    END;
END;

-- 4. Satın alma iptali
CREATE TRIGGER trg_purchase_order_cancel
AFTER UPDATE ON purchase_orders
WHEN NEW.status = 'cancelled' AND OLD.status != 'cancelled'
BEGIN
    -- İlgili stok hareketlerini iptal et
    UPDATE stock_movements
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE source_type = 'purchase' 
    AND source_id = NEW.id;
    
    -- Fiyat geçmişini güncelle
    UPDATE material_price_history
    SET valid_to = CURRENT_TIMESTAMP
    WHERE supplier_id = NEW.supplier_id
    AND valid_from = NEW.order_date;
END;
