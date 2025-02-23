-- 1. CORE SYSTEM DATA
--------------------------------------------------------------------------------
-- Tenant
INSERT INTO tenants (id, name, company_name, contact_email) VALUES 
(1, 'Kardelen Çiçekçilik', 'Kardelen Çiçekçilik Ltd. Şti.', 'info@kardelen.com'),
(2, 'Demo Hesap', 'Demo Şirketi', 'demo@example.com');

-- Users
INSERT INTO users (tenant_id, email, password_hash, name, role) VALUES
(1, 'admin@kardelen.com', 'hash...', 'Admin User', 'admin'),
(1, 'kasiyer@kardelen.com', 'hash...', 'Kasiyer', 'staff'),
(1, 'kurye@kardelen.com', 'hash...', 'Kurye', 'staff');

-- Settings
INSERT INTO tenant_settings (tenant_id, require_stock, track_recipes) VALUES
(1, 1, 1), -- Stok ve reçete takibi aktif
(2, 0, 0); -- Demo hesap basit ayarlar

-- 2. STOCK MANAGEMENT
--------------------------------------------------------------------------------
-- Units
INSERT INTO units (tenant_id, name, code) VALUES
(1, 'Adet', 'PCS'),
(1, 'Dal', 'STEM'),
(1, 'Demet', 'BUNCH'),
(1, 'Gram', 'GR'),
(1, 'Metre', 'M');

-- Raw Material Categories
INSERT INTO raw_material_categories (tenant_id, name, display_order) VALUES
(1, 'Kesme Çiçek', 10),
(1, 'Yeşillik', 20),
(1, 'Ambalaj', 30),
(1, 'Aksesuar', 40);

-- Raw Materials (Örnek çeşitlilik ile)
INSERT INTO raw_materials (tenant_id, name, unit_id, category_id, status) VALUES
-- Kesme Çiçekler
(1, 'Kırmızı Gül', 2, 1, 'active'),  -- Dal
(1, 'Beyaz Gül', 2, 1, 'active'),
(1, 'Pembe Gül', 2, 1, 'active'),
(1, 'Mor Lisyantus', 2, 1, 'active'),
(1, 'Beyaz Lilyum', 2, 1, 'active'),
(1, 'Pembe Şakayık', 2, 1, 'active'),

-- Yeşillikler
(1, 'Okaliptus', 2, 2, 'active'),
(1, 'İtalyan Yeşili', 2, 2, 'active'),
(1, 'Pitos', 2, 2, 'active'),
(1, 'Leather Leaf', 3, 2, 'active'), -- Demet

-- Ambalaj
(1, 'Kraft Kağıt', 5, 3, 'active'),  -- Metre
(1, 'Şeffaf Naylon', 5, 3, 'active'),
(1, 'Tül', 5, 3, 'active'),
(1, 'Karton Kutu Küçük', 1, 3, 'active'),
(1, 'Karton Kutu Orta', 1, 3, 'active'),
(1, 'Karton Kutu Büyük', 1, 3, 'active'),

-- Aksesuarlar
(1, 'Kurdele 2cm Kırmızı', 5, 4, 'active'),
(1, 'Kurdele 2cm Beyaz', 5, 4, 'active'),
(1, 'Not Kartı', 1, 4, 'active'),
(1, 'Çiçek Besini', 4, 4, 'active'); -- Gram

-- Raw Materials & Prices (Gerçekçi fiyatlarla)
INSERT INTO raw_materials (tenant_id, name, unit_id, category_id, status) VALUES
-- Kesme Çiçekler (Premium)
(1, 'Premium Kırmızı Gül', 2, 1, 'active'),     -- Dal
(1, 'Premium Beyaz Gül', 2, 1, 'active'),
(1, 'Premium Pembe Gül', 2, 1, 'active'),
(1, 'Mor Lisyantus', 2, 1, 'active'),
(1, 'Casa Blanca Lilyum', 2, 1, 'active'),
(1, 'Pembe Şakayık', 2, 1, 'active'),
(1, 'Ortanca', 2, 1, 'active'),
(1, 'Premium Lale', 2, 1, 'active'),

-- Yeşillikler (Standart)
(1, 'Okaliptus', 2, 2, 'active'),
(1, 'İtalyan Yeşili', 2, 2, 'active'),
(1, 'Pitos', 2, 2, 'active'),
(1, 'Leather Leaf', 3, 2, 'active'),
(1, 'Soft Yeşillik', 2, 2, 'active'),

-- Vazolar ve Kutular (Premium)
(1, 'Kristal Vazo Büyük', 1, 3, 'active'),
(1, 'Kristal Vazo Orta', 1, 3, 'active'),
(1, 'Premium Siyah Kutu Büyük', 1, 3, 'active'),
(1, 'Premium Siyah Kutu Orta', 1, 3, 'active'),
(1, 'Silindir Kutu Premium', 1, 3, 'active'),
(1, 'Kalp Kutu Premium', 1, 3, 'active');

-- Fiyat Geçmişi (Gerçekçi fiyatlarla)
INSERT INTO material_price_history (tenant_id, material_id, supplier_id, unit_price, valid_from) VALUES
-- Çiçek Fiyatları
(1, 1, 1, 65.00, DATE('now')),    -- Premium Kırmızı Gül
(1, 2, 1, 60.00, DATE('now')),    -- Premium Beyaz Gül
(1, 3, 1, 60.00, DATE('now')),    -- Premium Pembe Gül
(1, 4, 1, 75.00, DATE('now')),    -- Mor Lisyantus
(1, 5, 1, 120.00, DATE('now')),   -- Casa Blanca Lilyum
(1, 6, 1, 95.00, DATE('now')),    -- Pembe Şakayık
(1, 7, 1, 85.00, DATE('now')),    -- Ortanca
(1, 8, 1, 55.00, DATE('now')),    -- Premium Lale

-- Yeşillik Fiyatları
(1, 9, 2, 45.00, DATE('now')),    -- Okaliptus
(1, 10, 2, 35.00, DATE('now')),   -- İtalyan Yeşili
(1, 11, 2, 40.00, DATE('now')),   -- Pitos
(1, 12, 2, 50.00, DATE('now')),   -- Leather Leaf
(1, 13, 2, 45.00, DATE('now')),   -- Soft Yeşillik

-- Vazo ve Kutu Fiyatları
(1, 14, 3, 450.00, DATE('now')),  -- Kristal Vazo Büyük
(1, 15, 3, 350.00, DATE('now')),  -- Kristal Vazo Orta
(1, 16, 3, 250.00, DATE('now')),  -- Premium Siyah Kutu Büyük
(1, 17, 3, 200.00, DATE('now')),  -- Premium Siyah Kutu Orta
(1, 18, 3, 225.00, DATE('now')),  -- Silindir Kutu Premium
(1, 19, 3, 275.00, DATE('now'));  -- Kalp Kutu Premium

-- 3. SUPPLIERS & PURCHASING
--------------------------------------------------------------------------------
-- Suppliers
INSERT INTO suppliers (tenant_id, name, contact_name, phone) VALUES
(1, 'Flora Çiçekçilik', 'Ahmet Bey', '5551112233'),
(1, 'Yeşil Bahçe Ltd.', 'Mehmet Bey', '5552223344'),
(1, 'Anadolu Çiçek', 'Ayşe Hanım', '5553334455');

-- Sample Purchase Orders
INSERT INTO purchase_orders (tenant_id, supplier_id, order_date, created_by) VALUES
(1, 1, date('now'), 1),
(1, 2, date('now', '-1 day'), 1),
(1, 3, date('now', '-2 days'), 1);

-- Purchase Items (with realistic quantities and prices)
INSERT INTO purchase_order_items (order_id, material_id, quantity, unit_price) VALUES
(1, 1, 100, 3.50),  -- 100 dal kırmızı gül
(1, 2, 50, 3.00),   -- 50 dal beyaz gül
(1, 8, 20, 5.00),   -- 20 dal italyan yeşili
(2, 14, 50, 2.50),  -- 50 adet küçük kutu
(2, 15, 30, 3.50),  -- 30 adet orta kutu
(3, 11, 100, 1.20); -- 100 metre kraft kağıt

-- 4. PRODUCT CATALOG
--------------------------------------------------------------------------------
-- Product Categories
INSERT INTO product_categories (tenant_id, name) VALUES
(1, 'Buketler'),
(1, 'Aranjmanlar'),
(1, 'Kutuda Çiçekler'),
(1, 'Teraryum'),
(1, 'Bitki');

-- Products (with realistic prices)
INSERT INTO products (tenant_id, category_id, name, base_price, status) VALUES
(1, 1, 'Kırmızı Gül Buketi (11 Adet)', 249.90, 'active'),
(1, 1, 'Kırmızı Gül Buketi (21 Adet)', 399.90, 'active'),
(1, 2, 'Pembe Beyaz Aranjman', 299.90, 'active'),
(1, 3, 'Kutuda Güller', 349.90, 'active');

-- Product Materials (recipes with realistic quantities)
INSERT INTO product_materials (product_id, material_id, default_quantity, is_required) VALUES
-- 11'li gül buketi
(1, 1, 11, 1),    -- 11 dal kırmızı gül
(1, 8, 3, 1),     -- 3 dal italyan yeşili
(1, 11, 0.5, 1),  -- 0.5 metre kraft
(1, 17, 1, 1),    -- 1 metre kırmızı kurdele

-- 21'li gül buketi
(2, 1, 21, 1),    -- 21 dal kırmızı gül
(2, 8, 5, 1),     -- 5 dal italyan yeşili
(2, 11, 0.7, 1),  -- 0.7 metre kraft
(2, 17, 1.5, 1);  -- 1.5 metre kırmızı kurdele

-- 5. CUSTOMER DATA
--------------------------------------------------------------------------------
-- Customers
INSERT INTO customers (tenant_id, name, phone, email) VALUES
(1, 'Mehmet Yılmaz', '5551234567', 'mehmet@email.com'),
(1, 'Ayşe Demir', '5567891234', 'ayse@email.com'),
(1, 'Can Güneş', '5551112233', 'can@email.com'),
(1, 'Zeynep Kaya', '5552223344', 'zeynep@email.com'),
(1, 'Ali Yıldız', '5553334455', 'ali@email.com'),
(1, 'Fatma Şahin', '5554445566', 'fatma@email.com'),
(1, 'Ahmet Çelik', '5555556677', 'ahmet@email.com'),
(1, 'Deniz Arslan', '5556667788', 'deniz@email.com');

-- Recipients
INSERT INTO recipients (tenant_id, customer_id, name, phone, relationship) VALUES
(1, 1, 'Fatma Yılmaz', '5559876543', 'Eşi'),
(1, 1, 'Zehra Yılmaz', '5559876544', 'Annesi'),
(1, 2, 'Ali Demir', '5545678912', 'Babası'),
(1, 2, 'Aylin Demir', '5545678913', 'Kardeşi'),
(1, 3, 'Sevgi Güneş', '5551112234', 'Annesi'),
(1, 4, 'Murat Kaya', '5552223345', 'Eşi'),
(1, 5, 'Sema Yıldız', '5553334456', 'Kız Arkadaşı'),
(1, 6, 'Kemal Şahin', '5554445567', 'Oğlu'),
(1, 7, 'Nazlı Çelik', '5555556678', 'Eşi'),
(1, 8, 'Canan Arslan', '5556667789', 'Annesi');

-- Addresses
INSERT INTO addresses (tenant_id, customer_id, recipient_id, district, label) VALUES
(1, 1, 1, 'Kadıköy', 'Caferağa Mah. Moda Cad. No:123 D:4'),
(1, 1, 2, 'Üsküdar', 'Acıbadem Mah. Tekin Sok. No:45'),
(1, 2, 3, 'Beşiktaş', 'Sinanpaşa Mah. Beşiktaş Cad. No:45 D:8'),
(1, 2, 4, 'Beşiktaş', 'Levent Mah. Çarşı Cad. No:12'),
(1, 3, 5, 'Kadıköy', 'Fenerbahçe Mah. Bağdat Cad. No:210'),
(1, 4, 6, 'Şişli', 'Teşvikiye Mah. Nişantaşı Sok. No:15'),
(1, 5, 7, 'Bakırköy', 'Cevizlik Mah. İstasyon Cad. No:34'),
(1, 6, 8, 'Maltepe', 'Bağlarbaşı Mah. Yalı Cad. No:67'),
(1, 7, 9, 'Ataşehir', 'Atatürk Mah. Meriç Cad. No:89'),
(1, 8, 10, 'Beyoğlu', 'Cihangir Mah. Sıraselviler Cad. No:12');

-- 6. MESSAGES & REGIONS
--------------------------------------------------------------------------------
-- Card Messages
INSERT INTO card_messages (tenant_id, category, title, content) VALUES
(1, 'birthday', 'Doğum Günü', 'Nice mutlu yıllara...'),
(1, 'anniversary', 'Yıldönümü', 'Nice mutlu senelere...'),
(1, 'get_well', 'Geçmiş Olsun', 'Acil şifalar dileriz...');

-- Delivery Regions
INSERT INTO delivery_regions (tenant_id, name, base_fee, min_order) VALUES
(1, 'Kadıköy', 0.00, 100.00),
(1, 'Üsküdar', 30.00, 150.00),
(1, 'Beşiktaş', 40.00, 200.00);

-- 7. FINANCIAL SETUP
--------------------------------------------------------------------------------
-- Accounts
INSERT INTO accounts (tenant_id, name, type, initial_balance) VALUES
(1, 'Ana Kasa', 'cash', 1000.00),
(1, 'Banka Hesabı', 'bank', 5000.00),
(1, 'POS', 'pos', 0.00);

-- Transaction Categories
INSERT INTO transaction_categories (tenant_id, name, type) VALUES
(1, 'Satış Geliri', 'in'),
(1, 'Tedarikçi Ödemesi', 'out'),
(1, 'Personel Maaş', 'out'),
(1, 'Kira Gideri', 'out');
