INSERT INTO tenants (id, name, domain, contact_email) VALUES
  (1, 'Çiçek Dünyası', 'cicekdunyasi.com', 'iletisim@cicekdunyasi.com');


INSERT INTO customers (id, tenant_id, name, email, phone, address, city, district, customer_type)
VALUES
  (1, 1, 'Ahmet Yılmaz', 'ahmet.yilmaz@example.com', '5551234567', 'Örnek Mah. No: 10', 'İstanbul', 'Beşiktaş', 'retail'),
  (2, 1, 'Mehmet Kara', 'mehmet.kara@example.com', '5552345678', 'Cumhuriyet Cd. No: 5', 'İstanbul', 'Kadıköy', 'retail'),
  (3, 1, 'Ayşe Demir', 'ayse.demir@example.com', '5553456789', 'İnönü Mah. No: 15', 'İstanbul', 'Üsküdar', 'retail'),
  (4, 1, 'Fatma Çelik', 'fatma.celik@example.com', '5554567890', 'Atatürk Bulvarı No: 22', 'İstanbul', 'Şişli', 'retail'),
  (5, 1, 'Ali Öz', 'ali.oz@example.com', '5555678901', 'Güneş Sok. No: 8', 'İstanbul', 'Bakırköy', 'retail'),
  (6, 1, 'Emre Yıldırım', 'emre.yildirim@example.com', '5556789012', 'Mehmet Akif Ersoy Cad. No: 12', 'İstanbul', 'Pendik', 'retail'),
  (7, 1, 'Zeynep Şahin', 'zeynep.sahin@example.com', '5557890123', 'İstiklal Cd. No: 18', 'İstanbul', 'Kadıköy', 'retail'),
  (8, 1, 'Elif Aslan', 'elif.aslan@example.com', '5558901234', 'Barbaros Bulvarı No: 30', 'İstanbul', 'Beşiktaş', 'retail'),
  (9, 1, 'Can Demirtaş', 'can.demirtas@example.com', '5559012345', 'Fatih Sok. No: 14', 'İstanbul', 'Üsküdar', 'retail'),
  (10, 1, 'Burcu Aksoy', 'burcu.aksoy@example.com', '5550123456', 'Sakarya Cd. No: 7', 'İstanbul', 'Şişli', 'retail'),
  (11, 1, 'Oğuz Tuncer', 'oguz.tuncer@example.com', '5551123456', 'Orhan Veli Cd. No: 9', 'İstanbul', 'Bakırköy', 'retail'),
  (12, 1, 'Selin Yıldız', 'selin.yildiz@example.com', '5552123456', 'Cumhuriyet Sok. No: 11', 'İstanbul', 'Pendik', 'retail'),
  (13, 1, 'Hüseyin Çetin', 'huseyin.cetin@example.com', '5553123456', 'Anafartalar Cd. No: 16', 'İstanbul', 'Kadıköy', 'retail'),
  (14, 1, 'Merve Gül', 'merve.gul@example.com', '5554123456', 'Yeni Mah. No: 3', 'İstanbul', 'Beşiktaş', 'retail'),
  (15, 1, 'Esra Kaplan', 'esra.kaplan@example.com', '5555123456', 'Adnan Menderes Cd. No: 21', 'İstanbul', 'Üsküdar', 'corporate'),
  (16, 1, 'Berk Öztürk', 'berk.ozturk@example.com', '5556123456', 'Piri Reis Cd. No: 5', 'İstanbul', 'Şişli', 'corporate'),
  (17, 1, 'Derya Arslan', 'derya.arslan@example.com', '5557123456', 'Sedef Sok. No: 17', 'İstanbul', 'Bakırköy', 'retail'),
  (18, 1, 'Kerem Güç', 'kerem.guc@example.com', '5558123456', 'Abdi İpekçi Cd. No: 8', 'İstanbul', 'Pendik', 'retail'),
  (19, 1, 'Pınar Yılmaz', 'pinar.yilmaz@example.com', '5559123456', 'Mimar Sinan Cd. No: 12', 'İstanbul', 'Kadıköy', 'corporate'),
  (20, 1, 'Sibel Erdem', 'sibel.erdem@example.com', '5550223456', 'Fatih Cd. No: 6', 'İstanbul', 'Şişli', 'corporate');


DELETE FROM product_categories;
INSERT INTO product_categories (id, tenant_id, name, description, is_deleted) VALUES
  (1, 1, 'Çiçek Düzenlemeleri', 'Çiçek düzenlemeleri için kategori', 0),
  (2, 1, 'Süs Bitkileri', 'Ev ve ofis süs bitkileri', 0),
  (3, 1, 'Bahçe Bitkileri', 'Bahçe ve açık alan bitkileri', 0);


DELETE FROM products;
INSERT INTO products (id, tenant_id, category_id, name, description, purchase_price, retail_price, wholesale_price, stock, min_stock, is_deleted)
VALUES
  (1, 1, 1, 'Gül Buketi', 'Kırmızı güllerden oluşan özel gün buketi', 50.00, 70.00, 65.00, 120, 10, 0),
  (2, 1, 1, 'Lale Düzenlemesi', 'Canlı lalelerle hazırlanmış modern çiçek düzenlemesi', 40.00, 60.00, 55.00, 100, 10, 0),
  (3, 1, 1, 'Orkide Saksısı', 'Zarif orkide, dekoratif saksıda sunulmaktadır', 30.00, 50.00, 45.00, 80, 5, 0),
  (4, 1, 1, 'Buket Rose', 'Özel tasarım güllerden oluşan şık buket', 55.00, 75.00, 70.00, 60, 5, 0),
  (5, 1, 1, 'Çiçek Aranjmanı', 'Modern tasarımlı çiçek aranjmanı, ev ve ofis için ideal', 45.00, 65.00, 60.00, 110, 10, 0),
  (6, 1, 2, 'Ficus', 'Ofis ve evler için modern ficus bitkisi', 20.00, 30.00, 28.00, 90, 5, 0),
  (7, 1, 2, 'Uçan Kırlangıç', 'Dekoratif ve dayanıklı uçan kırlangıç bitkisi', 25.00, 35.00, 32.00, 85, 5, 0),
  (8, 1, 3, 'Lavanta', 'Bahçeler için hoş kokulu lavanta bitkisi', 15.00, 25.00, 22.00, 100, 10, 0),
  (9, 1, 3, 'Biberiye', 'Mutfak ve bahçe kullanımına uygun biberiye bitkisi', 10.00, 20.00, 18.00, 120, 15, 0);


DELETE FROM orders;

INSERT INTO orders (id, tenant_id, customer_id, status, delivery_date, delivery_time_slot, delivery_address, delivery_city, delivery_district, recipient_name, recipient_phone, subtotal, total_amount, created_at)
VALUES
  -- 14 Şubat 2015 (9 adet)
  (1, 1, 4, 'delivered', '2025-02-14', 'morning', 'Beşiktaş Mah. No:1', 'İstanbul', 'Beşiktaş', 'Mert E.', '5551111001', 120.00, 132.00, '2025-02-13 09:10:00'),
  (2, 1, 8, 'delivered', '2025-02-14', 'morning', 'Kadıköy Mah. No:2', 'İstanbul', 'Kadıköy', 'Ayşe K.', '5551111002', 140.00, 154.00, '2025-02-13 10:20:00'),
  (3, 1, 11, 'delivered', '2025-02-14', 'morning', 'Üsküdar Cad. No:3', 'İstanbul', 'Üsküdar', 'Ali T.', '5551111003', 100.00, 110.00, '2025-02-13 09:50:00'),
  (4, 1, 2, 'delivered', '2025-02-14', 'morning', 'Fatih Sok. No:4', 'İstanbul', 'Fatih', 'Mehmet D.', '5551111004', 180.00, 198.00, '2025-02-13 15:10:00'),
  (5, 1, 16, 'delivered', '2025-02-14', 'afternoon', 'Şişli Mah. No:5', 'İstanbul', 'Şişli', 'Melisa Y.', '5551111005', 150.00, 165.00, '2025-02-13 08:30:00'),
  (6, 1, 3, 'delivered', '2025-02-14', 'afternoon', 'Bakırköy Cad. No:6', 'İstanbul', 'Bakırköy', 'Okan R.', '5551111006', 200.00, 220.00, '2025-02-13 11:45:00'),
  (7, 1, 19, 'delivered', '2025-02-14', 'afternoon', 'Beyoğlu Mah. No:7', 'İstanbul', 'Beyoğlu', 'Zeynep Z.', '5551111007', 95.00, 104.50, '2025-02-13 07:00:00'),
  (8, 1, 1, 'delivered', '2025-02-14', 'evening', 'Levent Sok. No:8', 'İstanbul', 'Beşiktaş', 'Fatma K.', '5551111008', 175.00, 192.50, '2025-02-13 14:25:00'),
  (9, 1, 14, 'delivered', '2025-02-14', 'evening', 'Pendik Cad. No:9', 'İstanbul', 'Pendik', 'Uğur B.', '5551111009', 130.00, 143.00, '2025-02-13 09:00:00'),

  -- 15 Şubat 2015 (10 adet)
  (10, 1, 5, 'new', '2025-02-15', 'morning', 'Beşiktaş Mah. No:10', 'İstanbul', 'Beşiktaş', 'Ece K.', '5551111010', 115.00, 126.50, '2025-02-14 08:40:00'),
  (11, 1, 20, 'new', '2025-02-15', 'afternoon', 'Kadıköy Mah. No:11', 'İstanbul', 'Kadıköy', 'Hasan Ç.', '5551111011', 140.00, 154.00, '2025-02-14 10:15:00'),
  (12, 1, 9, 'new', '2025-02-15', 'morning', 'Üsküdar Cad. No:12', 'İstanbul', 'Üsküdar', 'Emre Y.', '5551111012', 130.00, 143.00, '2025-02-14 09:30:00'),
  (13, 1, 6, 'new', '2025-02-15', 'afternoon', 'Fatih Sok. No:13', 'İstanbul', 'Fatih', 'Kerem G.', '5551111013', 160.00, 176.00, '2025-02-14 13:00:00'),
  (14, 1, 10, 'new', '2025-02-15', 'evening', 'Şişli Mah. No:14', 'İstanbul', 'Şişli', 'Burcu A.', '5551111014', 110.00, 121.00, '2025-02-14 07:20:00'),
  (15, 1, 7, 'new', '2025-02-15', 'evening', 'Bakırköy Cad. No:15', 'İstanbul', 'Bakırköy', 'Zeynep A.', '5551111015', 170.00, 187.00, '2025-02-14 11:35:00'),
  (16, 1, 12, 'new', '2025-02-15', 'morning', 'Beyoğlu Mah. No:16', 'İstanbul', 'Beyoğlu', 'Oguz T.', '5551111016', 155.00, 170.50, '2025-02-14 08:55:00'),
  (17, 1, 15, 'new', '2025-02-15', 'evening', 'Levent Sok. No:17', 'İstanbul', 'Beşiktaş', 'Esra K.', '5551111017', 145.00, 159.50, '2025-02-14 13:10:00'),
  (18, 1, 2, 'new', '2025-02-15', 'morning', 'Pendik Cad. No:18', 'İstanbul', 'Pendik', 'Mehmet D.', '5551111018', 185.00, 203.50, '2025-02-14 08:20:00'),
  (19, 1, 13, 'new', '2025-02-15', 'afternoon', 'Kadıköy Cad. No:19', 'İstanbul', 'Kadıköy', 'Selin Y.', '5551111019', 120.00, 132.00, '2025-02-14 12:30:00'),

  -- 16 Şubat 2015 (11 adet)
  (20, 1, 1, 'new', '2025-02-16', 'morning', 'Beşiktaş Mah. No:20', 'İstanbul', 'Beşiktaş', 'Ahmet Y.', '5551111020', 105.00, 115.50, '2025-02-15 07:10:00'),
  (21, 1, 17, 'new', '2025-02-16', 'afternoon', 'Kadıköy Mah. No:21', 'İstanbul', 'Kadıköy', 'Derya A.', '5551111021', 148.00, 162.80, '2025-02-15 13:45:00'),
  (22, 1, 5, 'new', '2025-02-16', 'morning', 'Üsküdar Cad. No:22', 'İstanbul', 'Üsküdar', 'Ali Ö.', '5551111022', 95.00, 104.50, '2025-02-15 08:00:00'),
  (23, 1, 4, 'new', '2025-02-16', 'afternoon', 'Fatih Sok. No:23', 'İstanbul', 'Fatih', 'Mert E.', '5551111023', 210.00, 231.00, '2025-02-15 11:55:00'),
  (24, 1, 14, 'new', '2025-02-16', 'morning', 'Şişli Mah. No:24', 'İstanbul', 'Şişli', 'Melisa Y.', '5551111024', 135.00, 148.50, '2025-02-15 09:40:00'),
  (25, 1, 9, 'new', '2025-02-16', 'afternoon', 'Bakırköy Cad. No:25', 'İstanbul', 'Bakırköy', 'Can D.', '5551111025', 155.00, 170.50, '2025-02-15 10:25:00'),
  (26, 1, 16, 'new', '2025-02-16', 'evening', 'Beyoğlu Mah. No:26', 'İstanbul', 'Beyoğlu', 'Berk Ö.', '5551111026', 140.00, 154.00, '2025-02-15 08:10:00'),
  (27, 1, 7, 'new', '2025-02-16', 'evening', 'Levent Sok. No:27', 'İstanbul', 'Beşiktaş', 'Zeynep A.', '5551111027', 180.00, 198.00, '2025-02-15 14:25:00'),
  (28, 1, 11, 'new', '2025-02-16', 'evening', 'Pendik Cad. No:28', 'İstanbul', 'Pendik', 'Ahmet Y.', '5551111028', 165.00, 181.50, '2025-02-15 07:50:00'),
  (29, 1, 19, 'new', '2025-02-16', 'afternoon', 'Kadıköy Cad. No:29', 'İstanbul', 'Kadıköy', 'Zeynep Z.', '5551111029', 125.00, 137.50, '2025-02-15 13:00:00'),
  (30, 1, 18, 'new', '2025-02-16', 'morning', 'Beşiktaş Mah. No:30', 'İstanbul', 'Beşiktaş', 'Kerem G.', '5551111030', 190.00, 209.00, '2025-02-15 06:45:00'),

  -- 17 Şubat 2015 (12 adet)
  (31, 1, 12, 'new', '2025-02-17', 'morning', 'Kadıköy Mah. No:31', 'İstanbul', 'Kadıköy', 'Oguz T.', '5551111031', 140.00, 154.00, '2025-02-16 08:15:00'),
  (32, 1, 8, 'new', '2025-02-17', 'afternoon', 'Üsküdar Cad. No:32', 'İstanbul', 'Üsküdar', 'Ayşe K.', '5551111032', 130.00, 143.00, '2025-02-16 12:10:00'),
  (33, 1, 3, 'new', '2025-02-17', 'morning', 'Fatih Sok. No:33', 'İstanbul', 'Fatih', 'Okan R.', '5551111033', 95.00, 104.50, '2025-02-16 07:50:00'),
  (34, 1, 13, 'new', '2025-02-17', 'afternoon', 'Şişli Mah. No:34', 'İstanbul', 'Şişli', 'Selin Y.', '5551111034', 210.00, 231.00, '2025-02-16 15:05:00'),
  (35, 1, 2, 'new', '2025-02-17', 'evening', 'Bakırköy Cad. No:35', 'İstanbul', 'Bakırköy', 'Mehmet D.', '5551111035', 160.00, 176.00, '2025-02-16 09:00:00'),
  (36, 1, 10, 'new', '2025-02-17', 'evening', 'Beyoğlu Mah. No:36', 'İstanbul', 'Beyoğlu', 'Burcu A.', '5551111036', 145.00, 159.50, '2025-02-16 12:45:00'),
  (37, 1, 15, 'new', '2025-02-17', 'evening', 'Levent Sok. No:37', 'İstanbul', 'Beşiktaş', 'Esra K.', '5551111037', 135.00, 148.50, '2025-02-16 08:40:00'),
  (38, 1, 4, 'new', '2025-02-17', 'afternoon', 'Pendik Cad. No:38', 'İstanbul', 'Pendik', 'Mert E.', '5551111038', 125.00, 137.50, '2025-02-16 13:05:00'),
  (39, 1, 14, 'new', '2025-02-17', 'morning', 'Kadıköy Mah. No:39', 'İstanbul', 'Kadıköy', 'Melisa Y.', '5551111039', 120.00, 132.00, '2025-02-16 09:15:00'),
  (40, 1, 6, 'new', '2025-02-17', 'afternoon', 'Beşiktaş Mah. No:40', 'İstanbul', 'Beşiktaş', 'Kerem G.', '5551111040', 150.00, 165.00, '2025-02-16 11:20:00'),
  (41, 1, 18, 'new', '2025-02-17', 'morning', 'Beyoğlu Mah. No:41', 'İstanbul', 'Beyoğlu', 'Pınar Y.', '5551111041', 170.00, 187.00, '2025-02-16 07:30:00'),
  (42, 1, 17, 'new', '2025-02-17', 'afternoon', 'Levent Sok. No:42', 'İstanbul', 'Beşiktaş', 'Derya A.', '5551111042', 180.00, 198.00, '2025-02-16 14:00:00'),

  -- 18 Şubat 2015 (13 adet)
  (43, 1, 1, 'new', '2025-02-18', 'morning', 'Beşiktaş Mah. No:43', 'İstanbul', 'Beşiktaş', 'Ahmet Y.', '5551111043', 120.00, 132.00, '2025-02-17 08:00:00'),
  (44, 1, 8, 'new', '2025-02-18', 'afternoon', 'Kadıköy Mah. No:44', 'İstanbul', 'Kadıköy', 'Ayşe K.', '5551111044', 140.00, 154.00, '2025-02-17 10:20:00'),
  (45, 1, 11, 'new', '2025-02-18', 'morning', 'Üsküdar Cad. No:45', 'İstanbul', 'Üsküdar', 'Ali T.', '5551111045', 100.00, 110.00, '2025-02-17 09:50:00'),
  (46, 1, 2, 'new', '2025-02-18', 'afternoon', 'Fatih Sok. No:46', 'İstanbul', 'Fatih', 'Mehmet D.', '5551111046', 180.00, 198.00, '2025-02-17 15:10:00'),
  (47, 1, 16, 'new', '2025-02-18', 'morning', 'Şişli Mah. No:47', 'İstanbul', 'Şişli', 'Melisa Y.', '5551111047', 150.00, 165.00, '2025-02-17 08:30:00'),
  (48, 1, 3, 'new', '2025-02-18', 'afternoon', 'Bakırköy Cad. No:48', 'İstanbul', 'Bakırköy', 'Okan R.', '5551111048', 200.00, 220.00, '2025-02-17 11:45:00'),
  (49, 1, 19, 'new', '2025-02-18', 'evening', 'Beyoğlu Mah. No:49', 'İstanbul', 'Beyoğlu', 'Zeynep Z.', '5551111049', 95.00, 104.50, '2025-02-17 07:00:00'),
  (50, 1, 1, 'new', '2025-02-18', 'evening', 'Levent Sok. No:50', 'İstanbul', 'Beşiktaş', 'Fatma K.', '5551111050', 175.00, 192.50, '2025-02-17 14:25:00'),
  (51, 1, 14, 'new', '2025-02-18', 'evening', 'Pendik Cad. No:51', 'İstanbul', 'Pendik', 'Uğur B.', '5551111051', 130.00, 143.00, '2025-02-17 09:00:00'),
  (52, 1, 5, 'new', '2025-02-18', 'evening', 'Beşiktaş Mah. No:52', 'İstanbul', 'Beşiktaş', 'Ece K.', '5551111052', 115.00, 126.50, '2025-02-17 08:40:00'),
  (53, 1, 20, 'new', '2025-02-18', 'morning', 'Kadıköy Mah. No:53', 'İstanbul', 'Kadıköy', 'Hasan Ç.', '5551111053', 140.00, 154.00, '2025-02-17 10:15:00'),
  (54, 1, 9, 'new', '2025-02-18', 'afternoon', 'Üsküdar Cad. No:54', 'İstanbul', 'Üsküdar', 'Emre Y.', '5551111054', 130.00, 143.00, '2025-02-17 09:30:00'),
  (55, 1, 6, 'new', '2025-02-18', 'morning', 'Fatih Sok. No:55', 'İstanbul', 'Fatih', 'Kerem G.', '5551111055', 160.00, 176.00, '2025-02-17 13:00:00'),
  (56, 1, 1, 'new', '2025-02-14', 'morning', 'Test Address', 'İstanbul', 'Beşiktaş', 'Test Name', '5551234567', 100.00, 110.00, '2025-02-13 09:00:00');


DELETE FROM order_items;
INSERT INTO order_items (id, tenant_id, order_id, product_id, quantity, unit_price, cost_price) VALUES
  (1, 1, 1, 1, 1, 100.00, 80.00),
  (2, 1, 2, 2, 2, 100.00, 80.00),
  (3, 1, 3, 3, 1, 100.00, 80.00),
  (4, 1, 4, 4, 1, 100.00, 80.00),
  (5, 1, 5, 5, 1, 100.00, 80.00),
  (6, 1, 6, 6, 1, 100.00, 80.00),
  (7, 1, 7, 1, 1, 100.00, 80.00),
  (8, 1, 8, 2, 1, 100.00, 80.00),
  (9, 1, 9, 3, 1, 100.00, 80.00),
  (10, 1, 10, 4, 1, 100.00, 80.00),
  (11, 1, 11, 5, 1, 100.00, 80.00),
  (12, 1, 12, 6, 1, 100.00, 80.00),
  (13, 1, 13, 1, 1, 100.00, 80.00),
  (14, 1, 14, 2, 1, 100.00, 80.00),
  (15, 1, 15, 3, 1, 100.00, 80.00),
  (16, 1, 16, 4, 1, 100.00, 80.00),
  (17, 1, 17, 5, 1, 100.00, 80.00),
  (18, 1, 18, 6, 1, 100.00, 80.00),
  (19, 1, 19, 1, 1, 100.00, 80.00),
  (20, 1, 20, 2, 1, 100.00, 80.00),
  (21, 1, 21, 3, 1, 100.00, 80.00),
  (22, 1, 22, 4, 1, 100.00, 80.00),
  (23, 1, 23, 5, 1, 100.00, 80.00),
  (24, 1, 24, 6, 1, 100.00, 80.00),
  (25, 1, 25, 1, 1, 100.00, 80.00),
  (26, 1, 26, 2, 1, 100.00, 80.00),
  (27, 1, 27, 3, 1, 100.00, 80.00),
  (28, 1, 28, 4, 1, 100.00, 80.00),
  (29, 1, 29, 5, 1, 100.00, 80.00),
  (30, 1, 30, 6, 1, 100.00, 80.00),
  (31, 1, 31, 1, 1, 100.00, 80.00),
  (32, 1, 32, 2, 1, 100.00, 80.00),
  (33, 1, 33, 3, 1, 100.00, 80.00),
  (34, 1, 34, 4, 1, 100.00, 80.00),
  (35, 1, 35, 5, 1, 100.00, 80.00),
  (36, 1, 36, 6, 1, 100.00, 80.00),
  (37, 1, 37, 1, 1, 100.00, 80.00),
  (38, 1, 38, 2, 1, 100.00, 80.00),
  (39, 1, 39, 3, 1, 100.00, 80.00),
  (40, 1, 40, 4, 1, 100.00, 80.00),
  (41, 1, 41, 5, 1, 100.00, 80.00),
  (42, 1, 42, 6, 1, 100.00, 80.00),
  (43, 1, 43, 1, 1, 100.00, 80.00),
  (44, 1, 44, 2, 1, 100.00, 80.00),
  (45, 1, 45, 3, 1, 100.00, 80.00),
  (46, 1, 46, 4, 1, 100.00, 80.00),
  (47, 1, 47, 5, 1, 100.00, 80.00),
  (48, 1, 48, 6, 1, 100.00, 80.00),
  (49, 1, 49, 1, 1, 100.00, 80.00),
  (50, 1, 50, 2, 1, 100.00, 80.00),
  (51, 1, 51, 3, 1, 100.00, 80.00),
  (52, 1, 52, 4, 1, 100.00, 80.00),
  (53, 1, 53, 5, 1, 100.00, 80.00),
  (54, 1, 54, 6, 1, 100.00, 80.00),
  (55, 1, 55, 1, 1, 100.00, 80.00);
