-- Ürün yönetimi tabloları
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
    base_price DECIMAL(10,2) NOT NULL,  -- önerilen satış fiyatı
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

-- Siparişler
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0, -- Tüm kalemlerin toplamı
    status TEXT CHECK(status IN ('new','preparing','ready','delivered','cancelled')) DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Sipariş kalemleri (order_items) - orders ve products arasındaki ilişki
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Sipariş malzemeleri (kesin reçete)
CREATE TABLE order_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL, 
    order_item_id INTEGER NOT NULL,     -- Hangi sipariş kalemine ait
    material_id INTEGER NOT NULL,       -- Hangi ham madde
    quantity DECIMAL(10,2) NOT NULL,    -- Kullanılan miktar
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (order_item_id) REFERENCES order_items(id),
    FOREIGN KEY (material_id) REFERENCES raw_materials(id)
);

-- İndeksler
CREATE INDEX idx_products_category ON products(tenant_id, category_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_status ON products(tenant_id, status, name) WHERE deleted_at IS NULL;

CREATE INDEX idx_product_materials ON product_materials(product_id, material_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_orders_customer ON orders(tenant_id, customer_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_status ON orders(tenant_id, status, created_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_order_items ON order_items(order_id, product_id) WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_order_materials;
CREATE INDEX idx_order_materials ON order_materials(order_id, order_item_id, material_id) 
WHERE deleted_at IS NULL;
