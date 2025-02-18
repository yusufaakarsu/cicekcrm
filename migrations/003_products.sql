-- Ürün ve reçete tabloları
CREATE TABLE product_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,     
    code TEXT NOT NULL,     -- single (tek), bouquet (buket), supply (sarf), raw (hammadde)
    description TEXT,
    allows_recipe BOOLEAN DEFAULT 0,  -- reçete tanımlanabilir mi?
    is_stock_tracked BOOLEAN DEFAULT 1, -- stok takibi yapılacak mı?
    default_unit_id INTEGER,  -- varsayılan birim
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (default_unit_id) REFERENCES stock_units(id)
);

CREATE TABLE product_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    parent_id INTEGER,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (parent_id) REFERENCES product_categories(id)
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    type_id INTEGER NOT NULL,
    category_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    barcode TEXT,
    is_recipe BOOLEAN DEFAULT 0,
    base_cost DECIMAL(10,2) DEFAULT 0,
    purchase_price DECIMAL(10,2),
    retail_price DECIMAL(10,2) NOT NULL,
    min_stock INTEGER DEFAULT 0,
    current_stock DECIMAL(10,2) DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_purchasable BOOLEAN DEFAULT 1,    -- satın alınabilir mi?
    default_supplier_id INTEGER,         -- tercih edilen tedarikçi
    stock_unit_id INTEGER,              -- stok birimi
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (type_id) REFERENCES product_types(id),
    FOREIGN KEY (category_id) REFERENCES product_categories(id),
    FOREIGN KEY (stock_unit_id) REFERENCES stock_units(id),
    FOREIGN KEY (default_supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,         -- hangi ürünün reçetesi
    name TEXT NOT NULL,
    is_template BOOLEAN DEFAULT 0,       -- şablon mu?
    base_cost DECIMAL(10,2) DEFAULT 0,   -- işçilik/hazırlama maliyeti
    preparation_time INTEGER,            -- hazırlama süresi (dakika)
    difficulty_level TEXT CHECK(difficulty_level IN ('easy','medium','hard')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE recipe_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    component_id INTEGER NOT NULL,        -- kullanılan ürün/malzeme
    quantity DECIMAL(10,2) NOT NULL,
    unit_id INTEGER NOT NULL,            -- miktar birimi
    is_optional BOOLEAN DEFAULT 0,        -- opsiyonel mi?
    is_replaceable BOOLEAN DEFAULT 0,     -- değiştirilebilir mi?
    alternative_ids TEXT,                 -- alternatif ürün ID'leri (JSON)
    min_quantity DECIMAL(10,2),          -- minimum miktar
    max_quantity DECIMAL(10,2),          -- maksimum miktar
    notes TEXT,
    sequence INTEGER DEFAULT 0,           -- sıralama
    FOREIGN KEY (recipe_id) REFERENCES recipes(id),
    FOREIGN KEY (component_id) REFERENCES products(id),
    FOREIGN KEY (unit_id) REFERENCES stock_units(id)
);

-- Reçete maliyetleri tablosu ekleniyor
CREATE TABLE recipe_costs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    calculation_date DATETIME NOT NULL,
    material_cost DECIMAL(10,2) NOT NULL,
    labor_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

-- Reçete kategorileri tablosu ekleniyor
CREATE TABLE recipe_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    parent_id INTEGER,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (parent_id) REFERENCES recipe_categories(id)
);
