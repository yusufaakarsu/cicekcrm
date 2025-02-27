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

-- 2. Satın alma ödemesi yapıldığında transaction oluştur
CREATE TRIGGER trg_after_purchase_payment_update
AFTER UPDATE OF payment_status, paid_amount ON purchase_orders
WHEN NEW.payment_status != OLD.payment_status 
   OR (NEW.paid_amount IS NOT NULL AND NEW.paid_amount != COALESCE(OLD.paid_amount, 0))
BEGIN
    INSERT INTO transactions (
        account_id,
        category_id,
        type,
        amount,
        date,
        related_type,
        related_id,
        payment_method,
        description,
        status,
        created_by
    ) VALUES (
        NEW.account_id,
        (SELECT id FROM transaction_categories WHERE name = 'Satın Alma' LIMIT 1),
        'out',
        NEW.paid_amount - COALESCE(OLD.paid_amount, 0),
        datetime('now'),
        'purchase',
        NEW.id,
        NEW.payment_method,
        'Satın alma ödemesi #' || NEW.id,
        'completed',
        NEW.created_by
    );
END;
