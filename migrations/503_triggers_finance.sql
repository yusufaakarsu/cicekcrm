-- Önce tüm trigger'ları temizle
DROP TRIGGER IF EXISTS trg_after_transaction_insert;
DROP TRIGGER IF EXISTS trg_after_transaction_update;
DROP TRIGGER IF EXISTS trg_after_transaction_cancel;

-- 1. Yeni transaction eklendiğinde
CREATE TRIGGER trg_after_transaction_insert
AFTER INSERT ON transactions
WHEN NEW.status = 'completed'
BEGIN
    -- Hesap bakiyesini güncelle
    UPDATE accounts 
    SET balance_calculated = balance_calculated + 
        CASE WHEN NEW.type = 'in' THEN NEW.amount ELSE -NEW.amount END
    WHERE id = NEW.account_id;

    -- Log tut
    INSERT INTO audit_log (tenant_id, action, table_name, record_id, new_data)
    VALUES (
        NEW.tenant_id,
        'BALANCE_UPDATE',
        'accounts',
        NEW.account_id,
        json_object('transaction_id', NEW.id, 'amount', NEW.amount, 'type', NEW.type)
    );
END;

-- 2. İşlem durumu değiştiğinde (pending -> completed)
CREATE TRIGGER trg_after_transaction_update 
AFTER UPDATE ON transactions 
WHEN NEW.status = 'completed' AND OLD.status = 'pending'
BEGIN
    UPDATE accounts 
    SET balance_calculated = balance_calculated + 
        CASE WHEN NEW.type = 'in' THEN NEW.amount ELSE -NEW.amount END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.account_id;

    INSERT INTO audit_log (tenant_id, action, table_name, record_id, new_data)
    VALUES (
        NEW.tenant_id,
        'BALANCE_UPDATE',
        'accounts',
        NEW.account_id,
        json_object('transaction_id', NEW.id, 'amount', NEW.amount, 'type', NEW.type)
    );
END;

-- 3. İşlem iptal edildiğinde
CREATE TRIGGER trg_after_transaction_cancel
AFTER UPDATE ON transactions 
WHEN NEW.status = 'cancelled' AND OLD.status = 'completed'
BEGIN
    -- Bakiyeyi geri al
    UPDATE accounts 
    SET balance_calculated = balance_calculated - 
        CASE WHEN OLD.type = 'in' THEN OLD.amount ELSE -OLD.amount END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.account_id;

    -- İlişkili kayıtları güncelle
    UPDATE orders 
    SET payment_status = CASE
            WHEN paid_amount - OLD.amount <= 0 THEN 'pending'
            WHEN paid_amount - OLD.amount < total_amount THEN 'partial'
            ELSE payment_status
        END,
        paid_amount = paid_amount - OLD.amount
    WHERE NEW.related_type = 'order' AND id = NEW.related_id;

    UPDATE purchase_orders
    SET payment_status = CASE
            WHEN paid_amount - OLD.amount <= 0 THEN 'pending'
            WHEN paid_amount - OLD.amount < total_amount THEN 'partial'
            ELSE payment_status
        END,
        paid_amount = paid_amount - OLD.amount
    WHERE NEW.related_type = 'purchase' AND id = NEW.related_id;

    -- Log kaydı
    INSERT INTO audit_log (tenant_id, action, table_name, record_id, old_data, new_data)
    VALUES (
        NEW.tenant_id,
        'TRANSACTION_CANCELLED',
        'transactions',
        NEW.id,
        json_object('status', OLD.status, 'amount', OLD.amount),
        json_object('status', NEW.status)
    );
END;

