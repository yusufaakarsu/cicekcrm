-- Müşteri siparişleri için triggerlar
DROP TRIGGER IF EXISTS trg_after_order_item_insert;
DROP TRIGGER IF EXISTS trg_after_order_payment_update;

-- TODO: Bu kısım daha sonra implement edilecek
-- 1. Sipariş kalemi eklendiğinde stok çıkışı yap
CREATE TRIGGER trg_after_order_item_insert
AFTER INSERT ON order_items_materials
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
        'out',
        NEW.quantity,
        'sale',
        NEW.order_id,
        'Sipariş stok çıkışı',
        (SELECT created_by FROM orders WHERE id = NEW.order_id)
    );
END;

-- 2. Sipariş ödemesi alındığında transaction oluştur
CREATE TRIGGER trg_after_order_payment_update 
AFTER UPDATE OF payment_status, paid_amount ON orders
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
        (SELECT id FROM transaction_categories WHERE name = 'Satış' LIMIT 1),
        'in',
        NEW.paid_amount - COALESCE(OLD.paid_amount, 0),
        datetime('now'),
        'sale',
        NEW.id,
        NEW.payment_method,
        'Sipariş ödemesi #' || NEW.id,
        'completed',
        NEW.created_by
    );
END;
