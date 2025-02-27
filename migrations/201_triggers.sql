-- 1. Satın alma siparişi item eklenince stok hareketi oluştur
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

-- 2. Satın alma ödemesi yapıldığında transactions tablosuna kaydet ve accounts tablosunu güncelle
CREATE TRIGGER IF NOT EXISTS after_purchase_order_payment_update
AFTER UPDATE OF payment_status, paid_amount ON purchase_orders
WHEN NEW.payment_status != OLD.payment_status OR NEW.paid_amount != OLD.paid_amount
BEGIN
    -- Sadece yeni ödeme tutarı kadar transaction oluştur
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
        CASE 
            WHEN NEW.paid_amount > COALESCE(OLD.paid_amount, 0) 
            THEN NEW.paid_amount - COALESCE(OLD.paid_amount, 0)
            ELSE NEW.paid_amount
        END,
        datetime('now'),
        'purchase',
        NEW.id,
        NEW.payment_method,
        'Satın alma ödemesi #' || NEW.id,
        'paid',
        NEW.created_by
    );
END;

-- 3. Transaction eklendiğinde account bakiyesini güncelle (double-check)
CREATE TRIGGER IF NOT EXISTS after_transaction_insert
AFTER INSERT ON transactions
BEGIN
    UPDATE accounts 
    SET 
        balance_calculated = CASE 
            WHEN NEW.type = 'in' THEN balance_calculated + NEW.amount
            WHEN NEW.type = 'out' THEN balance_calculated - NEW.amount
            ELSE balance_calculated
        END
    WHERE id = NEW.account_id;
END;

-- 4. Transaction silindiğinde account bakiyesini geri al
CREATE TRIGGER IF NOT EXISTS after_transaction_delete
AFTER UPDATE OF deleted_at ON transactions
WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL
BEGIN
    UPDATE accounts 
    SET 
        balance_calculated = CASE 
            WHEN NEW.type = 'in' THEN balance_calculated - NEW.amount
            WHEN NEW.type = 'out' THEN balance_calculated + NEW.amount
            ELSE balance_calculated
        END
    WHERE id = NEW.account_id;
END;
