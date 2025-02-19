-- Temel tenant verisi
INSERT INTO tenants (id, name, domain, company_name, contact_email, logo_url, primary_color) VALUES 
(1, 'Çiçek Dünyası', 'cicekdunyasi.com', 'Çiçek Dünyası Ltd. Şti.', 'info@cicekdunyasi.com', '/logos/cicek-dunyasi.png', '#2E7D32');

-- Tenant ayarları
INSERT INTO tenant_settings (tenant_id, require_stock, track_recipes, track_costs, allow_negative_stock, auto_update_prices) VALUES
(1, 1, 1, 1, 0, 1);  -- Tam entegre sistem (stok + reçete + maliyet kontrolü)

-- Temel kullanıcılar
INSERT INTO users (tenant_id, email, password_hash, name, role) VALUES
(1, 'admin@cicekdunyasi.com', 'hash...', 'Admin User', 'owner'),
(1, 'satis@cicekdunyasi.com', 'hash...', 'Satış Personeli', 'staff'),
(1, 'tasarim@cicekdunyasi.com', 'hash...', 'Tasarım Personeli', 'staff');

