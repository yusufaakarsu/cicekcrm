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

-- Stok birimleri
INSERT INTO stock_units (tenant_id, name, symbol) VALUES
(1, 'Adet', 'PCS'),
(1, 'Demet', 'BUN'),
(1, 'Dal', 'STM'),
(1, 'Metre', 'MTR'),
(1, 'Gram', 'GRM');

-- Tedarikçiler
INSERT INTO suppliers (tenant_id, name, contact_name, phone, email, notes) VALUES
(1, 'Çiçek Toptancısı', 'Mehmet Bey', '5551112233', 'info@cicektoptancisi.com', 'Güller ve mevsim çiçekleri'),
(1, 'Papatya Çiçekçilik', 'Ayşe Hanım', '5552223344', 'info@papatyacicek.com', 'Mevsim çiçekleri'),
(1, 'Orkide Bahçesi', 'Ali Bey', '5553334455', 'info@orkidebahcesi.com', 'Orkide ve egzotik çiçekler'),
(1, 'Yeşil Dünya', 'Zeynep Hanım', '5554445566', 'info@yesildunya.com', 'Saksı bitkileri'),
(1, 'Flora Malzeme', 'Ahmet Bey', '5555556677', 'info@floramalzeme.com', 'Yeşillikler'),
(1, 'Süs Dünyası', 'Fatma Hanım', '5556667788', 'info@susdunyasi.com', 'Kurdeleler ve süs malzemeleri'),
(1, 'Cam Vazo', 'Hasan Bey', '5557778899', 'info@camvazo.com', 'Vazo ve saksılar');
