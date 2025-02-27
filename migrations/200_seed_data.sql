PRAGMA foreign_keys=ON;

-- 1. Users
INSERT INTO users (email, password_hash, name) VALUES
('yusufaakarsu@gmail.com', 'hash123', 'Yusuf Akarsu'),
('aktasshilall@outlook.com', 'hash456', 'Hilal Akarsu'),
('humeyraktas@gmail.com', 'hash789', 'Hümeyra Aktaş');

-- 2. Temel Birimler
INSERT INTO units (name, code, description) VALUES
('Adet', 'ADET', 'Tek parça ürünler'),
('Dal', 'DAL', 'Tek dal çiçekler'),
('Demet', 'DEMET', '10-12 dallık demetler'),
('Kutu', 'KUTU', 'Ambalaj malzemeleri'),
('Metre', 'METRE', 'Kurdele, şerit vb.'),
('Gram', 'GRAM', 'Toz/granül malzemeler'),
('Paket', 'PAKET', 'Paketli ürünler');

-- 3. Ham Madde Kategorileri
INSERT INTO raw_material_categories (name, description) VALUES
('Kesme Çiçekler', 'Taze kesme çiçekler'),
('İthal Çiçekler', 'İthal kesme çiçekler'),
('Yeşillikler', 'Dekoratif yeşillikler'),
('Saksı Çiçekleri', 'Saksıda yetiştirilen bitkiler'),
('Kutular', 'Çiçek kutuları'),
('Vazolar', 'Cam ve seramik vazolar'),
('Kurdeleler', 'Süsleme kurdeleler');

-- 4. Ürün Kategorileri
INSERT INTO product_categories (name, description) VALUES
('Buketler', 'El buketleri ve demet çiçekler'),
('Kutuda Çiçekler', 'Özel tasarım kutu aranjmanları'),
('Vazoda Çiçekler', 'Cam vazolu aranjmanlar'),
('VIP Tasarımlar', 'Özel tasarım çiçekler');

-- 5. Tedarikçiler
INSERT INTO suppliers (name, contact_name, phone, email, address, notes) VALUES
('Anadolu Çiçekçilik', 'Mehmet Yılmaz', '05321234567', 'info@anadoluflower.com', 
 'Çiçekçiler Hali No:123 İstanbul', 'Toptan kesme çiçek tedarikçisi'),
('Flora Ambalaj', 'Ayşe Demir', '0533987654', 'satis@floraambalaj.com', 
 'Sanayi Sitesi B Blok No:45 İstanbul', 'Ambalaj malzemeleri tedarikçisi');

-- 6. Ham Maddeler (Örnekleri azalttım)
INSERT INTO raw_materials (name, unit_id, category_id, description) VALUES
('Kırmızı Gül', 2, 1, 'Yerli kırmızı gül'), -- unit_id=2 (DAL)
('Beyaz Lilyum', 2, 1, 'Yerli beyaz lilyum'),
('Mor Orkide', 2, 2, 'İthal mor orkide'),
('Okaliptus', 2, 3, 'Yeşil okaliptus dalı'),
('Silindir Kutu Siyah', 1, 5, 'Siyah silindir kutu');

-- 7. Kart Mesajları
INSERT INTO card_messages (category, title, content) VALUES
('birthday', 'Doğum Günü', 'Nice mutlu, sağlıklı yıllara...'),
('anniversary', 'Yıldönümü', 'Nice mutlu yıllara...'),
('get_well', 'Geçmiş Olsun', 'Acil şifalar dileriz...'),
('love', 'Sevgiliye', 'Seni seviyorum...');

-- 8. Hesaplar
INSERT INTO accounts (name, type, initial_balance, status) VALUES 
('Ana Kasa', 'cash', 0, 'active'),
('Kredi Kartı POS', 'pos', 0, 'active'),
('Banka Hesabı', 'bank', 0, 'active');

-- 9. İşlem Kategorileri
INSERT INTO transaction_categories (name, type, reporting_code) VALUES
('Nakit Satış', 'in', 'SALES_CASH'),
('Kredi Kartı Satış', 'in', 'SALES_CARD'),
('Banka Havale', 'in', 'SALES_BANK'),
('Tedarikçi Ödemesi', 'out', 'SUPPLIER'),
('Kira Gideri', 'out', 'RENT'),
('Genel Giderler', 'out', 'GENERAL');

-- 10. Müşteriler ve İlişkili Veriler
INSERT INTO customers (name, phone, email, notes) VALUES
('Fatma Yıldız', '0542123456', 'fatma.yildiz@gmail.com', 'VIP müşteri'),
('Ahmet Kara', '0543234567', 'ahmet.k@outlook.com', 'Kurumsal müşteri'),
('Zeynep Ak', '0544345678', 'zeynep@gmail.com', 'Düzenli müşteri');

-- 11. Alıcılar
INSERT INTO recipients (customer_id, name, phone, notes, special_dates) VALUES
(1, 'Ayşe Yıldız', '0552345678', 'Kapıcıya haber verilmeli', '{"birthday":"05-15"}'),
(2, 'Teknik A.Ş.', '0212876543', 'Resepsiyona teslim', '{"anniversary":"03-20"}'),
(3, 'Mehmet Ak', '0553456789', 'Sürpriz teslimat', '{"birthday":"11-23"}');

-- 12. Teslimat Bölgeleri
INSERT INTO delivery_regions (name, base_fee) VALUES
('Kadıköy', 50.00),
('Üsküdar', 50.00),
('Ataşehir', 60.00),
('Maltepe', 70.00);

-- 13. Adresler
INSERT INTO addresses (
    customer_id, recipient_id, label, district, 
    neighborhood, street, building_no, floor_no, door_no, 
    directions, lat, lng
) VALUES
(1, 1, 'Ev', 'Kadıköy', 'Suadiye', 'Bağdat Caddesi', '123', '4', '8', 
 'Starbucks yanı', 40.962189, 29.071634),
(2, 2, 'Ofis', 'Şişli', 'Levent', 'Büyükdere Caddesi', '456', '12', null, 
 'Plaza B Blok', 41.082707, 29.009706),
(3, 3, 'Ev', 'Üsküdar', 'Acıbadem', 'Şair Arşi Caddesi', '789', '2', '5', 
 'Hastane karşısı', 41.004957, 29.045298);

-- 14. Ürünler
INSERT INTO products (category_id, name, description, base_price, status) VALUES
(1, 'Kırmızı Gül Buketi', '12 adet kırmızı gül buketi', 750, 'active'),
(1, 'Mevsim Buketi', 'Mevsim çiçeklerinden karma buket', 550, 'active'),
(2, 'Siyah Kutuda Güller', 'Silindir kutuda 20 kırmızı gül', 1200, 'active'),
(3, 'Vazoda Lilyum', 'Cam vazoda beyaz lilyumlar', 650, 'active');

-- 15. Ürün Malzemeleri (Reçeteler)
INSERT INTO product_materials (product_id, material_id, default_quantity) VALUES
(1, 1, 12), -- Kırmızı Gül Buketi - 12 dal gül
(1, 4, 3),  -- Kırmızı Gül Buketi - 3 dal okaliptus
(2, 2, 5),  -- Mevsim Buketi - 5 dal lilyum
(2, 4, 2),  -- Mevsim Buketi - 2 dal okaliptus
(3, 1, 20), -- Siyah Kutuda Güller - 20 dal gül
(3, 5, 1),  -- Siyah Kutuda Güller - 1 adet kutu
(4, 2, 7),  -- Vazoda Lilyum - 7 dal lilyum
(4, 4, 3);  -- Vazoda Lilyum - 3 dal okaliptus
