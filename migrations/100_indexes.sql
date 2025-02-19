-- Temel tenant indeksleri
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_addresses_tenant ON addresses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_regions_tenant ON delivery_regions(tenant_id);

-- Müşteri indeksleri
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_combined ON customers(tenant_id, customer_type, phone);

-- Adres indeksleri
CREATE INDEX IF NOT EXISTS idx_addresses_customer ON addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_addresses_location ON addresses(city, district);
CREATE INDEX IF NOT EXISTS idx_addresses_coords ON addresses(lat, lng);

-- Sipariş indeksleri
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_dates ON orders(delivery_date, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_tenant ON orders(tenant_id, status, delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_status, payment_method);

-- Sipariş kalemleri indeksi
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Ürün indeksleri
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(tenant_id, current_stock, min_stock);

-- Region indeksi
CREATE INDEX IF NOT EXISTS idx_delivery_regions_parent ON delivery_regions(parent_id);
