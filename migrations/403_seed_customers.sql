-- Çiçek Dünyası Müşterileri
INSERT INTO customers (tenant_id, name, phone, email, customer_type, company_name, tax_number, notes, special_dates, tags) VALUES
-- Bireysel Müşteriler (25 adet)
(1, 'Ahmet Yılmaz', '5551234001', 'ahmet.y@email.com', 'retail', NULL, NULL, 'Kırmızı gülleri tercih ediyor', '{"birthday": "1980-05-15"}', '["regular"]'),
(1, 'Ayşe Demir', '5551234002', 'ayse.d@email.com', 'retail', NULL, NULL, 'Alerjisi var - zambak', '{"birthday": "1985-03-20", "anniversary": "2010-09-12"}', '["vip"]'),
(1, 'Mehmet Kaya', '5551234003', 'mehmet.k@email.com', 'retail', NULL, NULL, 'Cumartesi teslimat tercih ediyor', '{"birthday": "1975-12-10"}', '["regular"]'),
(1, 'Zeynep Çelik', '5551234004', 'zeynep.c@email.com', 'retail', NULL, NULL, 'Orkide sever', '{"birthday": "1990-08-25"}', '["regular"]'),
(1, 'Ali Öztürk', '5551234005', 'ali.o@email.com', 'retail', NULL, NULL, 'Sabah teslimat tercih ediyor', '{"birthday": "1982-04-18"}', '["vip"]'),
(1, 'Fatma Yıldız', '5551234006', 'fatma.y@email.com', 'retail', NULL, NULL, 'Renkli buketler tercih ediyor', '{"birthday": "1988-07-30"}', '["regular"]'),
(1, 'Mustafa Şahin', '5551234007', 'mustafa.s@email.com', 'retail', NULL, NULL, 'Akşam teslimat tercih ediyor', '{"birthday": "1979-11-22"}', '["regular"]'),
(1, 'Elif Aydın', '5551234008', 'elif.a@email.com', 'retail', NULL, NULL, 'Papatya sever', '{"birthday": "1992-02-14", "anniversary": "2015-06-20"}', '["regular"]'),
(1, 'Hüseyin Korkmaz', 'huseyin.k@email.com', 'retail', NULL, NULL, NULL, '{"birthday": "1977-09-05"}', '["new"]'),
(1, 'Selin Arslan', 'selin.a@email.com', 'retail', NULL, NULL, 'Saksı çiçekleri tercih ediyor', '{"birthday": "1987-12-03"}', '["vip"]'),
(1, 'Can Yılmaz', 'can.y@email.com', 'retail', NULL, NULL, NULL, '{"birthday": "1983-06-28"}', '["regular"]'),
(1, 'Esra Demir', 'esra.d@email.com', 'retail', NULL, NULL, 'Hafta sonu teslimat', '{"birthday": "1991-04-15"}', '["regular"]'),
(1, 'Burak Kara', 'burak.k@email.com', 'retail', NULL, NULL, NULL, '{"birthday": "1984-08-12"}', '["new"]'),
(1, 'Deniz Yıldırım', 'deniz.y@email.com', 'retail', NULL, NULL, 'Öğlen teslimat tercih ediyor', '{"birthday": "1986-01-25"}', '["regular"]'),
(1, 'Gül Çetin', 'gul.c@email.com', 'retail', NULL, NULL, 'Beyaz çiçekler tercih ediyor', '{"birthday": "1989-03-18"}', '["regular"]'),
(1, 'Mert Aydın', 'mert.a@email.com', 'retail', NULL, NULL, NULL, '{"birthday": "1981-07-09"}', '["new"]'),
(1, 'İrem Yalçın', 'irem.y@email.com', 'retail', NULL, NULL, 'Orkide koleksiyoncusu', '{"birthday": "1993-05-27"}', '["vip"]'),
(1, 'Tolga Özkan', 'tolga.o@email.com', 'retail', NULL, NULL, NULL, '{"birthday": "1978-10-14"}', '["regular"]'),
(1, 'Aslı Koç', 'asli.k@email.com', 'retail', NULL, NULL, 'Mevsim çiçekleri tercih ediyor', '{"birthday": "1990-11-30"}', '["regular"]'),
(1, 'Emre Şahin', 'emre.s@email.com', 'retail', NULL, NULL, NULL, '{"birthday": "1985-02-08"}', '["new"]'),
(1, 'Ceren Yavuz', 'ceren.y@email.com', 'retail', NULL, NULL, 'Pastel renkler tercih ediyor', '{"birthday": "1988-09-17"}', '["regular"]'),
(1, 'Kerem Aksoy', 'kerem.a@email.com', 'retail', NULL, NULL, NULL, '{"birthday": "1982-12-21"}', '["regular"]'),
(1, 'Pınar Tekin', 'pinar.t@email.com', 'retail', NULL, NULL, 'Lale sever', '{"birthday": "1987-06-11"}', '["regular"]'),
(1, 'Onur Yılmaz', 'onur.y@email.com', 'retail', NULL, NULL, NULL, '{"birthday": "1983-04-29"}', '["new"]'),
(1, 'Aylin Kaya', 'aylin.k@email.com', 'retail', NULL, NULL, 'Aranjman tercih ediyor', '{"birthday": "1991-08-07"}', '["regular"]'),

-- Kurumsal Müşteriler (5 adet)
(1, 'ABC Holding', '5551234101', 'info@abcholding.com', 'corporate', 'ABC Holding A.Ş.', '1234567890', 'Her pazartesi ofis çiçekleri', NULL, '["corporate", "vip"]'),
(1, 'XYZ Teknoloji', '5551234102', 'info@xyztech.com', 'corporate', 'XYZ Teknoloji Ltd.', '2345678901', 'Özel etkinlikler için düzenli sipariş', NULL, '["corporate"]'),
(1, 'Delta Otel', '5551234103', 'info@deltaotel.com', 'corporate', 'Delta Otel İşletmeleri', '3456789012', 'Lobi çiçekleri - haftalık yenileme', NULL, '["corporate", "vip"]'),
(1, 'Star Restaurant', 'info@starrest.com', 'corporate', 'Star Restaurant Ltd.', '4567890123', 'Masa aranjmanları - günlük', NULL, '["corporate"]'),
(1, 'Mega Plaza', 'info@megaplaza.com', 'corporate', 'Mega Plaza İş Merkezi', '5678901234', 'Resepsiyon çiçekleri - iki haftada bir', NULL, '["corporate", "vip"]');


-- Müşteri Adreslerini Ekle (her müşteri için en az 1, bazıları için 2-3 adres)
INSERT INTO addresses (
    tenant_id, customer_id, label, recipient_name, recipient_phone,
    country_code, city, district, neighborhood, street, 
    building_no, floor, apartment_no, postal_code,
    directions, lat, lng, is_default, here_place_id
) VALUES
-- Bireysel müşteriler için ev adresleri
(1, 1, 'Ev', 'Ahmet Yılmaz', '5551234001', 'TUR', 'İstanbul', 'Kadıköy', 'Caferağa', 'Moda Caddesi', '123', '3', '5', '34710', 'Moda çay bahçesi karşısı', 40.9845, 29.0287, 1, 'here:123'),
(1, 2, 'Ev', 'Ayşe Demir', '5551234002', 'TUR', 'İstanbul', 'Üsküdar', 'Acıbadem', 'Acıbadem Caddesi', '45', '4', '12', '34718', 'Acıbadem Hastanesi yanı', 40.9912, 29.0461, 1, 'here:124'),
(1, 3, 'Ev', 'Mehmet Kaya', '5551234003', 'TUR', 'İstanbul', 'Ataşehir', 'Atatürk', 'Tatlısu Mah.', '67', '8', '16', '34758', 'Metropol İstanbul karşısı', 40.9954, 29.1276, 1, 'here:125'),

-- Bireysel müşteriler için iş adresleri
(1, 1, 'İş', 'Ahmet Yılmaz', '5551234001', 'TUR', 'İstanbul', 'Ataşehir', 'Atatürk', 'Finans Merkezi', '15', '12', '55', '34768', 'A Blok giriş', 40.9977, 29.1254, 0, 'here:126'),
(1, 2, 'İş', 'Ayşe Demir', '5551234002', 'TUR', 'İstanbul', 'Levent', 'Levent', 'Büyükdere Cad.', '185', '15', '150', '34394', 'Levent Metro üstü', 41.0780, 29.0179, 0, 'here:127'),

-- Kurumsal müşteri adresleri (merkez ofisler)
(1, 26, 'Merkez Ofis', 'Aylin Sekreter', '5551234101', 'TUR', 'İstanbul', 'Maslak', 'Merkez', 'Plaza Caddesi', '5', '15', '-', '34398', 'Plaza A Blok, Resepsiyon', 41.1123, 29.0217, 1, 'here:128'),
(1, 27, 'Genel Merkez', 'Zehra Asistan', '5551234102', 'TUR', 'İstanbul', 'Şişli', 'Esentepe', 'Büyükdere Cad.', '193', '8', '-', '34394', 'Trump Towers yanı', 41.0780, 29.0179, 1, 'here:129'),

-- Kurumsal müşteri şube adresleri
(1, 26, 'Anadolu Şube', 'Mehmet Müdür', '5551234103', 'TUR', 'İstanbul', 'Kadıköy', 'Kozyatağı', 'Değirmen Sok.', '18', '3', '-', '34742', 'Carrefour karşısı', 40.9793, 29.0975, 0, 'here:130'),
(1, 27, 'Avrupa Şube', 'Ali Yönetici', '5551234104', 'TUR', 'İstanbul', 'Bakırköy', 'Merkez', 'İstanbul Cad.', '26', '4', '-', '34142', 'Capacity AVM yanı', 40.9793, 28.8764, 0, 'here:131');

-- Müşteri tercihleri
INSERT INTO customer_preferences (customer_id, key, value, notes) VALUES
-- Teslimat tercihleri
(1, 'tercih_edilen_teslimat', 'morning', 'Sabah teslimatı tercih ediyor'),
(2, 'tercih_edilen_teslimat', 'afternoon', 'Öğleden sonra teslimat'),
(3, 'tercih_edilen_teslimat', 'evening', 'Akşam teslimatı'),

-- Renk tercihleri
(1, 'favori_renk', 'Kırmızı', 'Kırmızı gül tercih ediyor'),
(2, 'favori_renk', 'Beyaz', 'Beyaz çiçekler tercih ediyor'),
(3, 'favori_renk', 'Pembe', 'Pembe tonları tercih ediyor'),

-- Alerjiler ve özel durumlar
(2, 'alerji', 'zambak', 'Zambak alerjisi var'),
(4, 'alerji', 'polen', 'Polen alerjisi - yapay çiçek tercih edilebilir'),

-- Kurumsal müşteri özel notları
(26, 'teslimat_notu', 'Pazartesi sabah', 'Her pazartesi sabah 09:00 teslimat'),
(26, 'fatura_notu', 'e-fatura', 'E-fatura gönderimi zorunlu'),
(27, 'teslimat_notu', 'Güvenlik', 'Güvenlikten giriş kartı alınmalı'),
(27, 'ozel_not', 'VIP', 'Yönetim katına özel hizmet');
