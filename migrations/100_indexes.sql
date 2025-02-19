-- Performans indeksleri
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX idx_recipes_product ON recipes(product_id);
CREATE INDEX idx_recipe_items_recipe ON recipe_items(recipe_id);

-- Müşteri indeksleri
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_type ON customers(customer_type);

-- Müşteri arama performansı için
CREATE INDEX idx_customers_phone_tenant ON customers(tenant_id, phone);
CREATE INDEX idx_customers_email_tenant ON customers(tenant_id, email);
CREATE INDEX idx_customers_type_tenant ON customers(tenant_id, customer_type);

-- Adres indeksleri
CREATE INDEX idx_addresses_tenant ON addresses(tenant_id);
CREATE INDEX idx_addresses_customer ON addresses(customer_id);
CREATE INDEX idx_addresses_district ON addresses(district);

-- Adres yönetimi için
CREATE INDEX idx_addresses_coordinates ON addresses(lat, lng);
CREATE INDEX idx_addresses_tenant_customer ON addresses(tenant_id, customer_id);

-- Ürün indeksleri
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_type ON products(type_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(default_supplier_id);

-- Stok indeksleri
CREATE INDEX idx_stock_movements_tenant ON stock_movements(tenant_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);

-- Stok yönetimi için
CREATE INDEX idx_products_stock_tenant ON products(tenant_id, stock, min_stock);
CREATE INDEX idx_products_active_tenant ON products(tenant_id, is_deleted);

-- Sipariş indeksleri
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX idx_orders_payment ON orders(payment_status);

-- Sipariş listeleme/filtreleme için
CREATE INDEX idx_orders_status_tenant ON orders(tenant_id, status);
CREATE INDEX idx_orders_payment_tenant ON orders(tenant_id, payment_status);
CREATE INDEX idx_orders_delivery_tenant ON orders(tenant_id, delivery_date, status);

-- Region indeksi
CREATE INDEX idx_delivery_regions_tenant ON delivery_regions(tenant_id);
CREATE INDEX idx_delivery_regions_parent ON delivery_regions(parent_id);
