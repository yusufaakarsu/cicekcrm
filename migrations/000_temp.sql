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
    unit_price DECIMAL(10,2) NOT NULL,  -- Birim fiyat
    total_amount DECIMAL(10,2) NOT NULL,-- Toplam tutar
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (order_item_id) REFERENCES order_items(id),
    FOREIGN KEY (material_id) REFERENCES raw_materials(id)
);
