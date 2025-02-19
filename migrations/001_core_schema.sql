CREATE TABLE tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    company_name TEXT,
    contact_email TEXT, 
    logo_url TEXT,
    primary_color TEXT DEFAULT '#0d6efd',
    language TEXT DEFAULT 'tr',
    timezone TEXT DEFAULT 'Europe/Istanbul',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK(role IN ('owner','admin','manager','staff')),
    permissions TEXT, -- JSON izinler
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE tenant_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    permissions TEXT, -- JSON
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE subscription_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    billing_interval TEXT CHECK(billing_interval IN ('monthly','yearly')),
    features TEXT, -- JSON
    max_users INTEGER,
    max_products INTEGER,
    max_orders INTEGER,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tenant_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('active','trial','cancelled','suspended')),
    start_date DATE NOT NULL,
    end_date DATE,
    billing_data TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
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
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tenant settings tablosunu ekleyelim
CREATE TABLE tenant_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    require_stock BOOLEAN DEFAULT 0,      -- Stok kontrolü zorunlu mu?
    track_recipes BOOLEAN DEFAULT 0,      -- Reçete takibi yapılsın mı?
    track_costs BOOLEAN DEFAULT 0,        -- Maliyet takibi yapılsın mı?
    allow_negative_stock BOOLEAN DEFAULT 0, -- Eksi stoka düşülebilir mi?
    auto_update_prices BOOLEAN DEFAULT 0,  -- Maliyete göre fiyat güncellensin mi?
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Teslimat bölgeleri tablosu
CREATE TABLE delivery_regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,             -- Kadıköy, Beşiktaş vs.
    parent_id INTEGER,              -- Üst bölge (örn: Anadolu Yakası)
    base_fee DECIMAL(10,2),         -- Temel teslimat ücreti
    min_order DECIMAL(10,2),        -- Minimum sipariş tutarı
    delivery_notes TEXT,            -- Teslimat notları
    is_active BOOLEAN DEFAULT 1,    -- Bölge aktif mi?
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (parent_id) REFERENCES delivery_regions(id)
);


