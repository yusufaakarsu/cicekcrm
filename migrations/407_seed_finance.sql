-- Test kategorileri
INSERT INTO transaction_categories (tenant_id, name, type, color) VALUES
(1, 'Satış Gelirleri', 'in', '#28a745'),
(1, 'Nakit Tahsilat', 'in', '#17a2b8'),
(1, 'Kredi Kartı Tahsilatı', 'in', '#007bff'),
(1, 'Havale/EFT', 'in', '#6f42c1'),
(1, 'Çiçek Alımı', 'out', '#dc3545'),
(1, 'Malzeme Alımı', 'out', '#fd7e14'),
(1, 'Personel Maaşları', 'out', '#e83e8c'),
(1, 'Kira Gideri', 'out', '#6c757d');

-- Test hesapları
INSERT INTO accounts (tenant_id, name, type, initial_balance, current_balance) VALUES
(1, 'Ana Kasa', 'cash', 1000.00, 1000.00),
(1, 'Pos Hesabı', 'bank', 500.00, 500.00),
(1, 'Banka Hesabı', 'bank', 2500.00, 2500.00);

-- Test işlemleri
INSERT INTO transactions (
    tenant_id, account_id, category_id, type, amount, 
    date, description, payment_method, created_by
) VALUES
(1, 1, 1, 'in', 250.00, datetime('now'), 'Test satış', 'cash', 1),
(1, 2, 3, 'in', 750.00, datetime('now'), 'Kredi kartı tahsilatı', 'credit_card', 1),
(1, 3, 5, 'out', 1000.00, datetime('now'), 'Toptan çiçek alımı', 'bank_transfer', 1);

-- Test faturaları
INSERT INTO invoices (
    tenant_id, type, amount, due_date, status, notes
) VALUES
(1, 'receivable', 500.00, date('now', '+7 days'), 'pending', 'Test alacak'),
(1, 'payable', 750.00, date('now', '+15 days'), 'pending', 'Test borç');
