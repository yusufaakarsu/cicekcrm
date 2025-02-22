-- 1. Tenants
INSERT INTO tenants (id, name, company_name, contact_email, logo_url) VALUES
(1, 'Çiçek Sepeti', 'Çiçek Sepeti Çiçekçilik Ltd. Şti.', 'info@ciceksepeti.com', 'https://assets.ciceksepeti.com/logo.png');

-- 2. Users
INSERT INTO users (tenant_id, email, password_hash, name, role) VALUES
(1, 'admin@ciceksepeti.com', '$2a$12$yC2yDx4FT.kY1sZ6wDbKzep.NAzXf8ayxdX0j7dMqjX', 'Admin User', 'admin'),
(1, 'staff1@ciceksepeti.com', '$2a$12$yC2yDx4FT.kY1sZ6wDbKzep.NAzXf8ayxdX0j7dMqjX', 'Ayşe Yılmaz', 'staff'),
(1, 'staff2@ciceksepeti.com', '$2a$12$yC2yDx4FT.kY1sZ6wDbKzep.NAzXf8ayxdX0j7dMqjX', 'Mehmet Demir', 'staff');

-- 3. Tenant Settings
INSERT INTO tenant_settings (tenant_id, require_stock, track_recipes, allow_negative_stock) VALUES
(1, 1, 1, 0);

-- 4. Delivery Regions (Önce ana bölgeler)
INSERT INTO delivery_regions (tenant_id, name, base_fee, min_order, delivery_notes) VALUES
(1, 'Avrupa Yakası', 50.00, 150.00, 'Standart teslimat süresi 2-4 saat'),
(1, 'Anadolu Yakası', 50.00, 150.00, 'Standart teslimat süresi 2-4 saat');

-- Alt bölgeler
INSERT INTO delivery_regions (tenant_id, name, parent_id, base_fee, min_order) VALUES
(1, 'Beşiktaş', 1, 40.00, 100.00),
(1, 'Şişli', 1, 40.00, 100.00),
(1, 'Kadıköy', 2, 40.00, 100.00),
(1, 'Üsküdar', 2, 40.00, 100.00);

-- 5. Units (Birimler)
INSERT INTO units (tenant_id, name, code, description) VALUES
(1, 'Adet', 'PCS', 'Tek parça ürünler için'),
(1, 'Dal', 'STM', 'Tek dal çiçekler için'),
(1, 'Demet', 'BUN', 'Demet halinde çiçekler'),
(1, 'Gram', 'GR', 'Ağırlık birimi'),
(1, 'Kilogram', 'KG', 'Ağırlık birimi'),
(1, 'Metre', 'M', 'Uzunluk birimi'),
(1, 'Santimetre', 'CM', 'Uzunluk birimi'),
(1, 'Paket', 'PKT', 'Paketli ürünler');

-- 6. Suppliers (Tedarikçiler)
INSERT INTO suppliers (tenant_id, name, contact_name, phone, email, tax_number, address) VALUES
(1, 'Flora Çiçekçilik', 'Ahmet Yılmaz', '05551234567', 'flora@gmail.com', '1234567890', 'Tahtakale Mah. Çiçek Sk. No:1 Fatih/İstanbul'),
(1, 'Yeşil Bahçe Ltd.', 'Mehmet Kaya', '05552345678', 'yesil@gmail.com', '2345678901', 'Çiçekçiler Hali No:15 Bakırköy/İstanbul'),
(1, 'Anadolu Çiçek Market', 'Ayşe Demir', '05553456789', 'anadolu@gmail.com', '3456789012', 'Çiçek Pazarı No:5 Kadıköy/İstanbul');

-- 7. Product Categories (Ürün Kategorileri)
INSERT INTO product_categories (tenant_id, name, description) VALUES
(1, 'Buketler', 'Özel hazırlanmış çiçek buketleri'),
(1, 'Aranjmanlar', 'Vazolu çiçek aranjmanları'),
(1, 'Saksı Çiçekleri', 'İç mekan bitkileri ve saksı çiçekleri'),
(1, 'Teraryumlar', 'Mini bahçe tasarımları'),
(1, 'Kutuda Çiçekler', 'Özel tasarım kutularda çiçekler');

-- 8. Card Messages (Hazır Mesajlar)
INSERT INTO card_messages (tenant_id, category, title, content, display_order) VALUES
(1, 'birthday', 'Doğum Günü Mesajı 1', 'Nice mutlu yıllara! Doğum gününüz kutlu olsun.', 1),
(1, 'birthday', 'Doğum Günü Mesajı 2', 'En güzel günler sizin olsun. İyi ki doğdunuz!', 2),
(1, 'anniversary', 'Yıldönümü Mesajı', 'Nice mutlu senelere. Yıldönümünüz kutlu olsun.', 1),
(1, 'get_well', 'Geçmiş Olsun', 'Acil şifalar dileriz. Geçmiş olsun.', 1);

-- 9. Transaction Categories (İşlem Kategorileri)
INSERT INTO transaction_categories (tenant_id, name, type, reporting_code) VALUES
(1, 'Satış Geliri', 'in', 'SALE'),
(1, 'Malzeme Alımı', 'out', 'PURCHASE'),
(1, 'Personel Maaşı', 'out', 'SALARY'),
(1, 'Kira Gideri', 'out', 'RENT'),
(1, 'Diğer Gelirler', 'in', 'OTHER_IN'),
(1, 'Diğer Giderler', 'out', 'OTHER_OUT');

-- 10. Accounts (Hesaplar)
INSERT INTO accounts (tenant_id, name, type, initial_balance, status) VALUES
(1, 'Ana Kasa', 'cash', 5000.00, 'active'),
(1, 'Banka Hesabı', 'bank', 10000.00, 'active'),
(1, 'POS 1', 'pos', 0.00, 'active'),
(1, 'Online Ödeme', 'online', 0.00, 'active');

-- İkinci kısım (raw_materials, recipes vs.) ayrı bir dosyada devam edecek...
