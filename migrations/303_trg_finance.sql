-- Finansal işlemler için triggerlar
DROP TRIGGER IF EXISTS trg_after_transaction_insert;
DROP TRIGGER IF EXISTS trg_after_transaction_delete;
DROP TRIGGER IF EXISTS trg_after_account_initial_balance_update;

-- 1. Transaction eklendiğinde hesap bakiyesini güncelle
CREATE TRIGGER trg_after_transaction_insert
AFTER INSERT ON transactions
BEGIN
    UPDATE accounts 
    SET balance_calculated = CASE 
        WHEN NEW.type = 'in' THEN balance_calculated + NEW.amount
        WHEN NEW.type = 'out' THEN balance_calculated - NEW.amount
        ELSE balance_calculated
    END
    WHERE id = NEW.account_id;
END;

-- 2. Transaction silindiğinde hesap bakiyesini güncelle
CREATE TRIGGER trg_after_transaction_delete
AFTER UPDATE OF deleted_at ON transactions
WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL
BEGIN
    UPDATE accounts 
    SET balance_calculated = CASE 
        WHEN NEW.type = 'in' THEN balance_calculated - NEW.amount
        WHEN NEW.type = 'out' THEN balance_calculated + NEW.amount
        ELSE balance_calculated
    END
    WHERE id = NEW.account_id;
END;

-- 3. Hesap açılış bakiyesi güncellendiğinde
CREATE TRIGGER trg_after_account_initial_balance_update
AFTER UPDATE OF initial_balance ON accounts
WHEN NEW.initial_balance != OLD.initial_balance
BEGIN
    UPDATE accounts 
    SET balance_calculated = balance_calculated + (NEW.initial_balance - OLD.initial_balance)
    WHERE id = NEW.id;
END;
