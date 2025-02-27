-- Kasa açılış bakiyesi için transaction kaydı
INSERT INTO transactions (
    account_id,        -- Ana Kasa ID'si (1)
    category_id,       -- Nakit Satış kategorisi (1)
    type,             -- Giriş işlemi
    amount,           -- 10.000 TL
    date,             -- Şu anki tarih
    related_type,     -- İşlem tipi
    related_id,       -- İlişkili kayıt yok
    payment_method,   -- Nakit
    description,      -- Açıklama
    status,          -- Tamamlandı
    created_by       -- Admin kullanıcı
) VALUES (
    1,                                  -- Ana Kasa
    1,                                  -- Nakit Satış kategorisi
    'in',                              -- Giriş
    10000.00,                          -- Tutar
    datetime('now'),                   -- Tarih
    'opening_balance',                 -- İşlem tipi
    0,                                 -- İlişkili kayıt
    'cash',                           -- Ödeme yöntemi
    'Kasa açılış bakiyesi',           -- Açıklama
    'paid',                           -- Durum
    1                                 -- Admin user ID
);

-- Kontrol sorguları
SELECT * FROM transactions ORDER BY id DESC LIMIT 1;
SELECT * FROM accounts WHERE id = 1;
