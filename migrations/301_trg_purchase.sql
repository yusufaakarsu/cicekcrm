-- Satın alma siparişleri için triggerlar
DROP TRIGGER IF EXISTS trg_after_purchase_order_items_insert;
DROP TRIGGER IF EXISTS trg_after_purchase_payment_update;

-- 1. Satın alma siparişi kaydedildiğinde stok girişi yap
CREATE TRIGGER trg_after_purchase_order_items_insert
AFTER INSERT ON purchase_order_items
BEGIN
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
END;
