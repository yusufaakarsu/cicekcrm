-- Önce tüm trigger'ları sil
DROP TRIGGER IF EXISTS trg_after_order_status_change;
DROP TRIGGER IF EXISTS trg_after_order_item_insert;
DROP TRIGGER IF EXISTS trg_after_order_ready;
DROP TRIGGER IF EXISTS trg_after_order_cancel;

-- 1. Sipariş kalemi eklendiğinde toplam tutarı güncelle
CREATE TRIGGER trg_after_order_item_insert
AFTER INSERT ON order_items
BEGIN
    UPDATE orders 
    SET subtotal = (
        SELECT COALESCE(SUM(quantity * unit_price), 0)
        FROM order_items
        WHERE order_id = NEW.order_id
        AND deleted_at IS NULL
    ),
    total_amount = (
        SELECT COALESCE(SUM(quantity * unit_price), 0)
        FROM order_items
        WHERE order_id = NEW.order_id
        AND deleted_at IS NULL
    ) + delivery_fee - discount_amount
    WHERE id = NEW.order_id;
END;

-- 2. Sipariş durumu değişikliği - Sadece zaman takibi
CREATE TRIGGER trg_after_order_status_change
AFTER UPDATE ON orders
WHEN NEW.status != OLD.status
BEGIN
    UPDATE orders 
    SET status_updated_at = CURRENT_TIMESTAMP,
        -- Sadece hazırlamaya başlama zamanı
        preparation_start = CASE 
            WHEN NEW.status = 'preparing' THEN CURRENT_TIMESTAMP 
            ELSE preparation_start 
        END,
        prepared_by = CASE
            WHEN NEW.status = 'preparing' THEN NEW.updated_by
            ELSE prepared_by
        END,
        -- Sadece hazırlama bitiş zamanı
        preparation_end = CASE 
            WHEN NEW.status = 'ready' THEN CURRENT_TIMESTAMP 
            ELSE preparation_end 
        END
    WHERE id = NEW.id;
END;

-- 3. Sipariş hazır olduğunda stok düşümü (preparing -> ready)
CREATE TRIGGER trg_after_order_ready
AFTER UPDATE ON orders
WHEN NEW.status = 'ready' AND OLD.status = 'preparing'
BEGIN
    -- Önce stok kontrolü
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM order_items_materials oim
            LEFT JOIN stock_movements sm ON sm.material_id = oim.material_id
            WHERE oim.order_id = NEW.id
            GROUP BY oim.material_id
            HAVING COALESCE(SUM(CASE 
                WHEN sm.movement_type = 'in' THEN sm.quantity 
                WHEN sm.movement_type = 'out' THEN -sm.quantity 
                ELSE 0 
            END), 0) < oim.quantity
        ) 
        AND NOT EXISTS (
            SELECT 1 FROM tenant_settings 
            WHERE tenant_id = NEW.tenant_id 
            AND allow_negative_stock = 1
        )
        THEN RAISE(ABORT, 'Yetersiz stok')
    END;

    -- Stok hareketi oluştur
    INSERT INTO stock_movements (
        tenant_id, 
        material_id,
        movement_type,
        quantity,
        source_type,
        source_id,
        notes,
        created_by
    )
    SELECT 
        o.tenant_id,
        oim.material_id,
        'out',
        oim.quantity,
        'sale',
        o.id,
        'Sipariş malzeme kullanımı #' || o.id,
        o.prepared_by
    FROM orders o
    JOIN order_items_materials oim ON oim.order_id = o.id
    WHERE o.id = NEW.id;

    -- Malzeme maliyetlerini hesapla
    UPDATE order_items_materials 
    SET unit_price = (
        SELECT unit_price 
        FROM material_price_history
        WHERE material_id = order_items_materials.material_id
        AND valid_from <= CURRENT_DATE
        AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
        ORDER BY valid_from DESC
        LIMIT 1
    ),
    total_amount = quantity * (
        SELECT unit_price 
        FROM material_price_history
        WHERE material_id = order_items_materials.material_id
        AND valid_from <= CURRENT_DATE
        AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
        ORDER BY valid_from DESC
        LIMIT 1
    )
    WHERE order_id = NEW.id;
END;

-- 4. Sipariş iptal - Sadece ready durumunda stok iadesi yap
CREATE TRIGGER trg_after_order_cancel
AFTER UPDATE ON orders
WHEN NEW.status = 'cancelled' AND OLD.status = 'ready'
BEGIN
    -- Stok hareketlerini iptal et
    UPDATE stock_movements 
    SET deleted_at = CURRENT_TIMESTAMP,
        notes = notes || ' (İptal edildi)'
    WHERE source_type = 'sale'
    AND source_id = NEW.id
    AND deleted_at IS NULL;

    -- Log kaydı
    INSERT INTO audit_log (
        tenant_id, action, table_name, record_id, old_data, new_data
    ) VALUES (
        NEW.tenant_id,
        'ORDER_CANCELLED',
        'orders',
        NEW.id,
        json_object('status', OLD.status),
        json_object('cancelled_by', NEW.updated_by)
    );
END;
