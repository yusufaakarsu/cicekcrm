PRAGMA foreign_keys=ON;

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS delivery_regions;
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS raw_material_categories;
DROP TABLE IF EXISTS raw_materials;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS purchase_order_items;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS product_categories;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS product_materials;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS recipients;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS card_messages;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS order_items_materials;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS transaction_categories;
DROP TABLE IF EXISTS transactions;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    phone_number TEXT,
    name TEXT NOT NULL,
    deleted_at DATETIME
);

CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id INTEGER,
    old_data TEXT,
    new_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE delivery_regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    base_fee DECIMAL(10,2),
    deleted_at DATETIME
);

CREATE TABLE units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE TABLE raw_material_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER,
    status TEXT CHECK(status IN ('active','passive')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE TABLE raw_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    unit_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('active','passive')) DEFAULT 'active',
    notes TEXT,
    deleted_at DATETIME,
    category_id INTEGER,
    FOREIGN KEY (unit_id) REFERENCES units(id),
    FOREIGN KEY (category_id) REFERENCES raw_material_categories(id)
);

CREATE TABLE suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    notes TEXT,
    status TEXT CHECK(status IN ('active','passive','blacklist')) DEFAULT 'active',
    deleted_at DATETIME
);

CREATE TABLE purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    notes TEXT,
    payment_status TEXT CHECK(payment_status IN ('pending', 'partial', 'paid', 'cancelled')) DEFAULT 'pending',
    total_amount DECIMAL(10,2) DEFAULT 0 CHECK(total_amount >= 0),
    paid_amount DECIMAL(10,2) DEFAULT 0 CHECK(paid_amount >= 0),
    created_by INTEGER NOT NULL,
    deleted_at DATETIME,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    deleted_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (material_id) REFERENCES raw_materials(id)
);

CREATE TABLE stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL,
    movement_type TEXT CHECK(movement_type IN ('in','out')),
    quantity DECIMAL(10,2) NOT NULL,
    source_type TEXT CHECK(source_type IN ('purchase','sale','waste','adjustment')),
    source_id INTEGER,
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (material_id) REFERENCES raw_materials(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE product_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('active','passive','archived')) DEFAULT 'active',
    deleted_at DATETIME
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    status TEXT CHECK(status IN ('active','passive','archived')) DEFAULT 'active',
    image_url TEXT,
    deleted_at DATETIME,
    FOREIGN KEY (category_id) REFERENCES product_categories(id)
);

CREATE TABLE product_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    default_quantity DECIMAL(10,2) NOT NULL,
    notes TEXT,
    deleted_at DATETIME,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (material_id) REFERENCES raw_materials(id)
);

CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    notes TEXT,
    deleted_at DATETIME
);

CREATE TABLE recipients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    alternative_phone TEXT,
    notes TEXT,
    special_dates TEXT,
    preferences TEXT,
    deleted_at DATETIME,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    recipient_id INTEGER,
    here_place_id TEXT,
    label TEXT NOT NULL,
    district TEXT NOT NULL,
    neighborhood TEXT,
    street TEXT,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    building_no TEXT,
    floor_no TEXT,
    door_no TEXT,
    directions TEXT,
    deleted_at DATETIME,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (recipient_id) REFERENCES recipients(id)
);

CREATE TABLE card_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    deleted_at DATETIME
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    address_id INTEGER NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_time TEXT CHECK(delivery_time IN ('morning','afternoon','evening')) NOT NULL,
    delivery_region TEXT NOT NULL,
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT CHECK(status IN ('new','confirmed','preparing','ready','delivering','delivered','cancelled')) DEFAULT 'new',
    status_notes TEXT,
    total_amount DECIMAL(10,2) NOT NULL CHECK(total_amount >= 0),
    paid_amount DECIMAL(10,2) DEFAULT 0 CHECK(paid_amount >= 0),
    payment_status TEXT CHECK(payment_status IN ('pending','partial','paid','cancelled')) DEFAULT 'pending',
    card_message_id INTEGER,
    custom_card_message TEXT,
    customer_notes TEXT,
    internal_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    deleted_at DATETIME,
    prepared_by INTEGER,
    preparation_start DATETIME,
    preparation_end DATETIME,
    delivered_at DATETIME,
    delivered_by INTEGER,
    delivery_proof TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (recipient_id) REFERENCES recipients(id),
    FOREIGN KEY (address_id) REFERENCES addresses(id),
    FOREIGN KEY (card_message_id) REFERENCES card_messages(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (prepared_by) REFERENCES users(id),
    FOREIGN KEY (delivered_by) REFERENCES users(id)
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    deleted_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE order_items_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    order_item_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    deleted_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (order_item_id) REFERENCES order_items(id),
    FOREIGN KEY (material_id) REFERENCES raw_materials(id)
);

CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('cash','pos','bank','online')) NOT NULL,
    initial_balance DECIMAL(10,2) DEFAULT 0,
    balance_calculated DECIMAL(10,2) DEFAULT 0,
    balance_verified DECIMAL(10,2) DEFAULT 0,
    last_verified_at DATETIME,
    status TEXT CHECK(status IN ('active','suspended','closed')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE TABLE transaction_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('in','out','both')) NOT NULL,
    reporting_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('in','out')) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK(amount > 0),
    date DATETIME NOT NULL,
    related_type TEXT NOT NULL,
    related_id INTEGER NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('cash','credit_card','bank_transfer','online')) NOT NULL,
    description TEXT,
    notes TEXT,
    status TEXT CHECK(status IN ('pending', 'partial', 'paid', 'cancelled')) DEFAULT 'pending',
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (category_id) REFERENCES transaction_categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_group TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    deleted_at DATETIME
);