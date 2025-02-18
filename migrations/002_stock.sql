-- Stok birimleri
CREATE TABLE stock_units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,     -- adet, dal, demet, kg, gram vs.
    symbol TEXT NOT NULL,   -- ad, dl, dm, kg, gr
    base_unit_id INTEGER,  -- temel birim (örn: gram için kg)
    conversion_rate DECIMAL(10,4), -- dönüşüm oranı (1000 gram = 1 kg)
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (base_unit_id) REFERENCES stock_units(id)
);

CREATE TABLE suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_number TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Stok hareketleri
CREATE TABLE stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    movement_type TEXT CHECK(movement_type IN ('in','out')),
    quantity DECIMAL(10,2) NOT NULL,
    unit_id INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    source_type TEXT NOT NULL, -- purchase, sale, recipe, waste, adjustment
    source_id INTEGER,         -- ilgili sipariş/alım ID
    notes TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (unit_id) REFERENCES stock_units(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Stok sayımı
CREATE TABLE inventory_counts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    count_date DATE NOT NULL,
    status TEXT CHECK(status IN ('draft','in_progress','completed','cancelled')) DEFAULT 'draft',
    notes TEXT,
    created_by INTEGER,
    completed_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (completed_by) REFERENCES users(id)
);

-- Stok sayım detayları
CREATE TABLE inventory_count_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    count_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    expected_quantity DECIMAL(10,2),
    counted_quantity DECIMAL(10,2),
    unit_id INTEGER NOT NULL,
    difference DECIMAL(10,2),
    notes TEXT,
    FOREIGN KEY (count_id) REFERENCES inventory_counts(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (unit_id) REFERENCES stock_units(id)
);

-- Tedarikçi siparişleri
CREATE TABLE purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    expected_date DATE,
    status TEXT CHECK(status IN ('draft','ordered','partial','received','cancelled')) DEFAULT 'draft',
    payment_status TEXT CHECK(payment_status IN ('pending','partial','paid')) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tedarikçi sipariş kalemleri
CREATE TABLE purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    received_quantity DECIMAL(10,2) DEFAULT 0,
    unit_id INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (unit_id) REFERENCES stock_units(id)
);
