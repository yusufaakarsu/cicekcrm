
-- 1. Para girişi/çıkışı olduğunda hesap bakiyesini güncelle
CREATE TRIGGER trg_after_transaction_insert
AFTER INSERT ON transactions
BEGIN
    UPDATE accounts 
    SET balance_calculated = (
        SELECT COALESCE(SUM(
            CASE type 
                WHEN 'in' THEN amount 
                WHEN 'out' THEN -amount 
            END
        ), 0)
        FROM transactions 
        WHERE account_id = NEW.account_id 
        AND status = 'completed'
        AND deleted_at IS NULL
    )
    WHERE id = NEW.account_id;

    -- Audit log
    INSERT INTO audit_log (
        tenant_id, 
        user_id,
        action,
        table_name,
        record_id,
        new_data
    ) 
    VALUES (
        NEW.tenant_id,
        NEW.created_by,
        'INSERT',
        'transactions',
        NEW.id,
        json_object(
            'type', NEW.type,
            'amount', NEW.amount,
            'account_id', NEW.account_id
        )
    );
END;

-- 2. Sipariş ödemesi geldiğinde sipariş durumunu güncelle
CREATE TRIGGER trg_payment_received
AFTER INSERT ON transactions
WHEN NEW.related_type = 'order' AND NEW.type = 'in'
BEGIN
    UPDATE orders 
    SET 
        payment_status = CASE
            WHEN (
                SELECT COALESCE(SUM(amount), 0) 
                FROM transactions 
                WHERE related_type = 'order' 
                AND related_id = NEW.related_id 
                AND type = 'in'
                AND status = 'completed'
            ) >= total_amount THEN 'paid'
            ELSE 'partial'
        END,
        paid_amount = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM transactions 
            WHERE related_type = 'order' 
            AND related_id = NEW.related_id 
            AND type = 'in'
            AND status = 'completed'
        )
    WHERE id = NEW.related_id;
END;

-- 3. Günlük kasa kontrolü (gün sonu)
CREATE TRIGGER trg_daily_closing
AFTER UPDATE ON accounts
WHEN NEW.balance_verified != OLD.balance_verified
BEGIN
    -- Mutabakat kaydı
    INSERT INTO audit_log (
        tenant_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data
    )
    VALUES (
        NEW.tenant_id,
        'RECONCILIATION',
        'accounts',
        NEW.id,
        json_object(
            'balance_calculated', NEW.balance_calculated,
            'balance_verified', OLD.balance_verified,
            'difference', NEW.balance_calculated - OLD.balance_verified
        ),
        json_object(
            'balance_verified', NEW.balance_verified,
            'last_verified_at', CURRENT_TIMESTAMP
        )
    );

    -- Hesabın son kontrol zamanını güncelle
    UPDATE accounts 
    SET last_verified_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- 4. İşlem iptali (void işlemi)
CREATE TRIGGER trg_transaction_void
AFTER UPDATE OF status ON transactions
WHEN NEW.status = 'cancelled' AND OLD.status = 'completed'
BEGIN
    -- Hesap bakiyesini güncelle
    UPDATE accounts 
    SET balance_calculated = balance_calculated - (
        CASE NEW.type 
            WHEN 'in' THEN NEW.amount 
            WHEN 'out' THEN -NEW.amount 
        END
    )
    WHERE id = NEW.account_id;

    -- İlgili kaydın ödeme durumunu güncelle
    UPDATE orders
    SET payment_status = CASE
        WHEN paid_amount - NEW.amount <= 0 THEN 'pending'
        WHEN paid_amount - NEW.amount < total_amount THEN 'partial'
        ELSE payment_status
    END,
    paid_amount = paid_amount - NEW.amount
    WHERE id = NEW.related_id 
    AND NEW.related_type = 'order';
END;
