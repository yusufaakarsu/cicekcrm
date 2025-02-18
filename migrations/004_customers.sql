CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    customer_type TEXT CHECK(customer_type IN ('retail','corporate')) DEFAULT 'retail',
    tax_number TEXT,
    company_name TEXT,
    notes TEXT,
    special_dates TEXT, -- JSON: doğum günü, evlilik yıldönümü vs.
    tags TEXT, -- JSON: VIP, düzenli müşteri vs.
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    avg_basket DECIMAL(10,2) DEFAULT 0,
    last_order_date DATETIME,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE customer_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    relationship TEXT, -- eş, asistan, sekreter vs.
    is_primary BOOLEAN DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    label TEXT NOT NULL, -- ev, iş, yazlık vs.
    recipient_name TEXT,
    recipient_phone TEXT,
    country_code TEXT DEFAULT 'TUR',
    city TEXT DEFAULT 'İstanbul',
    district TEXT NOT NULL,
    neighborhood TEXT,
    street TEXT,
    building_no TEXT,
    floor TEXT,
    apartment_no TEXT,
    postal_code TEXT,
    directions TEXT,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    is_default BOOLEAN DEFAULT 0,
    here_place_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE customer_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    key TEXT NOT NULL, -- favori_renk, alerji vs.
    value TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
