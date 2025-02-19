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
CREATE INDEX IF NOT EXISTS idx_orders_region ON orders(delivery_region_id);
CREATE INDEX IF NOT EXISTS idx_delivery_regions_parent ON delivery_regions(parent_id);

-- Finans İndeksleri
CREATE INDEX IF NOT EXISTS idx_accounts_tenant ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);

CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_transaction_categories_tenant ON transaction_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transaction_categories_parent ON transaction_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_transaction_categories_type ON transaction_categories(type);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_tenant ON supplier_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier ON supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_status ON supplier_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_dates ON supplier_invoices(invoice_date, due_date);

-- Tedarikçi indeksleri
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON suppliers(phone);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

-- Tedarikçi fatura indeksleri
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_tenant ON supplier_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier ON supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_status ON supplier_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_dates ON supplier_invoices(invoice_date, due_date);
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_items_invoice ON supplier_invoice_items(supplier_invoice_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_items_product ON supplier_invoice_items(product_id);

-- Tedarikçi sipariş indeksleri
CREATE INDEX IF NOT EXISTS idx_supplier_orders_tenant ON supplier_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_supplier ON supplier_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_status ON supplier_orders(status);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_dates ON supplier_orders(order_date, expected_date);