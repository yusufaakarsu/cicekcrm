-- Trigger'ları sil
DROP TRIGGER IF EXISTS trg_after_transaction_insert;
DROP TRIGGER IF EXISTS trg_after_transaction_update;
DROP TRIGGER IF EXISTS trg_after_transaction_cancel;
DROP TRIGGER IF EXISTS trg_after_payment_status_change;
DROP TRIGGER IF EXISTS trg_after_order_payment_status_change;

-- Yeni transaction eklendiğinde 
CREATE TRIGGER trg_after_transaction_insert
AFTER INSERT ON transactions
WHEN NEW.status = 'paid'  -- 'completed' yerine 'paid' kullan
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

-- İşlem durumu değiştiğinde
CREATE TRIGGER trg_after_transaction_update 
AFTER UPDATE ON transactions 
WHEN NEW.status = 'paid' AND OLD.status = 'pending'  -- completed -> paid
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

-- İşlem iptal edildiğinde
CREATE TRIGGER trg_after_transaction_cancel
AFTER UPDATE ON transactions 
WHEN NEW.status = 'cancelled' AND OLD.status = 'paid'  -- completed -> paid
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

-- Purchase order ödemesi
CREATE TRIGGER trg_after_payment_status_change
AFTER UPDATE ON purchase_orders
WHEN NEW.payment_status = 'paid' AND OLD.payment_status = 'pending'  -- completed -> paid
BEGIN
    INSERT INTO transactions (
        tenant_id, account_id, category_id, type,
        amount, date, related_type, related_id,
        payment_method, description, status, created_by
    )
    SELECT 
        NEW.tenant_id,
        (SELECT id FROM accounts WHERE tenant_id = NEW.tenant_id AND type = 'cash' LIMIT 1),
        (SELECT id FROM transaction_categories WHERE tenant_id = NEW.tenant_id AND reporting_code = 'SUPPLIER' LIMIT 1),
        'out',
        NEW.total_amount,
        CURRENT_TIMESTAMP,
        'purchase',
        NEW.id,
        'cash',
        'Tedarikçi ödemesi #' || NEW.id,
        'paid',  -- 'completed' yerine 'paid'
        NEW.created_by  -- created_by kullan
    WHERE NEW.created_by IS NOT NULL;
END;

-- Sipariş tahsilatı için trigger
CREATE TRIGGER trg_after_order_payment_status_change 
AFTER UPDATE ON orders
WHEN NEW.payment_status = 'paid' AND OLD.payment_status = 'pending'
BEGIN
    INSERT INTO transactions (
        tenant_id, account_id, category_id, type,
        amount, date, related_type, related_id,
        payment_method, description, status, created_by
    )
    SELECT
        NEW.tenant_id,
        (SELECT id FROM accounts WHERE tenant_id = NEW.tenant_id AND type = 'cash' LIMIT 1),
        (SELECT id FROM transaction_categories WHERE tenant_id = NEW.tenant_id AND reporting_code = 'SALES_CASH' LIMIT 1),
        'in',
        NEW.total_amount,
        CURRENT_TIMESTAMP,
        'order',
        NEW.id,
        'cash',
        'Sipariş tahsilatı #' || NEW.id,
        'paid',  -- 'completed' yerine 'paid'
        NEW.updated_by;

    -- Audit log
    INSERT INTO audit_log (
        tenant_id, action, table_name, record_id, old_data, new_data
    ) VALUES (
        NEW.tenant_id,
        'PAYMENT_STATUS_CHANGE',
        'transactions',
        NEW.id,
        json_object(
            'status', OLD.payment_status,
            'amount', OLD.paid_amount
        ),
        json_object(
            'status', NEW.payment_status,
            'amount', NEW.paid_amount
        )
    );
END;

