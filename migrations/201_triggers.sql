-- Purchase order items trigger - stok hareketleri için
CREATE TRIGGER IF NOT EXISTS after_purchase_order_items_insert
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
        'Satın alma siparişinden',
        (SELECT created_by FROM purchase_orders WHERE id = NEW.order_id)
    );
END;

-- Purchase order payment trigger - transactions için
CREATE TRIGGER IF NOT EXISTS after_purchase_order_payment_update
AFTER UPDATE OF payment_status, paid_amount ON purchase_orders
WHEN NEW.payment_status != OLD.payment_status OR NEW.paid_amount != OLD.paid_amount
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
        1, -- Default kasa hesabı
        1, -- Satın alma kategori ID'si
        'out',
        CASE 
            WHEN NEW.paid_amount > OLD.paid_amount THEN NEW.paid_amount - OLD.paid_amount
            ELSE NEW.paid_amount
        END,
        datetime('now'),
        'purchase',
        NEW.id,
        'cash', -- Default ödeme yöntemi
        'Satın alma ödemesi #' || NEW.id,
        NEW.payment_status,
        NEW.created_by
    );
END;
