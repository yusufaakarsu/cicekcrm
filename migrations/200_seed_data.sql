-- Öncelikle tabloları temizleyelim (test verisi eklemeden önce) - opsiyonel
DELETE FROM transactions;
DELETE FROM order_items_materials;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM product_materials;
DELETE FROM products;
DELETE FROM addresses;
DELETE FROM recipients;
DELETE FROM customers;
DELETE FROM raw_materials;
DELETE FROM suppliers;

-- Default kullanıcı - (diğer kayıtların foreign key ihtiyacı için)
INSERT INTO users (email, password_hash, name) VALUES
('yusufaakarsu@gmail.com', 'hash123', 'Yusuf Akarsu'),
('aktasshilall@outlook.com', 'hash456', 'Hilal Akarsu'),
('humeyraktas@gmail.com', 'hash789', 'Hümeyra Aktaş');

-- Birimler
INSERT INTO units (name, code, description) VALUES
('Adet', 'ADET', 'Tek parça ürünler'),
('Dal', 'DAL', 'Tek dal çiçekler'),
('Demet', 'DEMET', '10-12 dallık demetler'),
('Kutu', 'KUTU', 'Ambalaj malzemeleri'),
('Metre', 'METRE', 'Kurdele, şerit vb.'),
('Gram', 'GRAM', 'Toz/granül malzemeler'),
('Paket', 'PAKET', 'Paketli ürünler');

-- Ham madde kategorileri
INSERT INTO raw_material_categories (name, description) VALUES
('Kesme Çiçekler', 'Taze kesme çiçekler'),
('İthal Çiçekler', 'İthal kesme çiçekler'),
('Yeşillikler', 'Dekoratif yeşillikler'),
('Saksı Çiçekleri', 'Saksıda yetiştirilen bitkiler'),
('Kutular', 'Çiçek kutuları'),
('Vazolar', 'Cam ve seramik vazolar'),
('Ambalajlar', 'Süsleme ve paketleme malzemeleri');

-- Ham maddeler
INSERT INTO raw_materials (name, description, unit_id, status, category_id) VALUES
-- Kesme Çiçekler (category_id: 1)
('Kırmızı Gül', 'Premium kırmızı gül', 2, 'active', 1),    -- unit_id: 2 (Dal)
('Beyaz Gül', 'Premium beyaz gül', 2, 'active', 1),        -- unit_id: 2 (Dal)
('Pembe Gül', 'Premium pembe gül', 2, 'active', 1),        -- unit_id: 2 (Dal)
('Sarı Gül', 'Premium sarı gül', 2, 'active', 1),          -- unit_id: 2 (Dal)
('Mor Gül', 'Premium mor gül', 2, 'active', 1),            -- unit_id: 2 (Dal)
('Lale', 'Renkli lale', 2, 'active', 1),                   -- unit_id: 2 (Dal)
('Orkide', 'Mini orkide', 2, 'active', 1),                 -- unit_id: 2 (Dal)
('Papatya', 'Beyaz papatya', 2, 'active', 1),              -- unit_id: 2 (Dal)
('Lilyum', 'Beyaz lilyum', 2, 'active', 1),                -- unit_id: 2 (Dal)

-- Yeşillikler (category_id: 3)
('Okaliptus', 'Okaliptus dalı', 2, 'active', 3),           -- unit_id: 2 (Dal)
('İtalyan Sası', 'Yeşil saz', 2, 'active', 3),             -- unit_id: 2 (Dal)
('Cipso', 'Beyaz cipso', 2, 'active', 3),                  -- unit_id: 2 (Dal)
('Şimşir', 'Yeşil şimşir', 2, 'active', 3),                -- unit_id: 2 (Dal)
('Pitosporum', 'Yeşil pitosporum', 2, 'active', 3),        -- unit_id: 2 (Dal)

-- Ambalajlar (category_id: 7)
('Kraft Kağıt', 'Kraft ambalaj kağıdı', 5, 'active', 7),   -- unit_id: 5 (Metre)
('Şeffaf Selofan', 'Şeffaf selofan rulosu', 5, 'active', 7), -- unit_id: 5 (Metre)
('Rafya', 'Doğal rafya', 5, 'active', 7),                  -- unit_id: 5 (Metre)
('Kurdele', 'İpek kurdele çeşitli renk', 5, 'active', 7),  -- unit_id: 5 (Metre)
('Su Süngeri', 'Çiçek düzenleme süngeri', 1, 'active', 7),  -- unit_id: 1 (Adet)

-- Kutular (category_id: 5)
('Özel Kutu', 'Logo baskılı gül kutusu', 1, 'active', 5);  -- unit_id: 1 (Adet)

-- Ürün kategorileri
INSERT INTO product_categories (name, description, status) VALUES
('Buketler', 'El buketleri', 'active'),
('Kutuda Çiçekler', 'Özel kutularda tasarımlar', 'active'),
('Aranjmanlar', 'Çeşitli çiçek aranjmanları', 'active'),
('Saksı Çiçekleri', 'Saksıda çiçekler', 'active');

-- Ürünler
INSERT INTO products (name, description, base_price, status, category_id) VALUES
('Kırmızı Gül Buketi', '12 adet kırmızı gül ve yeşillikler', 1200.00, 'active', 1),
('Mevsim Buketi', 'Mevsim çiçeklerinden buket', 950.00, 'active', 1),
('Papatya Buketi', 'Papatyalar ve yeşillikler', 850.00, 'active', 1),
('Kutuda Güller', 'Kutuda kırmızı güller', 1500.00, 'active', 2),
('Kutuda Karışık', 'Özel kutuda mevsim çiçekleri', 1300.00, 'active', 2),
('Cam Vazoda Lilyum', 'Cam vazoda lilyumlar', 1100.00, 'active', 3),
('Soft Aranjman', 'Pastel tonlarda aranjman', 1200.00, 'active', 3),
('Orkide Aranjmanı', 'İki dallı orkide aranjmanı', 2000.00, 'active', 3),
('Mini Sukulent', 'Mini sukulent terrarium', 450.00, 'active', 4),
('Bonsai', 'Dekoratif bonsai bitkisi', 1500.00, 'active', 4);

-- Ürün malzemeleri
-- Kırmızı Gül Buketi malzemeleri
INSERT INTO product_materials (product_id, material_id, default_quantity) VALUES
(1, 1, 12), -- 12 dal kırmızı gül
(1, 10, 3), -- 3 dal okaliptus
(1, 15, 1), -- 1 paket kraft kağıt
(1, 18, 1); -- 1 adet kurdele

-- Mevsim Buketi malzemeleri
INSERT INTO product_materials (product_id, material_id, default_quantity) VALUES
(2, 9, 5),  -- 5 dal lilyum
(2, 8, 7),  -- 7 dal papatya
(2, 10, 2), -- 2 dal okaliptus
(2, 15, 1); -- 1 paket kraft kağıt

-- Papatya Buketi malzemeleri
INSERT INTO product_materials (product_id, material_id, default_quantity) VALUES
(3, 8, 15), -- 15 dal papatya
(3, 12, 5), -- 5 dal cipso
(3, 15, 1); -- 1 paket kraft kağıt

-- Diğer ürünler için benzer malzemeler ekleyin
INSERT INTO product_materials (product_id, material_id, default_quantity) VALUES
(4, 1, 15),  -- Kutuda Güller: 15 dal kırmızı gül
(4, 19, 1),  -- 1 adet özel kutu
(5, 8, 10),  -- Kutuda Karışık: 10 dal papatya
(5, 6, 8),   -- 8 dal lale
(5, 19, 1),  -- 1 adet özel kutu
(6, 9, 7),   -- Cam Vazoda Lilyum: 7 dal lilyum
(7, 4, 5),   -- Soft Aranjman: 5 dal sarı gül
(7, 5, 5),   -- 5 dal mor gül
(7, 12, 3),  -- 3 dal cipso
(8, 7, 2),   -- Orkide Aranjmanı: 2 adet orkide
(9, 20, 1),  -- Mini Sukulent: 1 adet su süngeri
(10, 20, 1); -- Bonsai: 1 adet su süngeri

-- Tedarikçiler
INSERT INTO suppliers (name, contact_name, phone, email, address, status) VALUES
('Çiçek Deposu', 'Ahmet Yılmaz', '5551234567', 'info@cicekdeposu.com', 'Çiçekçiler Hali No: 45', 'active'),
('Flora Toptan', 'Ayşe Demir', '5559876543', 'satis@floratoptan.com', 'Sanayi Sitesi A Blok No: 12', 'active'),
('Yeşil Dünya', 'Mehmet Kaya', '5553456789', 'iletisim@yesildunya.net', 'Organize Sanayi 5. Cadde', 'active'),
('Ambalaj Market', 'Zeynep Şahin', '5552223344', 'satis@ambalajmarket.com', 'Kervan Caddesi No: 78', 'active'),
('Çiçekçi Malzemeleri', 'Ali Öztürk', '5554445566', 'info@cicekci-malzemeleri.com', 'Çiçekçiler Pasajı No: 23', 'active');

-- Müşteriler
INSERT INTO customers (name, phone, email, notes) VALUES
('Fatma Yıldız', '5051234567', 'fatma@example.com', 'VIP müşteri'),
('Ahmet Kara', '5062345678', 'ahmet@example.com', 'Ofis siparişleri verir'),
('Ayşe Beyaz', '5073456789', 'ayse@example.com', 'Doğum günlerinde sipariş verir'),
('Mehmet Yeşil', '5084567890', 'mehmet@example.com', ''),
('Zeynep Mavi', '5095678901', 'zeynep@example.com', 'Özel gün siparişleri'),
('Ali Turuncu', '5106789012', 'ali@example.com', ''),
('Elif Mor', '5117890123', 'elif@example.com', 'Düzenli müşteri'),
('Can Gri', '5128901234', 'can@example.com', 'Kurumsal müşteri'),
('Deniz Sarı', '5139012345', 'deniz@example.com', ''),
('Ece Pembe', '5140123456', 'ece@example.com', 'Haftalık sipariş verir'),
('Burak Kırmızı', '5151234567', 'burak@example.com', 'Yeni müşteri'),
('Selma Siyah', '5162345678', 'selma@example.com', 'Aylık sipariş verir'),
('Kemal Lacivert', '5173456789', 'kemal@example.com', ''),
('Aslı Turkuaz', '5184567890', 'asli@example.com', 'Hediye siparişleri'),
('Okan Bej', '5195678901', 'okan@example.com', 'Kurumsal müşteri'),
('Leyla Kahve', '5206789012', 'leyla@example.com', ''),
('Murat Bordo', '5217890123', 'murat@example.com', 'VIP müşteri'),
('Seda Yeşil', '5228901234', 'seda@example.com', ''),
('Eren Gri', '5239012345', 'eren@example.com', 'Ofis siparişleri'),
('Derya Mor', '5240123456', 'derya@example.com', 'Düzenli müşteri');

-- Alıcılar (her müşteri için bir alıcı)
INSERT INTO recipients (customer_id, name, phone, notes) VALUES
(1, 'Fatma Yıldız', '5051234567', 'Kendisi'),
(2, 'Ahmet Kara', '5062345678', 'Kendisi'),
(3, 'Ayşe Beyaz', '5073456789', 'Kendisi'),
(4, 'Mehmet Yeşil', '5084567890', 'Kendisi'),
(5, 'Zeynep Mavi', '5095678901', 'Kendisi'),
(6, 'Leyla Şahin', '5556667788', 'Ali Bey''in eşi'),
(7, 'Selin Yılmaz', '5557778899', 'Elif Hanım''ın kız kardeşi'),
(8, 'Burak Demir', '5558889900', 'Can Bey''in iş ortağı'),
(9, 'Melis Korkmaz', '5559990011', 'Deniz Bey''in annesi'),
(10, 'Kaan Yücel', '5550001122', 'Ece Hanım''ın erkek arkadaşı'),
(11, 'Burak Kırmızı', '5151234567', 'Kendisi'),
(12, 'Selma Siyah', '5162345678', 'Kendisi'),
(13, 'Kemal Lacivert', '5173456789', 'Kendisi'),
(14, 'Aslı Turkuaz', '5184567890', 'Kendisi'),
(15, 'Okan Bej', '5195678901', 'Kendisi'),
(16, 'Cem Polat', '5551112233', 'Leyla Hanım''ın oğlu'),
(17, 'Eda Çelik', '5552223344', 'Murat Bey''in kuzeni'),
(18, 'Seda Yeşil', '5228901234', 'Kendisi'),
(19, 'Eren Gri', '5239012345', 'Kendisi'),
(20, 'Derya Mor', '5240123456', 'Kendisi');

-- Adresler
INSERT INTO addresses (customer_id, recipient_id, label, district, neighborhood, street, building_no, floor_no, directions) VALUES
(1, 1, 'Ev', 'Kadıköy', 'Caferağa', 'Moda Caddesi', '12', '3', 'Sarı apartman, 3. kat'),
(2, 2, 'Ofis', 'Şişli', 'Mecidiyeköy', 'Büyükdere Caddesi', '120', '5', 'Plaza girişinde resepsiyon var'),
(3, 3, 'Ev', 'Beşiktaş', 'Levent', 'Ebulula Caddesi', '15', NULL, 'Site içerisinde 2. blok'),
(4, 4, 'Ev', 'Üsküdar', 'Acıbadem', 'Tekin Sokak', '8', '4', 'Beyaz apartman, 4. kat'),
(5, 5, 'Ofis', 'Bakırköy', 'Ataköy', 'İnönü Caddesi', '45', '3', 'İş merkezi 3. kat'),
(6, 6, 'Ev', 'Beyoğlu', 'Cihangir', 'Sıraselviler Caddesi', '18', '5', 'Köşedeki apartman'),
(7, 7, 'Ev', 'Maltepe', 'Bağlarbaşı', 'Çınar Sokak', '23', '6', 'Yeşil apartman, 6. kat'),
(8, 8, 'Ofis', 'Sarıyer', 'Maslak', 'Büyükdere Caddesi', '193', '2', 'Plaza B blok, 2. kat'),
(9, 9, 'Ev', 'Ataşehir', 'Barbaros', 'Mimar Sinan Caddesi', '34', '7', 'Site içerisinde C blok'),
(10, 10, 'Ev', 'Beykoz', 'Kavacık', 'Orhan Veli Sokak', '12', '3', 'Kavacık merkeze yakın'),
(11, 11, 'Ev', 'Pendik', 'Bahçelievler', 'Fatih Caddesi', '5', '2', 'Mavi apartman'),
(12, 12, 'Ofis', 'Kartal', 'Yakacık', 'Sanayi Sokak', '10', '4', 'Ofis binası 4. kat'),
(13, 13, 'Ev', 'Adalar', 'Büyükada', 'Naber Sokak', '3', NULL, 'Deniz manzaralı ev'),
(14, 14, 'Ev', 'Tuzla', 'Postane', 'İstasyon Caddesi', '22', '1', 'Kırmızı bina'),
(15, 15, 'Ofis', 'Esenyurt', 'Merkez', 'Cumhuriyet Caddesi', '50', '6', 'Plaza A blok'),
(16, 16, 'Ev', 'Fatih', 'Aksaray', 'Mithatpaşa Caddesi', '17', '3', 'Köşe apartman'),
(17, 17, 'Ev', 'Bağcılar', 'Yıldıztepe', 'Bağlar Sokak', '9', '5', '5. kat'),
(18, 18, 'Ev', 'Beylikdüzü', 'Adnan Kahveci', 'Güzel Sokak', '14', '2', 'Site içi B blok'),
(19, 19, 'Ofis', 'Avcılar', 'Merkez', 'Denizköşkler Caddesi', '25', '3', 'İş hanı 3. kat'),
(20, 20, 'Ev', 'Silivri', 'Piri Mehmet', 'Sahil Yolu', '8', '1', 'Deniz kenarı');

-- Bugünün, yarının ve öbür günün tarihlerini hesapla
-- SQLite'da bugünün tarihini DATE('now') ile alabiliriz
-- YIL-AY-GÜN formatında olacak (YYYY-MM-DD)

-- Siparişler (Bugün, yarın ve öbür gün için)
-- 20 sipariş, farklı statüler ve teslimat saatleri
INSERT INTO orders (
    customer_id, recipient_id, address_id, 
    delivery_date, delivery_time, delivery_region, 
    delivery_fee, status, total_amount, 
    payment_status, custom_card_message, created_by
) VALUES
-- BUGÜN için siparişler
(1, 1, 1, DATE('now'), 'morning', 'Kadıköy', 50.00, 'new', 1250.00, 'pending', 'Doğum günün kutlu olsun!', 1),
(2, 2, 2, DATE('now'), 'morning', 'Şişli', 60.00, 'new', 1310.00, 'pending', 'Başarılar dilerim!', 1),
(3, 3, 3, DATE('now'), 'afternoon', 'Beşiktaş', 45.00, 'new', 895.00, 'pending', 'Nice yıllara!', 1),
(4, 4, 4, DATE('now'), 'afternoon', 'Üsküdar', 50.00, 'new', 1550.00, 'pending', 'Sevgilerimle...', 1),
(5, 5, 5, DATE('now'), 'evening', 'Bakırköy', 70.00, 'new', 1270.00, 'pending', 'Yeni iş yeriniz hayırlı olsun!', 1),
(6, 6, 6, DATE('now'), 'evening', 'Beyoğlu', 65.00, 'new', 915.00, 'pending', 'Özledim seni!', 1),
(7, 7, 7, DATE('now'), 'morning', 'Maltepe', 60.00, 'new', 1160.00, 'pending', 'İyi ki varsın!', 1),

-- YARIN için siparişler
(8, 8, 8, DATE('now', '+1 day'), 'morning', 'Sarıyer', 80.00, 'new', 2080.00, 'pending', 'Tebrikler!', 1),
(9, 9, 9, DATE('now', '+1 day'), 'morning', 'Ataşehir', 55.00, 'new', 1255.00, 'pending', 'Anneler Günün kutlu olsun!', 1),
(10, 10, 10, DATE('now', '+1 day'), 'afternoon', 'Beykoz', 90.00, 'new', 1290.00, 'pending', 'Seni seviyorum!', 1),
(1, 1, 1, DATE('now', '+1 day'), 'afternoon', 'Kadıköy', 50.00, 'new', 900.00, 'pending', 'Geçmiş olsun!', 1),
(2, 2, 2, DATE('now', '+1 day'), 'afternoon', 'Şişli', 60.00, 'new', 910.00, 'pending', 'Yeni yaşın kutlu olsun!', 1),
(3, 3, 3, DATE('now', '+1 day'), 'evening', 'Beşiktaş', 45.00, 'new', 1945.00, 'pending', 'Başarılar!', 1),
(4, 4, 4, DATE('now', '+1 day'), 'evening', 'Üsküdar', 50.00, 'new', 1000.00, 'pending', 'Seni düşünüyorum!', 1),

-- ÖBÜR GÜN için siparişler
(5, 5, 5, DATE('now', '+2 day'), 'morning', 'Bakırköy', 70.00, 'new', 770.00, 'pending', 'Mutlu yıllar!', 1),
(6, 6, 6, DATE('now', '+2 day'), 'morning', 'Beyoğlu', 65.00, 'new', 1165.00, 'pending', 'Bir tanecik annem!', 1),
(7, 7, 7, DATE('now', '+2 day'), 'afternoon', 'Maltepe', 60.00, 'new', 1560.00, 'pending', 'İyi ki doğdun!', 1),
(8, 8, 8, DATE('now', '+2 day'), 'afternoon', 'Sarıyer', 80.00, 'new', 1280.00, 'pending', 'Başarılar!', 1),
(9, 9, 9, DATE('now', '+2 day'), 'evening', 'Ataşehir', 55.00, 'new', 505.00, 'pending', 'İyi ki varsın canım!', 1),
(10, 10, 10, DATE('now', '+2 day'), 'evening', 'Beykoz', 90.00, 'new', 790.00, 'pending', 'Seni seviyorum aşkım!', 1);

-- Sipariş ürünleri
-- Bugün için siparişlerin ürünleri
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_amount) VALUES
(1, 1, 1, 1200.00, 1200.00), -- Kırmızı Gül Buketi
(2, 4, 1, 1250.00, 1250.00), -- Kutuda Güller
(3, 3, 1, 850.00, 850.00),   -- Papatya Buketi
(4, 8, 1, 1500.00, 1500.00), -- Orkide Aranjmanı
(5, 5, 1, 1200.00, 1200.00), -- Kutuda Karışık
(6, 2, 1, 850.00, 850.00),   -- Mevsim Buketi
(7, 6, 1, 1100.00, 1100.00), -- Cam Vazoda Lilyum

-- Yarın için siparişlerin ürünleri
(8, 8, 1, 2000.00, 2000.00), -- Orkide Aranjmanı
(9, 1, 1, 1200.00, 1200.00), -- Kırmızı Gül Buketi
(10, 5, 1, 1200.00, 1200.00), -- Kutuda Karışık
(11, 3, 1, 850.00, 850.00),   -- Papatya Buketi
(12, 2, 1, 850.00, 850.00),   -- Mevsim Buketi
(13, 7, 1, 1900.00, 1900.00), -- Soft Aranjman
(14, 9, 2, 450.00, 900.00),   -- Mini Sukulent (2 adet)

-- Öbür gün için siparişlerin ürünleri
(15, 10, 1, 700.00, 700.00),  -- Bonsai
(16, 6, 1, 1100.00, 1100.00), -- Cam Vazoda Lilyum
(17, 4, 1, 1500.00, 1500.00), -- Kutuda Güller
(18, 5, 1, 1200.00, 1200.00), -- Kutuda Karışık
(19, 9, 1, 450.00, 450.00),   -- Mini Sukulent
(20, 10, 1, 700.00, 700.00);  -- Bonsai

-- Teslimat Bölgeleri - 200_seed_data.sql'den eksik olan
INSERT INTO delivery_regions (name, base_fee) VALUES
('Kadıköy', 50.00),
('Üsküdar', 50.00),
('Ataşehir', 60.00),
('Maltepe', 70.00),
('Şişli', 60.00),
('Beşiktaş', 45.00),
('Bakırköy', 70.00),
('Beyoğlu', 65.00),
('Sarıyer', 80.00),
('Beykoz', 90.00);

-- Kart Mesajları - 200_seed_data.sql'den eksik olan
INSERT INTO card_messages (category, title, content) VALUES
('birthday', 'Doğum Günü', 'Nice mutlu, sağlıklı yıllara...'),
('anniversary', 'Yıldönümü', 'Nice mutlu yıllara...'),
('get_well', 'Geçmiş Olsun', 'Acil şifalar dileriz...'),
('love', 'Sevgiliye', 'Seni seviyorum...'),
('congratulations', 'Tebrikler', 'Başarılarının devamını dileriz...'),
('mother_day', 'Anneler Günü', 'Canım annem, sen benim her şeyimsin...'),
('father_day', 'Babalar Günü', 'Canım babam, iyi ki varsın...');

-- Hesaplar - 200_seed_data.sql'den eksik olan
INSERT INTO accounts (name, type, initial_balance, status) VALUES 
('Ana Kasa', 'cash', 0.00, 'active'),
('Kredi Kartı POS', 'pos', 0.00, 'active'),
('Banka Hesabı', 'bank', 0.00, 'active'),
('Online Ödeme', 'online', 0.00, 'active');

-- İşlem Kategorileri - 200_seed_data.sql'den eksik olan
INSERT INTO transaction_categories (name, type, reporting_code) VALUES
-- Gelir Kategorileri (in)
('Nakit Satış', 'in', 'SALES_CASH'),               -- Nakit ödeme ile yapılan satışlar
('Kredi Kartı Satış', 'in', 'SALES_CARD'),         -- Kredi kartı ile yapılan satışlar
('Banka Havale', 'in', 'SALES_BANK'),              -- Banka havalesi ile alınan ödemeler
('Online Ödeme', 'in', 'SALES_ONLINE'),            -- Online ödeme sistemleri (PayPal, Stripe vb.)
('Kapıda Ödeme', 'in', 'SALES_COD'),               -- Teslimatta nakit veya kart ile ödeme
('Hediye Kartı Satışı', 'in', 'SALES_GIFT'),       -- Hediye kartı veya kupon satışları
('İade Geliri', 'in', 'REFUND_IN'),                -- Tedarikçilerden alınan iade ödemeleri
('Sponsorluk Geliri', 'in', 'SPONSORSHIP'),        -- Sponsorluk veya reklam gelirleri
('Yatırım Geliri', 'in', 'INVESTMENT'),            -- Yatırım veya faiz gelirleri
('Diğer Gelirler', 'in', 'MISC_IN'),               -- Tanımlanamayan diğer gelir kaynakları

-- Gider Kategorileri (out)
('Tedarikçi Ödemesi', 'out', 'SUPPLIER'),          -- Tedarikçilere yapılan ödemeler
('Kira Gideri', 'out', 'RENT'),                    -- İş yeri veya depo kirası
('Elektrik/Su/Doğalgaz', 'out', 'UTILITY'),        -- Faturalar
('Personel Maaşı', 'out', 'SALARY'),               -- Çalışan maaşları
('Genel Giderler', 'out', 'GENERAL'),              -- Tanımlanamayan genel giderler
('Reklam/Pazarlama', 'out', 'MARKETING'),          -- Reklam ve tanıtım harcamaları
('Taşıma/Nakliye', 'out', 'TRANSPORT'),            -- Ürün teslimat veya lojistik giderleri
('Bakım/Onarım', 'out', 'MAINTENANCE'),            -- Ekipman veya tesis bakım giderleri
('Vergi Ödemeleri', 'out', 'TAX'),                 -- Vergi ve resmi harçlar
('Eğitim/Personel Gelişimi', 'out', 'TRAINING');   -- Personel eğitimi veya seminer giderleri
