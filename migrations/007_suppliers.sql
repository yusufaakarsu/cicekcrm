-- Tabloları temizle
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS supplier_orders;
DROP TABLE IF EXISTS purchase_order_items;

-- 1. Tedarikçiler tablosu (bağımlılığı yok)
CREATE TABLE suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_number TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- 2. Tedarikçi sipariş tablosu (suppliers'a bağımlı)
CREATE TABLE supplier_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    expected_date DATE,
    status TEXT CHECK(status IN ('draft','ordered','partial','received','cancelled','refunded')) DEFAULT 'draft',
    payment_status TEXT CHECK(payment_status IN ('pending','partial','paid')) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);


-- 3. Tedarikçi sipariş kalemleri (supplier_orders ve products'a bağımlı)
CREATE TABLE purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    deleted_at DATETIME,
    FOREIGN KEY (purchase_order_id) REFERENCES supplier_orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
