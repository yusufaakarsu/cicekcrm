
-- Temel tenant erişimi için
CREATE INDEX idx_users_tenant ON users(tenant_id, is_active);
CREATE INDEX idx_users_email ON users(tenant_id, email) WHERE deleted_at IS NULL;

-- Müşteri aramaları için
CREATE INDEX idx_customers_search ON customers(tenant_id, phone, name) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_created ON customers(tenant_id, created_at) WHERE deleted_at IS NULL;

-- Sipariş listeleme ve arama
CREATE INDEX idx_orders_status ON orders(tenant_id, status, delivery_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_customer ON orders(tenant_id, customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_delivery ON orders(tenant_id, delivery_date, delivery_time) WHERE status NOT IN ('delivered', 'cancelled');
CREATE INDEX idx_orders_payment ON orders(tenant_id, payment_status, created_at) WHERE deleted_at IS NULL;

-- Stok yönetimi
CREATE INDEX idx_stock_movements_material ON stock_movements(tenant_id, material_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_stock_movements_type ON stock_movements(tenant_id, movement_type, created_at) WHERE deleted_at IS NULL;

-- Ürün yönetimi
CREATE INDEX idx_products_category ON products(tenant_id, category_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_status ON products(tenant_id, status, name) WHERE deleted_at IS NULL;

-- Reçete ve malzeme yönetimi
CREATE INDEX idx_recipes_product ON recipes(tenant_id, product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_recipe_items_material ON recipe_items(recipe_id, material_id) WHERE deleted_at IS NULL;

-- Finans yönetimi
CREATE INDEX idx_transactions_date ON transactions(tenant_id, date, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_account ON transactions(tenant_id, account_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_category ON transactions(tenant_id, category_id, type) WHERE deleted_at IS NULL;

-- Adres yönetimi
CREATE INDEX idx_addresses_district ON addresses(tenant_id, district) WHERE deleted_at IS NULL;
CREATE INDEX idx_addresses_customer ON addresses(tenant_id, customer_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_addresses_here ON addresses(tenant_id, here_place_id) WHERE here_place_id IS NOT NULL;

-- Teslimat bölgeleri
CREATE INDEX idx_delivery_regions_active ON delivery_regions(tenant_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_delivery_regions_parent ON delivery_regions(tenant_id, parent_id) WHERE deleted_at IS NULL;

-- Tedarikçi yönetimi
CREATE INDEX idx_suppliers_status ON suppliers(tenant_id, status, name) WHERE deleted_at IS NULL;
CREATE INDEX idx_suppliers_search ON suppliers(tenant_id, name, phone) WHERE deleted_at IS NULL;

-- Satın alma siparişleri
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(tenant_id, supplier_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_purchase_orders_date ON purchase_orders(tenant_id, order_date, status) WHERE deleted_at IS NULL;

-- Denetim ve loglar
CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id, created_at);
CREATE INDEX idx_audit_log_action ON audit_log(tenant_id, action, table_name, created_at);
