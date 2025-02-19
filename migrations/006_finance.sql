-- Finansal hesaplar tablosu
drop table if exists accounts;
drop table if exists transaction_categories;
drop table if exists transactions;
drop table if exists invoices;

CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,                           -- Hesap adı
    type TEXT CHECK(type IN ('cash','bank','other')) NOT NULL,  -- Hesap tipi
    currency TEXT DEFAULT 'TRY',                  -- Para birimi
    initial_balance DECIMAL(10,2) DEFAULT 0,      -- Açılış bakiyesi
    current_balance DECIMAL(10,2) DEFAULT 0,      -- Güncel bakiye
    bank_name TEXT,                              -- Banka adı (banka hesapları için)
    bank_branch TEXT,                            -- Şube adı
    bank_account_no TEXT,                        -- Hesap no
    iban TEXT,                                   -- IBAN
    notes TEXT,                                  -- Notlar
    is_active BOOLEAN DEFAULT 1,                 -- Aktif/Pasif
    allow_negative_balance BOOLEAN DEFAULT 0,     -- Eksi bakiyeye izin ver
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- İşlem kategorileri tablosu
CREATE TABLE transaction_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,                          -- Kategori adı
    type TEXT CHECK(type IN ('in','out')) NOT NULL, -- Giriş/Çıkış
    parent_id INTEGER,                           -- Üst kategori
    color TEXT DEFAULT '#666666',                -- Renk kodu
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (parent_id) REFERENCES transaction_categories(id)
);

-- İşlemler tablosu
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,                 -- İlgili hesap
    category_id INTEGER,                         -- İşlem kategorisi
    type TEXT CHECK(type IN ('in','out')) NOT NULL,  -- Giriş/Çıkış
    amount DECIMAL(10,2) NOT NULL,               -- Tutar
    date DATETIME NOT NULL,                      -- İşlem tarihi
    description TEXT,                            -- Açıklama
    reference_type TEXT,                         -- Referans tipi (order, expense vs)
    reference_id INTEGER,                        -- Referans ID
    payment_method TEXT,                         -- Ödeme yöntemi
    created_by INTEGER,                          -- İşlemi yapan kullanıcı
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (category_id) REFERENCES transaction_categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Ödenmemiş faturalar tablosu
CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('receivable','payable')) NOT NULL, -- Alacak/Borç
    reference_type TEXT,                         -- Referans tipi
    reference_id INTEGER,                        -- Referans ID
    amount DECIMAL(10,2) NOT NULL,               -- Tutar
    due_date DATE NOT NULL,                      -- Vade tarihi
    status TEXT CHECK(status IN ('pending','partial','paid')) DEFAULT 'pending',
    notes TEXT,                                  -- Notlar
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
