-- 1. CORE DATA
-- Tenants
INSERT INTO tenants (id, name, company_name, contact_email, logo_url) VALUES
(1, 'Çiçek Sepeti', 'Çiçek Sepeti Çiçekçilik Ltd. Şti.', 'info@ciceksepeti.com', 'https://assets.ciceksepeti.com/logo.png');

-- Users
INSERT INTO users (tenant_id, email, password_hash, name, role) VALUES
(1, 'admin@ciceksepeti.com', '$2a$12$yC2yDx4FT.kY1sZ6wDbKzep.NAzXf8ayxdX0j7dMqjX', 'Admin User', 'admin'),
(1, 'staff1@ciceksepeti.com', '$2a$12$yC2yDx4FT.kY1sZ6wDbKzep.NAzXf8ayxdX0j7dMqjX', 'Ayşe Yılmaz', 'staff'),
(1, 'staff2@ciceksepeti.com', '$2a$12$yC2yDx4FT.kY1sZ6wDbKzep.NAzXf8ayxdX0j7dMqjX', 'Mehmet Demir', 'staff');

-- Settings
INSERT INTO tenant_settings (tenant_id, require_stock, track_recipes, allow_negative_stock) VALUES
(1, 1, 1, 0);

-- 2. MASTER DATA
-- Units
INSERT INTO units (tenant_id, name, code, description) VALUES
(1, 'Adet', 'PCS', 'Tek parça ürünler için'),
(1, 'Dal', 'STM', 'Tek dal çiçekler için'),
(1, 'Demet', 'BUN', 'Demet halinde çiçekler'),
(1, 'Gram', 'GR', 'Ağırlık birimi'),
(1, 'Kilogram', 'KG', 'Ağırlık birimi'),
(1, 'Metre', 'M', 'Uzunluk birimi'),
(1, 'Santimetre', 'CM', 'Uzunluk birimi'),
(1, 'Paket', 'PKT', 'Paketli ürünler');

-- Delivery Regions
INSERT INTO delivery_regions (tenant_id, name, base_fee, min_order, delivery_notes) VALUES
(1, 'Avrupa Yakası', 50.00, 150.00, 'Standart teslimat süresi 2-4 saat'),
(1, 'Anadolu Yakası', 50.00, 150.00, 'Standart teslimat süresi 2-4 saat');

INSERT INTO delivery_regions (tenant_id, name, parent_id, base_fee, min_order) VALUES
(1, 'Beşiktaş', 1, 40.00, 100.00),
(1, 'Şişli', 1, 40.00, 100.00),
(1, 'Kadıköy', 2, 40.00, 100.00),
(1, 'Üsküdar', 2, 40.00, 100.00);

-- 3. PRODUCT STRUCTURE
-- Product Categories
INSERT INTO product_categories (tenant_id, name, description) VALUES
(1, 'Buketler', 'Özel hazırlanmış çiçek buketleri'),
(1, 'Aranjmanlar', 'Vazolu çiçek aranjmanları'),
(1, 'Saksı Çiçekleri', 'İç mekan bitkileri ve saksı çiçekleri'),
(1, 'Teraryumlar', 'Mini bahçe tasarımları'),
(1, 'Kutuda Çiçekler', 'Özel tasarım kutularda çiçekler');

-- Raw Materials Categories
INSERT INTO raw_material_categories (tenant_id, name, description, display_order) VALUES
(1, 'Çiçekler', 'Kesme çiçekler', 1),
(1, 'Yeşillikler', 'Dolgu ve dekor yeşillikleri', 2),
(1, 'Saksılar', 'Saksı ve vazolar', 3),
(1, 'Ambalaj', 'Ambalaj malzemeleri', 4);

-- Raw Materials
INSERT INTO raw_materials (tenant_id, name, unit_id, category_id, description, status) VALUES
-- Çiçekler
(1, 'Kırmızı Gül', 2, 1, 'Premium kalite kırmızı gül', 'active'),
(1, 'Beyaz Gül', 2, 1, 'Premium kalite beyaz gül', 'active'),
(1, 'Beyaz Lilyum', 2, 1, 'İthal lilyum', 'active'),
-- Yeşillikler
(1, 'Cipso', 3, 2, 'Buket yeşilliği', 'active'),
(1, 'İtalyan Sası', 3, 2, 'Buket yeşilliği', 'active'),
-- Saksılar
(1, 'Seramik Saksı (Orta)', 1, 3, '16cm çapında dekoratif saksı', 'active'),
-- Ambalaj
(1, 'Kraft Kağıt (Büyük)', 1, 4, 'Buket ambalajı için kraft kağıt', 'active');

-- 4. BUSINESS PARTNERS
-- Suppliers
INSERT INTO suppliers (tenant_id, name, contact_name, phone, email, tax_number, address) VALUES
(1, 'Flora Çiçekçilik', 'Ahmet Yılmaz', '05551234567', 'flora@gmail.com', '1234567890', 'Tahtakale Mah. Çiçek Sk. No:1 Fatih/İstanbul'),
(1, 'Yeşil Bahçe Ltd.', 'Mehmet Kaya', '05552345678', 'yesil@gmail.com', '2345678901', 'Çiçekçiler Hali No:15 Bakırköy/İstanbul'),
(1, 'Anadolu Çiçek Market', 'Ayşe Demir', '05553456789', 'anadolu@gmail.com', '3456789012', 'Çiçek Pazarı No:5 Kadıköy/İstanbul');

-- 5. PRODUCTS & RECIPES
-- Products
INSERT INTO products (tenant_id, category_id, name, description, base_price, status) VALUES
(1, 1, 'Kırmızı Gül Buketi (12 Dal)', '12 adet kırmızı gül ile hazırlanmış buket', 399.90, 'active'),
(1, 2, 'Cam Vazoda Renkli Güller', 'Renkli güllerle hazırlanmış vazo aranjmanı', 449.90, 'active');

-- Recipes
INSERT INTO recipes (tenant_id, product_id, name, labor_cost, preparation_time) VALUES
(1, 1, 'Kırmızı Gül Buketi (12 Dal) - Standart', 50.00, 15);

-- Recipe Items
INSERT INTO recipe_items (recipe_id, material_id, quantity, unit_id) VALUES
(1, 1, 12, 2),    -- 12 dal kırmızı gül
(1, 4, 1, 3),     -- 1 demet cipso
(1, 7, 1, 1);     -- 1 adet kraft kağıt

-- 6. FINANCE SETUP
-- Transaction Categories
INSERT INTO transaction_categories (tenant_id, name, type, reporting_code) VALUES
(1, 'Satış Geliri', 'in', 'SALE'),
(1, 'Malzeme Alımı', 'out', 'PURCHASE'),
(1, 'Personel Maaşı', 'out', 'SALARY'),
(1, 'Kira Gideri', 'out', 'RENT'),
(1, 'Diğer Gelirler', 'in', 'OTHER_IN'),
(1, 'Diğer Giderler', 'out', 'OTHER_OUT');

-- Accounts
INSERT INTO accounts (tenant_id, name, type, initial_balance, status) VALUES
(1, 'Ana Kasa', 'cash', 5000.00, 'active'),
(1, 'Banka Hesabı', 'bank', 10000.00, 'active'),
(1, 'POS 1', 'pos', 0.00, 'active'),
(1, 'Online Ödeme', 'online', 0.00, 'active');

-- 7. CONTENT
-- Card Messages
INSERT INTO card_messages (tenant_id, category, title, content, display_order) VALUES
(1, 'birthday', 'Doğum Günü Mesajı 1', 'Nice mutlu yıllara!', 1),
(1, 'anniversary', 'Yıldönümü Mesajı', 'Nice mutlu senelere.', 1),
(1, 'birthday', 'Doğum Günü Mesajı 2', 'En güzel günler sizin olsun. İyi ki doğdunuz!', 2),
(1, 'get_well', 'Geçmiş Olsun', 'Acil şifalar dileriz. Geçmiş olsun.', 1);

-- 8. TEST DATA
-- Test Customers
INSERT INTO customers (tenant_id, name, phone, email) VALUES
(1, 'Ahmet Yılmaz', '5551234567', 'ahmet@email.com'),
(1, 'Ayşe Kara', '5552345678', 'ayse@email.com');

-- Test Recipients
INSERT INTO recipients (tenant_id, customer_id, name, phone, relationship) VALUES
(1, 1, 'Fatma Yılmaz', '5554567890', 'Eş'),
(1, 2, 'Ali Kara', '5556789012', 'Eş');

-- Test Addresses
INSERT INTO addresses (tenant_id, customer_id, recipient_id, district, label) VALUES
(1, 1, 1, 'Kadıköy', 'Ev Adresi'),
(1, 2, 2, 'Beşiktaş', 'İş Adresi');
