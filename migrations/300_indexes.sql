-- Core/System indeksler
CREATE INDEX idx_tenants_status ON tenants(is_active);
CREATE INDEX idx_users_tenant ON users(tenant_id, email);
CREATE INDEX idx_users_auth ON users(email, password_hash) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_active ON users(tenant_id, is_active);

-- Müşteri aramaları için
CREATE INDEX idx_customers_search ON customers(tenant_id, phone, name) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_created ON customers(tenant_id, created_at) WHERE deleted_at IS NULL;

-- Sipariş listeleme ve arama
CREATE INDEX idx_orders_status ON orders(tenant_id, status, delivery_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_customer ON orders(tenant_id, customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_delivery ON orders(tenant_id, delivery_date, delivery_time) WHERE status NOT IN ('delivered', 'cancelled');
CREATE INDEX idx_orders_payment ON orders(tenant_id, payment_status, created_at) WHERE deleted_at IS NULL;

-- Stok yönetimi
CREATE INDEX idx_stock_movements_material ON stock_movements(tenant_id, material_id, movement_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_stock_movements_source ON stock_movements(source_type, source_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_stock_movements_dates ON stock_movements(tenant_id, created_at) WHERE deleted_at IS NULL;

-- Ürün yönetimi
CREATE INDEX idx_products_category ON products(tenant_id, category_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_search ON products(tenant_id, name, status) WHERE deleted_at IS NULL;

-- Ham madde yönetimi
CREATE INDEX idx_materials_search ON raw_materials(tenant_id, name, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_materials_category ON raw_materials(tenant_id, category_id, status) WHERE deleted_at IS NULL;

-- Finans yönetimi
CREATE INDEX idx_transactions_date ON transactions(tenant_id, date, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_account ON transactions(tenant_id, account_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_category ON transactions(tenant_id, category_id, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_related ON transactions(related_type, related_id) WHERE deleted_at IS NULL;

-- Adres yönetimi
CREATE INDEX idx_addresses_district ON addresses(tenant_id, district) WHERE deleted_at IS NULL;
CREATE INDEX idx_addresses_customer ON addresses(tenant_id, customer_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_addresses_here ON addresses(tenant_id, here_place_id) WHERE here_place_id IS NOT NULL;

-- Satın alma işlemleri
CREATE INDEX idx_purchase_orders_status ON purchase_orders(tenant_id, status, order_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(tenant_id, supplier_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_purchase_orders_payment ON purchase_orders(tenant_id, payment_status) WHERE deleted_at IS NULL;

CREATE INDEX idx_purchase_items_order ON purchase_order_items(order_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_purchase_items_material ON purchase_order_items(material_id) WHERE deleted_at IS NULL;

-- Tedarikçi yönetimi
CREATE INDEX idx_suppliers_search ON suppliers(tenant_id, name, phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_suppliers_status ON suppliers(tenant_id, status) WHERE deleted_at IS NULL;

-- Fiyat geçmişi
CREATE INDEX idx_price_history_material ON material_price_history(material_id, valid_from);
CREATE INDEX idx_price_history_current ON material_price_history(material_id, supplier_id) WHERE valid_to IS NULL;

-- Denetim ve loglar
CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id, created_at);
CREATE INDEX idx_audit_log_action ON audit_log(tenant_id, action, table_name);
