-- Test verilerini hazırla
INSERT INTO accounts (name, type, initial_balance) 
VALUES ('Test Kasa', 'cash', 1000.00);

INSERT INTO transaction_categories (name, type) 
VALUES ('Satın Alma', 'out');

-- Test senaryosu 1: Yeni satın alma siparişi
INSERT INTO purchase_orders (
    supplier_id, order_date, total_amount, created_by
) VALUES (1, date('now'), 500.00, 1);

-- Test senaryosu 2: Ödeme yapma
UPDATE purchase_orders 
SET 
    payment_status = 'paid',
    paid_amount = 500.00,
    account_id = 1,
    payment_method = 'cash'
WHERE id = last_insert_rowid();

-- Kontrol sorguları
SELECT * FROM stock_movements WHERE source_type = 'purchase';
SELECT * FROM transactions WHERE related_type = 'purchase';
SELECT * FROM accounts WHERE id = 1;
