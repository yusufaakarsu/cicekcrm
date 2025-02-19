PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS purchase_order_items;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS product_categories;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS tenants;
DROP VIEW IF EXISTS finance_stats;
DROP VIEW IF EXISTS delivery_stats;

PRAGMA foreign_keys = ON;

-- Tüm schema tek dosyada (foreign key kontrolleri olmadan)

-- 1. Core Tables
CREATE TABLE tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    contact_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    -- ...existing code...
);

CREATE TABLE tenant_users (
    -- ...existing code...
);

-- 2. Product & Stock Tables
CREATE TABLE product_types (
    -- ...existing code...
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    category_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    purchase_price DECIMAL(10, 2) NOT NULL,
    retail_price DECIMAL(10, 2) NOT NULL,
    wholesale_price DECIMAL(10, 2),
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    is_deleted BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Customer Tables
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT CHECK (email LIKE '%@%._%'),
    phone TEXT NOT NULL,
    address TEXT,
    city TEXT,
    district TEXT,
    notes TEXT,
    customer_type TEXT CHECK (customer_type IN ('retail', 'corporate')) DEFAULT 'retail',
    tax_number TEXT,
    company_name TEXT,
    special_dates TEXT,
    is_deleted BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    country_code TEXT DEFAULT 'TUR',
    country_name TEXT DEFAULT 'Türkiye',
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    postal_code TEXT,
    street TEXT,
    building_no TEXT,
    floor TEXT,
    apartment_no TEXT,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    is_default BOOLEAN DEFAULT 0,
    is_deleted BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    source TEXT DEFAULT 'manual',
    here_place_id TEXT
);

-- 4. Order Tables
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    status TEXT CHECK (
        status IN (
            'new',
            'preparing',
            'ready',
            'delivering',
            'delivered',
            'cancelled'
        )
    ) DEFAULT 'new',
    delivery_date DATETIME NOT NULL,
    delivery_time_slot TEXT CHECK (
        delivery_time_slot IN ('morning', 'afternoon', 'evening')
    ),
    delivery_notes TEXT,
    delivery_status TEXT CHECK (
        delivery_status IN (
            'pending',
            'assigned',
            'on_way',
            'completed',
            'failed'
        )
    ) DEFAULT 'pending',
    courier_notes TEXT,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    recipient_note TEXT,
    card_message TEXT,
    recipient_alternative_phone TEXT,
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    distance_fee DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    discount_code TEXT,
    total_amount DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) DEFAULT 0,
    profit_margin DECIMAL(5, 2) DEFAULT 0,
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
    payment_method TEXT CHECK (
        payment_method IN ('cash', 'credit_card', 'bank_transfer')
        total_amount DECIMAL(10, 2) NOT NULL,
        cost_price DECIMAL(10, 2) DEFAULT 0,
        profit_margin DECIMAL(5, 2) DEFAULT 0,
        payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
        payment_method TEXT CHECK (
            payment_method IN ('cash', 'credit_card', 'bank_transfer')
        ),
        payment_notes TEXT,
        source TEXT CHECK (source IN ('web', 'phone', 'store', 'other')) DEFAULT 'store',
        notes TEXT,
        is_deleted BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        delivery_address_id INTEGER,
        delivery_type TEXT CHECK(delivery_type IN ('customer', 'recipient')) DEFAULT 'recipient',
        FOREIGN KEY (customer_id) REFERENCES customers (id),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
        FOREIGN KEY (delivery_address_id) REFERENCES addresses(id)
    );

DROP TABLE IF EXISTS order_items;

CREATE TABLE
    order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER NOT NULL,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        cost_price DECIMAL(10, 2) NOT NULL,
        notes TEXT,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
    );

DROP TABLE IF EXISTS purchase_orders;

CREATE TABLE
    purchase_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_id INTEGER NOT NULL,
        status TEXT CHECK (
            status IN ('draft', 'ordered', 'received', 'cancelled')
        ) DEFAULT 'draft',
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'partial')) DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
    );

DROP TABLE IF EXISTS purchase_order_items;

CREATE TABLE
    purchase_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
    );

-- Adres tablosunu düzenle
CREATE TABLE addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL, -- Müşteri ilişkisi eklendi
    label TEXT NOT NULL,
    country_code TEXT DEFAULT 'TUR',
    country_name TEXT DEFAULT 'Türkiye',
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    postal_code TEXT,
    street TEXT,
    building_no TEXT,
    floor TEXT,           -- Kat bilgisi eklendi
    apartment_no TEXT,    -- Daire no eklendi
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    is_default BOOLEAN DEFAULT 0, -- Varsayılan adres mi?
    is_deleted BOOLEAN DEFAULT 0, -- Silindi mi?
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    source TEXT DEFAULT 'manual',
    here_place_id TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) -- Müşteri ilişkisi eklendi
);

-- Adres indekslerini güncelle
CREATE INDEX idx_addresses_tenant ON addresses(tenant_id);
CREATE INDEX idx_addresses_customer ON addresses(customer_id); -- Yeni indeks
CREATE INDEX idx_addresses_city ON addresses(city);
CREATE INDEX idx_addresses_district ON addresses(district);
CREATE INDEX idx_addresses_here_id ON addresses(here_place_id);

CREATE INDEX idx_customers_phone ON customers (phone);

CREATE INDEX idx_orders_customer ON orders (customer_id);

CREATE INDEX idx_orders_delivery_date ON orders (delivery_date);

CREATE INDEX idx_orders_status ON orders (status);

CREATE INDEX idx_orders_delivery_status ON orders (delivery_status);

CREATE INDEX idx_orders_payment_status ON orders (payment_status);

CREATE INDEX idx_orders_delivery_date_status ON orders (delivery_date, status);

CREATE INDEX idx_order_items_order ON order_items (order_id);

CREATE INDEX idx_products_category ON products (category_id);

CREATE INDEX idx_customers_tenant ON customers (tenant_id);

CREATE INDEX idx_suppliers_tenant ON suppliers (tenant_id);

CREATE INDEX idx_products_tenant ON products (tenant_id);

CREATE INDEX idx_orders_tenant ON orders (tenant_id);

CREATE INDEX idx_orderitems_tenant ON order_items (tenant_id);

CREATE INDEX idx_customers_name ON customers (name);

CREATE INDEX idx_customers_email ON customers (email);

CREATE INDEX idx_suppliers_name ON suppliers (name);

CREATE INDEX idx_suppliers_email ON suppliers (email);

CREATE VIEW
    finance_stats AS
SELECT
    DATE (created_at) AS date,
    COUNT(*) AS total_orders,
    SUM(total_amount) AS revenue,
    SUM(cost_price) AS costs,
    (SUM(total_amount) - SUM(cost_price)) AS profit,
    ROUND(
        (SUM(total_amount) - SUM(cost_price)) / SUM(total_amount) * 100,
        2
    ) AS margin
FROM
    orders
WHERE
    status != 'cancelled'
GROUP BY
    DATE (created_at);

CREATE VIEW
    delivery_stats AS
SELECT
    DATE (delivery_date) AS date,
    delivery_time_slot,
    delivery_district,
    COUNT(*) AS total_deliveries,
    AVG(delivery_fee) AS avg_delivery_fee,
    SUM(
        CASE
            WHEN delivery_status = 'completed' THEN 1
            ELSE 0
        END
    ) AS completed_deliveries
FROM
    orders
GROUP BY
    DATE (delivery_date),
    delivery_time_slot,
    delivery_district;

-- Triggerlar
CREATE TRIGGER update_customers_updated_at AFTER
UPDATE ON customers FOR EACH ROW BEGIN
UPDATE customers
SET
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = OLD.id;

END;

DROP TABLE IF EXISTS audit_log;

CREATE TABLE
    audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        operation TEXT CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        old_data TEXT,
        new_data TEXT
    );

CREATE TRIGGER audit_customers_update AFTER
UPDATE ON customers FOR EACH ROW BEGIN
INSERT INTO
    audit_log (
        table_name,
        record_id,
        operation,
        old_data,
        new_data
    )
VALUES
    (
        'customers',
        OLD.id,
        'UPDATE',
        json_object (
            'name',
            OLD.name,
            'email',
            OLD.email,
            'phone',
            OLD.phone
        ),
        json_object (
            'name',
            NEW.name,
            'email',
            NEW.email,
            'phone',
            NEW.phone
        )
    );

END;

CREATE TRIGGER audit_customers_insert AFTER INSERT ON customers FOR EACH ROW BEGIN
INSERT INTO
    audit_log (table_name, record_id, operation, new_data)
VALUES
    (
        'customers',
        NEW.id,
        'INSERT',
        json_object (
            'name',
            NEW.name,
            'email',
            NEW.email,
            'phone',
            NEW.phone
        )
    );

END;

CREATE TRIGGER audit_customers_delete AFTER DELETE ON customers FOR EACH ROW BEGIN
INSERT INTO
    audit_log (table_name, record_id, operation, old_data)
VALUES
    (
        'customers',
        OLD.id,
        'DELETE',
        json_object (
            'name',
            OLD.name,
            'email',
            OLD.email,
            'phone',
            OLD.phone
        )
    );

END;

CREATE TRIGGER soft_delete_customers_propagate AFTER
UPDATE ON customers FOR EACH ROW WHEN NEW.is_deleted = 1
AND OLD.is_deleted = 0 BEGIN
UPDATE orders
SET
    is_deleted = 1,
    updated_at = CURRENT_TIMESTAMP
WHERE
    customer_id = NEW.id;

END;