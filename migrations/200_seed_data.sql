-- Core System Data
--------------------------------------------------------------------------------
-- 1. Tenant ve Admin
INSERT INTO tenants (id, name, company_name, contact_email) VALUES 
(1, 'Demo İşletme', 'Demo İşletme Ltd. Şti.', 'demo@example.com');

INSERT INTO users (tenant_id, email, password_hash, name, role) VALUES
(1, 'admin@example.com', 'hash...', 'Admin User', 'admin');

-- 2. Tenant Settings
INSERT INTO tenant_settings (tenant_id, require_stock, track_recipes) VALUES
(1, 1, 1); -- Stok ve reçete takibi aktif

-- 3. Temel Birimler
INSERT INTO units (tenant_id, name, code) VALUES
(1, 'Adet', 'PCS'),
(1, 'Dal', 'STEM'),
(1, 'Demet', 'BUNCH'),
(1, 'Gram', 'GR'),
(1, 'Metre', 'M');

-- 4. Ana Kategoriler
INSERT INTO raw_material_categories (tenant_id, name, display_order) VALUES
(1, 'Kesme Çiçek', 1),
(1, 'Yeşillik', 2),
(1, 'Ambalaj', 3),
(1, 'Aksesuar', 4);

INSERT INTO product_categories (tenant_id, name) VALUES
(1, 'Buketler'),
(1, 'Aranjmanlar'),
(1, 'Kutuda Çiçekler');

-- 5. Finansal Yapı
-- Ana Hesaplar
INSERT INTO accounts (tenant_id, name, type, initial_balance) VALUES
(1, 'Ana Kasa', 'cash', 0),
(1, 'POS Hesabı', 'pos', 0),
(1, 'Banka Hesabı', 'bank', 0);

-- Temel İşlem Kategorileri
INSERT INTO transaction_categories (tenant_id, name, type, reporting_code) VALUES
(1, 'Satış Geliri', 'in', 'SALES'),
(1, 'Tedarikçi Ödemesi', 'out', 'SUPPLIER'),
(1, 'Kira Gideri', 'out', 'RENT'),
(1, 'Diğer Gelirler', 'in', 'OTHER_IN'),
(1, 'Diğer Giderler', 'out', 'OTHER_OUT');

-- 6. Temel Mesaj Şablonları
INSERT INTO card_messages (tenant_id, category, title, content, display_order) VALUES
(1, 'birthday', 'Doğum Günü', 'Nice mutlu yıllara...', 1),
(1, 'anniversary', 'Yıldönümü', 'Nice mutlu senelere...', 2),
(1, 'get_well', 'Geçmiş Olsun', 'Acil şifalar dileriz...', 3);
