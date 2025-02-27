-- Satın alma siparişleri için triggerlar
DROP TRIGGER IF EXISTS trg_after_purchase_order_items_insert;
DROP TRIGGER IF EXISTS trg_after_purchase_order_items_update;
DROP TRIGGER IF EXISTS trg_after_purchase_order_items_delete;
DROP TRIGGER IF EXISTS trg_after_purchase_payment_update;

-- 1. Satın alma siparişi kaydedildiğinde stok girişi yap
CREATE TRIGGER trg_after_purchase_order_items_insert
AFTER INSERT ON purchase_order_items
BEGIN
    -- Stok hareketi oluştur (giriş)
    INSERT INTO stock_movements (
        material_id,
        movement_type,
        quantity,
        source_type,
        source_id,
        notes,
        created_by
    ) VALUES (
        NEW.material_id,
        'in',
        NEW.quantity,
        'purchase',
        NEW.order_id,
        'Satın alma siparişi girişi',
        (SELECT created_by FROM purchase_orders WHERE id = NEW.order_id)
    );

    -- Sipariş tutarını güncelle
    UPDATE purchase_orders 
    SET total_amount = (
        SELECT COALESCE(SUM(quantity * unit_price), 0)
        FROM purchase_order_items 
        WHERE order_id = NEW.order_id
        AND deleted_at IS NULL
    )
    WHERE id = NEW.order_id;
END;

-- 2. Satın alma siparişi güncellendiğinde stok hareketini güncelle
CREATE TRIGGER trg_after_purchase_order_items_update
AFTER UPDATE ON purchase_order_items
WHEN OLD.quantity != NEW.quantity AND NEW.deleted_at IS NULL
BEGIN
    -- Eski stok hareketini iptal et
    UPDATE stock_movements 
    SET deleted_at = DATETIME('now')
    WHERE source_type = 'purchase' 
    AND source_id = NEW.order_id
    AND material_id = NEW.material_id;
    
    -- Yeni stok hareketi oluştur
    INSERT INTO stock_movements (
        material_id,
        movement_type,
        quantity,
        source_type,
        source_id,
        notes,
        created_by
    ) VALUES (
        NEW.material_id,
        'in',
        NEW.quantity,
        'purchase',
        NEW.order_id,
        'Satın alma siparişi güncelleme',
        (SELECT created_by FROM purchase_orders WHERE id = NEW.order_id)
    );

    -- Sipariş tutarını güncelle
    UPDATE purchase_orders 
    SET total_amount = (
        SELECT COALESCE(SUM(quantity * unit_price), 0)
        FROM purchase_order_items 
        WHERE order_id = NEW.order_id
        AND deleted_at IS NULL
    )
    WHERE id = NEW.order_id;
END;

-- 3. Satın alma siparişi silindiğinde stok hareketini iptal et
CREATE TRIGGER trg_after_purchase_order_items_delete
AFTER UPDATE ON purchase_order_items
WHEN NEW.deleted_at IS NOT NULL
BEGIN
    -- Stok hareketini iptal et
    UPDATE stock_movements 
    SET deleted_at = DATETIME('now')
    WHERE source_type = 'purchase' 
    AND source_id = NEW.order_id
    AND material_id = NEW.material_id;

    -- Sipariş tutarını güncelle
    UPDATE purchase_orders 
    SET total_amount = (
        SELECT COALESCE(SUM(quantity * unit_price), 0)
        FROM purchase_order_items 
        WHERE order_id = NEW.order_id
        AND deleted_at IS NULL
    )
    WHERE id = NEW.order_id;
END;

-- 4. Ödeme durumu güncellendiğinde sipariş durumunu güncelle
CREATE TRIGGER trg_after_purchase_payment_update 
AFTER UPDATE ON purchase_orders
WHEN OLD.paid_amount != NEW.paid_amount
BEGIN
    UPDATE purchase_orders SET
        payment_status = CASE
            WHEN NEW.paid_amount >= NEW.total_amount THEN 'paid'
            WHEN NEW.paid_amount > 0 THEN 'partial'
            ELSE 'pending'
        END
    WHERE id = NEW.id;
END;
