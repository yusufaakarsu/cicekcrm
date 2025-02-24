-- Hesap bakiyesini güncelleme trigger'ı
CREATE TRIGGER trg_after_transaction_balance
AFTER INSERT ON transactions
WHEN NEW.status = 'completed'
BEGIN
    UPDATE accounts 
    SET balance_calculated = balance_calculated + 
        CASE 
            WHEN NEW.type = 'in' THEN NEW.amount 
            ELSE -NEW.amount 
        END
    WHERE id = NEW.account_id 
    AND tenant_id = NEW.tenant_id;

    -- Audit log kaydı
    INSERT INTO audit_log (
        tenant_id,
        action,
        table_name,
        record_id,
        new_data
    )
    VALUES (
        NEW.tenant_id,
        'BALANCE_UPDATE',
        'accounts',
        NEW.account_id,
        json_object(
            'transaction_id', NEW.id,
            'amount', NEW.amount,
            'type', NEW.type
        )
    );
END;

-- İşlem iptal edildiğinde bakiyeyi güncelleme
CREATE TRIGGER trg_after_transaction_cancel
AFTER UPDATE ON transactions
WHEN NEW.status = 'cancelled' AND OLD.status = 'completed'
BEGIN
    UPDATE accounts 
    SET balance_calculated = balance_calculated - 
        CASE 
            WHEN NEW.type = 'in' THEN NEW.amount 
            ELSE -NEW.amount 
        END
    WHERE id = NEW.account_id 
    AND tenant_id = NEW.tenant_id;

    -- Audit log kaydı
    INSERT INTO audit_log (
        tenant_id,
        action,
        table_name,
        record_id,
        new_data
    )
    VALUES (
        NEW.tenant_id,
        'BALANCE_UPDATE_CANCEL',
        'accounts',
        NEW.account_id,
        json_object(
            'transaction_id', NEW.id,
            'amount', NEW.amount,
            'type', NEW.type
        )
    );
END;

-- İşlem güncelleme trigger'ı
CREATE TRIGGER trg_after_transaction_update
AFTER UPDATE ON transactions
WHEN NEW.amount != OLD.amount AND NEW.status = 'completed'
BEGIN
    -- Eski tutarı geri al
    UPDATE accounts 
    SET balance_calculated = balance_calculated - 
        CASE WHEN OLD.type = 'in' THEN OLD.amount ELSE -OLD.amount END
    WHERE id = OLD.account_id;
    
    -- Yeni tutarı ekle
    UPDATE accounts 
    SET balance_calculated = balance_calculated + 
        CASE WHEN NEW.type = 'in' THEN NEW.amount ELSE -NEW.amount END
    WHERE id = NEW.account_id;

    -- Log kaydı
    INSERT INTO audit_log (tenant_id, action, table_name, record_id, old_data, new_data)
    VALUES (
        NEW.tenant_id,
        'UPDATE',
        'transactions',
        NEW.id,
        json_object('amount', OLD.amount, 'type', OLD.type),
        json_object('amount', NEW.amount, 'type', NEW.type)
    );
END;
