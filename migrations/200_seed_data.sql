-- Tenant ve kullanıcı
INSERT INTO tenants (id, name, company_name, contact_email) VALUES 
(1, 'Test Mağaza', 'Test Çiçekçilik Ltd.', 'test@example.com');

INSERT INTO users (tenant_id, email, password_hash, name, role) VALUES
(1, 'admin@test.com', 'hash123', 'Admin User', 'admin'),
(1, 'staff@test.com', 'hash123', 'Staff User', 'staff');

-- Ayarlar
INSERT INTO tenant_settings (tenant_id, require_stock, track_recipes) VALUES
(1, true, true);

-- Birimler
INSERT INTO units (tenant_id, name, code, description) VALUES
(1, 'Adet', 'PCS', 'Tek parça ürünler için'),
(1, 'Dal', 'STM', 'Çiçekler için'),
(1, 'Demet', 'BUN', 'Hazır demetler'),
(1, 'Gram', 'GR', 'Ağırlık birimi');

-- Teslimat bölgeleri
INSERT INTO delivery_regions (tenant_id, name, base_fee, min_order) VALUES
(1, 'Kadıköy', 50.00, 200),
(1, 'Üsküdar', 50.00, 200),
(1, 'Beşiktaş', 75.00, 250);

-- Ham maddeler
INSERT INTO raw_materials (tenant_id, name, unit_id, status) VALUES
(1, 'Kırmızı Gül', 2, 'active'),        -- Dal
(1, 'Beyaz Gül', 2, 'active'),          -- Dal
(1, 'Pembe Gül', 2, 'active'),          -- Dal
(1, 'Papatya', 2, 'active'),            -- Dal
(1, 'Lilyum', 2, 'active'),             -- Dal
(1, 'Yeşillik', 2, 'active'),           -- Dal
(1, 'Kurdele', 1, 'active'),            -- Adet
(1, 'Cam Vazo', 1, 'active'),           -- Adet
(1, 'Süsleme Malzemesi', 1, 'active'),  -- Adet
(1, 'Ambalaj', 1, 'active');            -- Adet

-- Ürün kategorileri
INSERT INTO product_categories (tenant_id, name) VALUES
(1, 'Buketler'),
(1, 'Aranjmanlar'),
(1, 'Vazo Çiçekleri'),
(1, 'Kutuda Çiçekler');

-- Örnek ürünler
INSERT INTO products (tenant_id, category_id, name, base_price, status) VALUES
(1, 1, '11 Kırmızı Gül Buketi', 350.00, 'active'),
(1, 1, 'Renkli Mevsim Buketi', 250.00, 'active'),
(1, 2, 'Cam Vazoda Papatya', 300.00, 'active'),
(1, 3, 'Lilyum Aranjmanı', 450.00, 'active');

-- Reçeteler ve malzemeleri
-- Örnek: 11 Kırmızı Gül Buketi reçetesi
INSERT INTO recipes (tenant_id, product_id, name, labor_cost) VALUES
(1, 1, 'Standart 11 Gül Buketi', 50.00);

-- Reçete kalemleri
INSERT INTO recipe_items (recipe_id, material_id, quantity, unit_id) VALUES
(1, 1, 11, 2),    -- 11 dal kırmızı gül
(1, 6, 3, 2),     -- 3 dal yeşillik
(1, 7, 1, 1),     -- 1 adet kurdele
(1, 10, 1, 1);    -- 1 adet ambalaj

-- Hazır kart mesajları
INSERT INTO card_messages (tenant_id, category, title, content) VALUES
(1, 'birthday', 'Doğum Günü - 1', 'Nice mutlu yıllara!'),
(1, 'birthday', 'Doğum Günü - 2', 'İyi ki doğdun!'),
(1, 'love', 'Romantik - 1', 'Seni seviyorum!'),
(1, 'celebration', 'Kutlama', 'Tebrikler!');

-- Finans kategorileri
INSERT INTO transaction_categories (tenant_id, name, type, reporting_code) VALUES
(1, 'Satış Geliri', 'in', 'SALES'),
(1, 'Tedarikçi Ödemesi', 'out', 'SUPPLIER'),
(1, 'İşletme Gideri', 'out', 'OPEX'),
(1, 'Personel Gideri', 'out', 'PAYROLL');

-- Hesaplar
INSERT INTO accounts (tenant_id, name, type, initial_balance) VALUES
(1, 'Ana Kasa', 'cash', 1000.00),
(1, 'Banka Hesabı', 'bank', 5000.00),
(1, 'POS Cihazı', 'pos', 0.00);
