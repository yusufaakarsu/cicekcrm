-- Sipariş reçeteleri 
CREATE TABLE order_recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_item_id INTEGER NOT NULL,
    recipe_id INTEGER,      -- template reçete
    base_cost DECIMAL(10,2), -- işçilik
    total_cost DECIMAL(10,2), -- toplam maliyet
    FOREIGN KEY (order_item_id) REFERENCES order_items(id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

-- Sipariş reçete detayları
CREATE TABLE order_recipe_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    order_recipe_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_recipe_id) REFERENCES order_recipes(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    delivery_address_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('new','preparing','ready','delivering','delivered','cancelled')) DEFAULT 'new',
    delivery_date DATE NOT NULL,
    delivery_time_slot TEXT CHECK(delivery_time_slot IN ('morning','afternoon','evening')),
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    recipient_alternative_phone TEXT,
    recipient_note TEXT,
    card_message TEXT,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('cash','credit_card','bank_transfer')),
    payment_status TEXT CHECK(payment_status IN ('pending','paid','partial','refunded')) DEFAULT 'pending',
    source TEXT CHECK(source IN ('store','web','phone','app')) DEFAULT 'store',
    notes TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivery_region_id INTEGER,     -- Teslimat bölgesi
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (delivery_address_id) REFERENCES addresses(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (delivery_region_id) REFERENCES delivery_regions(id)
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    recipe_id INTEGER,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

