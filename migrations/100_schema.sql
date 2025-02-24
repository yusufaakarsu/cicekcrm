-- 1. Finansal İşlemler (en bağımlı)
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS transaction_categories;
DROP TABLE IF EXISTS accounts;

-- 2. Sipariş Detayları ve Malzeme Kullanımı
DROP TABLE IF EXISTS order_items_materials;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;

-- 3. Müşteri İlişkili Tablolar
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS card_messages;
DROP TABLE IF EXISTS recipients;
DROP TABLE IF EXISTS customers;

-- 4. Ürün ve Reçete Sistemi
DROP TABLE IF EXISTS product_materials;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS product_categories;

-- 5. Stok ve Satın Alma Sistemi
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS purchase_order_items;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS raw_materials;
DROP TABLE IF EXISTS raw_material_categories;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS units;

-- 6. Sistem ve Yönetim Tabloları (en bağımsız)
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS tenant_settings;
DROP TABLE IF EXISTS delivery_regions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;


-- Ana tablolar
CREATE TABLE tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company_name TEXT,
    contact_email TEXT, 
    logo_url TEXT,
    primary_color TEXT DEFAULT '#0d6efd',
    language TEXT DEFAULT 'tr',
    timezone TEXT DEFAULT 'Europe/Istanbul',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin','staff')), -- Sadece 2 rol
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE tenant_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    require_stock BOOLEAN DEFAULT 0,      -- Stok kontrolü zorunlu mu?
    track_recipes BOOLEAN DEFAULT 0,      -- Reçete takibi yapılsın mı?
    allow_negative_stock BOOLEAN DEFAULT 0, -- Eksi stoka düşülebilir mi?
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    user_id INTEGER,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id INTEGER,
    old_data TEXT, -- JSON
    new_data TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE delivery_regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,             -- Kadıköy, Beşiktaş vs.
    parent_id INTEGER,              -- Üst bölge (örn: Anadolu Yakası)
    base_fee DECIMAL(10,2),         -- Temel teslimat ücreti
    min_order DECIMAL(10,2),        -- Minimum sipariş tutarı
    delivery_notes TEXT,            -- Teslimat notları
    is_active BOOLEAN DEFAULT 1,    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (parent_id) REFERENCES delivery_regions(id)
);

-- Birimler tablosu
CREATE TABLE units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,               -- Dal, Adet, Gram vs
    code TEXT NOT NULL,              -- PCS, GR, CM vs
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Ham madde kategorileri tablosu
CREATE TABLE raw_material_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,                -- Kategori adı (Çiçek, Ambalaj, Aksesuar vs)
    description TEXT,                  -- Kategori açıklaması
    display_order INTEGER,             -- Sıralama için
    status TEXT CHECK(status IN ('active','passive','archived')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Ham maddeler tablosu
CREATE TABLE raw_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    unit_id INTEGER NOT NULL,         -- Birim referansı
    status TEXT CHECK(status IN ('active','passive','archived')) DEFAULT 'active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    category_id INTEGER REFERENCES raw_material_categories(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (unit_id) REFERENCES units(id)
);

CREATE TABLE material_price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES raw_materials(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Tedarikçiler tablosu 
CREATE TABLE suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,                 
    contact_name TEXT,                  
    phone TEXT NOT NULL,                
    email TEXT,                         
    tax_number TEXT,                    
    address TEXT,
    notes TEXT,                         
    status TEXT CHECK(status IN ('active','passive','blacklist')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Satın alma siparişleri
CREATE TABLE purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Sipariş kalemleri
CREATE TABLE purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,      
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (material_id) REFERENCES raw_materials(id)
);

-- Stok hareketleri (sadeleştirilmiş)
CREATE TABLE stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,        -- raw_materials referansı
    movement_type TEXT CHECK(movement_type IN ('in','out')),
    quantity DECIMAL(10,2) NOT NULL,
    source_type TEXT CHECK(source_type IN 
        ('purchase',                     -- satın alma
         'sale',                         -- satış (reçeteden)
         'waste',                        -- fire/zayi
         'adjustment'                    -- düzeltme
        )),
    source_id INTEGER,                   -- sipariş/reçete ID
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (material_id) REFERENCES raw_materials(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Ürün kategorileri
CREATE TABLE product_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('active','passive','archived')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Satış ürünleri
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    category_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,  -- satış fiyatı
    status TEXT CHECK(status IN ('active','passive','archived')) DEFAULT 'active',
    image_url TEXT,                     -- ürün görseli
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (category_id) REFERENCES product_categories(id)
);

-- Ürün-Hammadde ilişkisi (taslak reçete)
CREATE TABLE product_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    default_quantity DECIMAL(10,2) NOT NULL, -- önerilen miktar
    is_required BOOLEAN DEFAULT 1, -- zorunlu malzeme mi?
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (material_id) REFERENCES raw_materials(id)
);

-- Sadece temel müşteri bilgileri
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,              -- Ahmet Bey, Ayşe Hanım gibi
    phone TEXT NOT NULL,             -- Tek zorunlu alan
    email TEXT,                      -- Opsiyonel
    notes TEXT,                      -- Genel notlar
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Müşterinin gönderdiği kişiler
CREATE TABLE recipients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,     -- hangi müşteri için
    name TEXT NOT NULL,               -- Ayşe Yılmaz gibi
    phone TEXT NOT NULL,              -- alıcı telefonu
    relationship TEXT,                -- anne, eş vs
    notes TEXT,                       -- "Kapıcıya haber ver" gibi notlar
    special_dates TEXT,               -- JSON: {"birthday": "05-15", "anniversary": "08-22"}
    preferences TEXT,                 -- JSON: {"flower": "gül", "color": "kırmızı", "allergens": ["zambak"]}
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Adres bilgileri (HERE API + manuel)
CREATE TABLE addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,     -- kimin adresi
    recipient_id INTEGER,             -- hangi alıcı için (opsiyonel)
    
    -- HERE API'den gelecek temel bilgiler
    here_place_id TEXT,              -- HERE API'nin unique ID'si
    label TEXT NOT NULL,             -- API'den gelen formatlı adres
    district TEXT NOT NULL,          -- ilçe (Kadıköy, Beşiktaş vs.)
    neighborhood TEXT,               -- mahalle
    street TEXT,                     -- cadde/sokak
    lat DECIMAL(10,8),              -- enlem 
    lng DECIMAL(11,8),              -- boylam
    
    -- Manuel eklenecek detaylar
    building_no TEXT,               -- bina no (HERE API'den gelmeyebilir)
    floor_no TEXT,                  -- kat no
    door_no TEXT,                   -- daire no
    directions TEXT,                -- tarif ("arka sokaktan girilecek" vs)
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (recipient_id) REFERENCES recipients(id)
);

-- Hazır kart mesajları
CREATE TABLE card_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    category TEXT NOT NULL,        -- birthday, anniversary, get_well vs
    title TEXT NOT NULL,          -- Mesaj başlığı/adı 
    content TEXT NOT NULL,        -- Asıl mesaj metni
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER,        -- Sıralama için
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Siparişler (optimize edildi)
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,    
    address_id INTEGER NOT NULL,      
    
    -- Teslimat bilgileri
    delivery_date DATE NOT NULL,
    delivery_time TEXT CHECK(delivery_time IN ('morning','afternoon','evening')) NOT NULL,
 
    -- Sipariş durumu
    status TEXT CHECK(status IN ('new','confirmed','preparing','ready','delivering','delivered','cancelled')) DEFAULT 'new',
    status_updated_at DATETIME,
    status_notes TEXT,
    
    -- Ödeme bilgileri
    subtotal DECIMAL(10,2) NOT NULL,      -- ara toplam
    delivery_fee DECIMAL(10,2) DEFAULT 0, -- teslimat ücreti
    tax_amount DECIMAL(10,2) DEFAULT 0,   -- vergi tutarı
    discount_amount DECIMAL(10,2) DEFAULT 0, -- indirim tutarı
    total_amount DECIMAL(10,2) NOT NULL,  -- genel toplam
    
    payment_method TEXT CHECK(payment_method IN ('cash','credit_card','bank_transfer')),
    payment_status TEXT CHECK(payment_status IN ('pending','paid','partial','refunded')) DEFAULT 'pending',
    paid_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Mesaj ve notlar
    card_message_id INTEGER,             -- Hazır mesaj seçildiyse
    custom_card_message TEXT,            -- Özel mesaj yazıldıysa
    customer_notes TEXT,                 -- Müşteri notu
    internal_notes TEXT,                 -- İç notlar
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    deleted_at DATETIME,

    prepared_by INTEGER REFERENCES users(id),
    preparation_start DATETIME,
    preparation_end DATETIME,

    delivered_at DATETIME,       -- Teslimat tamamlanma zamanı
    delivered_by INTEGER,        -- Teslim eden kurye
    delivery_proof TEXT,         -- Teslimat fotoğrafı/imza
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (recipient_id) REFERENCES recipients(id),
    FOREIGN KEY (address_id) REFERENCES addresses(id),
    FOREIGN KEY (card_message_id) REFERENCES card_messages(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (delivered_by) REFERENCES users(id)
);

-- Sipariş kalemleri (order_items) - orders ve products arasındaki ilişki
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Sipariş malzemeleri (kesin reçete)
CREATE TABLE order_items_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL, 
    order_item_id INTEGER NOT NULL,     -- Hangi sipariş kalemine ait
    material_id INTEGER NOT NULL,       -- Hangi ham madde
    quantity DECIMAL(10,2) NOT NULL,    -- Kullanılan miktar
    unit_price DECIMAL(10,2),           -- NOT NULL kaldırıldı
    total_amount DECIMAL(10,2),         -- NOT NULL kaldırıldı
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (order_item_id) REFERENCES order_items(id),
    FOREIGN KEY (material_id) REFERENCES raw_materials(id)
);

-- Para hesapları (kasa, banka vs)
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,                          
    type TEXT CHECK(type IN ('cash','pos','bank','online')) NOT NULL,
    initial_balance DECIMAL(10,2) DEFAULT 0,      
    balance_calculated DECIMAL(10,2) DEFAULT 0,   -- Hesaplanan güncel bakiye
    balance_verified DECIMAL(10,2) DEFAULT 0,     -- Son kontrol edilen bakiye
    last_verified_at DATETIME,                    -- Son kontrol tarihi
    status TEXT CHECK(status IN ('active','suspended','closed')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Para hareketleri
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    
    -- Temel bilgiler
    type TEXT CHECK(type IN ('in','out')) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATETIME NOT NULL,                      -- İşlem tarihi
    
    -- İlişkili kayıt
    related_type TEXT NOT NULL,                  -- order, expense, supplier vs
    related_id INTEGER NOT NULL,                 -- ilgili kaydın ID'si
    
    -- Detaylar
    payment_method TEXT CHECK(payment_method IN 
        ('cash','credit_card','bank_transfer','online')) NOT NULL,
    description TEXT,                            -- Açıklama
    notes TEXT,                                  -- İç notlar
    
    -- Takip
    status TEXT CHECK(status IN 
        ('pending','completed','cancelled','failed')) DEFAULT 'completed',
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (category_id) REFERENCES transaction_categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- İşlem kategorileri 
CREATE TABLE transaction_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('in','out','both')) NOT NULL,
    reporting_code TEXT,                         -- Raporlama için kod
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
