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
('Kırmızı Gül Buketi', '12 adet kırmızı gül ve yeşillikler', 3000.00, 'active', 1),
('Mevsim Buketi', 'Mevsim çiçeklerinden buket', 3300.00, 'active', 1),
('Papatya Buketi', 'Papatyalar ve yeşillikler', 3500.00, 'active', 1),
('Kutuda Güller', 'Kutuda kırmızı güller', 4000.00, 'active', 2),
('Kutuda Karışık', 'Özel kutuda mevsim çiçekleri', 4400.00, 'active', 2),
('Cam Vazoda Lilyum', 'Cam vazoda lilyumlar', 4500.00, 'active', 3),
('Soft Aranjman', 'Pastel tonlarda aranjman', 5000.00, 'active', 3),
('Orkide Aranjmanı', 'İki dallı orkide aranjmanı', 5000.00, 'active', 3),
('Mini Sukulent', 'Mini sukulent terrarium', 3000.00, 'active', 4),
('Bonsai', 'Dekoratif bonsai bitkisi', 6500.00, 'active', 4);

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

INSERT INTO suppliers (name, contact_name, phone, email, address, status) VALUES
('Çiçek Deposu', 'Ahmet Yılmaz', '5551234567', 'info@cicekdeposu.com', 'Çiçekçiler Hali No: 45', 'active'),
('Flora Toptan', 'Ayşe Demir', '5559876543', 'satis@floratoptan.com', 'Sanayi Sitesi A Blok No: 12', 'active'),
('Yeşil Dünya', 'Mehmet Kaya', '5553456789', 'iletisim@yesildunya.net', 'Organize Sanayi 5. Cadde', 'active'),
('Ambalaj Market', 'Zeynep Şahin', '5552223344', 'satis@ambalajmarket.com', 'Kervan Caddesi No: 78', 'active'),
('Çiçekçi Malzemeleri', 'Ali Öztürk', '5554445566', 'info@cicekci-malzemeleri.com', 'Çiçekçiler Pasajı No: 23', 'active');

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

INSERT INTO addresses (customer_id, recipient_id, here_place_id, label, district, neighborhood, street, lat, lng, building_no, floor_no, door_no, directions, deleted_at) VALUES
(1, 1, 'here_0001', 'Ev', 'Kadıköy', 'Caferağa', 'Moda Caddesi', 40.9793, 29.0268, '12', '3', '8', 'Sarı apartman, 3. kat', NULL),
(2, 2, 'here_0002', 'Ofis', 'Şişli', 'Mecidiyeköy', 'Büyükdere Caddesi', 41.0671, 28.9850, '120', '5', '10', 'Plaza girişinde resepsiyon var', NULL),
(3, 3, 'here_0003', 'Ev', 'Beşiktaş', 'Levent', 'Ebulula Caddesi', 41.0792, 29.0155, '15', '2', '5', 'Site içerisinde 2. blok', NULL),
(4, 4, 'here_0004', 'Ev', 'Üsküdar', 'Acıbadem', 'Tekin Sokak', 41.0053, 29.0493, '8', '4', '7', 'Beyaz apartman, 4. kat', NULL),
(5, 5, 'here_0005', 'Ofis', 'Bakırköy', 'Ataköy', 'İnönü Caddesi', 40.9782, 28.8355, '45', '3', '15', 'İş merkezi 3. kat', NULL),
(6, 6, 'here_0006', 'Ev', 'Beyoğlu', 'Cihangir', 'Sıraselviler Caddesi', 41.0309, 28.9846, '18', '5', '12', 'Köşedeki apartman', NULL),
(7, 7, 'here_0007', 'Ev', 'Maltepe', 'Bağlarbaşı', 'Çınar Sokak', 40.9396, 29.1488, '23', '6', '9', 'Yeşil apartman, 6. kat', NULL),
(8, 8, 'here_0008', 'Ofis', 'Sarıyer', 'Maslak', 'Büyükdere Caddesi', 41.1085, 29.0117, '193', '2', '4', 'Plaza B blok, 2. kat', NULL),
(9, 9, 'here_0009', 'Ev', 'Ataşehir', 'Barbaros', 'Mimar Sinan Caddesi', 40.9900, 29.1342, '34', '7', '3', 'Site içerisinde C blok', NULL),
(10, 10, 'here_0010', 'Ev', 'Beykoz', 'Kavacık', 'Orhan Veli Sokak', 41.1081, 29.0914, '12', '3', '6', 'Kavacık merkeze yakın', NULL),
(11, 11, 'here_0011', 'Ev', 'Pendik', 'Bahçelievler', 'Fatih Caddesi', 40.8763, 29.2622, '5', '2', '11', 'Mavi apartman', NULL),
(12, 12, 'here_0012', 'Ofis', 'Kartal', 'Yakacık', 'Sanayi Sokak', 40.8937, 29.1968, '10', '4', '2', 'Ofis binası 4. kat', NULL),
(13, 13, 'here_0013', 'Ev', 'Adalar', 'Büyükada', 'Naber Sokak', 40.8553, 29.1281, '3', '1', '1', 'Deniz manzaralı ev', NULL),
(14, 14, 'here_0014', 'Ev', 'Tuzla', 'Postane', 'İstasyon Caddesi', 40.8163, 29.3069, '22', '1', '4', 'Kırmızı bina', NULL),
(15, 15, 'here_0015', 'Ofis', 'Esenyurt', 'Merkez', 'Cumhuriyet Caddesi', 41.0345, 28.6731, '50', '6', '8', 'Plaza A blok', NULL),
(16, 16, 'here_0016', 'Ev', 'Fatih', 'Aksaray', 'Mithatpaşa Caddesi', 41.0131, 28.9452, '17', '3', '5', 'Köşe apartman', NULL),
(17, 17, 'here_0017', 'Ev', 'Bağcılar', 'Yıldıztepe', 'Bağlar Sokak', 41.0462, 28.8291, '9', '5', '6', '5. kat', NULL),
(18, 18, 'here_0018', 'Ev', 'Beylikdüzü', 'Adnan Kahveci', 'Güzel Sokak', 41.0028, 28.6469, '14', '2', '3', 'Site içi B blok', NULL),
(19, 19, 'here_0019', 'Ofis', 'Avcılar', 'Merkez', 'Denizköşkler Caddesi', 40.9784, 28.7219, '25', '3', '9', 'İş hanı 3. kat', NULL),
(20, 20, 'here_0020', 'Ev', 'Silivri', 'Piri Mehmet', 'Sahil Yolu', 41.0735, 28.2468, '8', '1', '2', 'Deniz kenarı', NULL);


INSERT INTO orders (
    customer_id, recipient_id, address_id, 
    delivery_date, delivery_time, delivery_region, 
    delivery_fee, status, total_amount, 
    payment_status, custom_card_message, created_by
) VALUES
(1, 1, 1, DATE('now'), 'morning', 'Kadıköy', 50.00, 'new', 4000.00, 'pending', 'Doğum günün kutlu olsun!', 1),
(2, 2, 2, DATE('now'), 'morning', 'Şişli', 60.00, 'new', 4500.00, 'pending', 'Başarılar dilerim!', 1),
(3, 3, 3, DATE('now'), 'afternoon', 'Beşiktaş', 45.00, 'new', 4200.00, 'pending', 'Nice yıllara!', 1),
(4, 4, 4, DATE('now'), 'afternoon', 'Üsküdar', 50.00, 'new', 4800.00, 'pending', 'Sevgilerimle...', 1),
(5, 5, 5, DATE('now'), 'evening', 'Bakırköy', 70.00, 'new', 4700.00, 'pending', 'Yeni iş yeriniz hayırlı olsun!', 1),
(6, 6, 6, DATE('now'), 'evening', 'Beyoğlu', 65.00, 'new', 4300.00, 'pending', 'Özledim seni!', 1),
(7, 7, 7, DATE('now'), 'morning', 'Maltepe', 60.00, 'new', 4900.00, 'pending', 'İyi ki varsın!', 1),
(8, 8, 8, DATE('now', '+1 day'), 'morning', 'Sarıyer', 80.00, 'new', 6000.00, 'pending', 'Tebrikler!', 1),
(9, 9, 9, DATE('now', '+1 day'), 'morning', 'Ataşehir', 55.00, 'new', 4100.00, 'pending', 'Anneler Günün kutlu olsun!', 1),
(10, 10, 10, DATE('now', '+1 day'), 'afternoon', 'Beykoz', 90.00, 'new', 5200.00, 'pending', 'Seni seviyorum!', 1),
(11, 11, 11, DATE('now', '+2 day'), 'morning', 'Kadıköy', 55.00, 'new', 5300.00, 'pending', 'Tebrik ederim!', 1),
(12, 12, 12, DATE('now', '+2 day'), 'morning', 'Şişli', 75.00, 'new', 5900.00, 'pending', 'Bol şans!', 1),
(13, 13, 13, DATE('now', '+2 day'), 'afternoon', 'Beşiktaş', 85.00, 'new', 6800.00, 'pending', 'İyi tatiller!', 1),
(14, 14, 14, DATE('now', '+2 day'), 'afternoon', 'Üsküdar', 70.00, 'new', 4500.00, 'pending', 'Geçmiş olsun!', 1),
(15, 15, 15, DATE('now', '+2 day'), 'evening', 'Bakırköy', 60.00, 'new', 6200.00, 'pending', 'Hoşgeldin!', 1),
(16, 16, 16, DATE('now', '+3 day'), 'evening', 'Beyoğlu', 80.00, 'new', 6700.00, 'pending', 'Yeni yaşın kutlu olsun!', 1),
(17, 17, 17, DATE('now', '+3 day'), 'morning', 'Maltepe', 55.00, 'new', 4800.00, 'pending', 'Sevgilerle...', 1),
(18, 18, 18, DATE('now', '+3 day'), 'morning', 'Sarıyer', 90.00, 'new', 7000.00, 'pending', 'Sana en güzel dileklerimle!', 1),
(19, 19, 19, DATE('now', '+3 day'), 'afternoon', 'Ataşehir', 65.00, 'new', 4600.00, 'pending', 'Başarılar dilerim!', 1),
(20, 20, 20, DATE('now', '+3 day'), 'afternoon', 'Beykoz', 50.00, 'new', 5500.00, 'pending', 'Seninle gurur duyuyorum!', 1);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_amount) VALUES
(1, 1, 1, 4000.00, 4000.00),
(2, 4, 1, 4500.00, 4500.00),
(3, 3, 1, 4200.00, 4200.00),
(4, 8, 1, 4800.00, 4800.00),
(5, 5, 1, 4700.00, 4700.00),
(6, 2, 1, 4300.00, 4300.00),
(7, 6, 1, 4900.00, 4900.00),
(8, 8, 1, 6000.00, 6000.00),
(9, 1, 1, 4100.00, 4100.00),
(10, 5, 1, 5200.00, 5200.00),
(11, 7, 1, 5300.00, 5300.00),
(12, 3, 1, 5900.00, 5900.00),
(13, 9, 1, 6800.00, 6800.00),
(14, 2, 1, 4500.00, 4500.00),
(15, 5, 1, 6200.00, 6200.00),
(16, 6, 1, 6700.00, 6700.00),
(17, 4, 1, 4800.00, 4800.00),
(18, 1, 1, 7000.00, 7000.00),
(19, 8, 1, 4600.00, 4600.00),
(20, 10, 1, 5500.00, 5500.00);

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

INSERT INTO card_messages (category, title, content) VALUES
('birthday', 'Doğum Günü', 'Nice mutlu, sağlıklı yıllara...'),
('anniversary', 'Yıldönümü', 'Nice mutlu yıllara...'),
('get_well', 'Geçmiş Olsun', 'Acil şifalar dileriz...'),
('love', 'Sevgiliye', 'Seni seviyorum...'),
('congratulations', 'Tebrikler', 'Başarılarının devamını dileriz...'),
('mother_day', 'Anneler Günü', 'Canım annem, sen benim her şeyimsin...'),
('father_day', 'Babalar Günü', 'Canım babam, iyi ki varsın...');

INSERT INTO accounts (name, type, initial_balance, status) VALUES 
('Ana Kasa', 'cash', 0.00, 'active'),
('Kredi Kartı POS', 'pos', 0.00, 'active'),
('Banka Hesabı', 'bank', 0.00, 'active'),
('Online Ödeme', 'online', 0.00, 'active');

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
