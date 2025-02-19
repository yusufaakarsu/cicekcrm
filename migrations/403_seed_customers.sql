-- Müşteriler
INSERT INTO customers (
    tenant_id, name, phone, email, city, district, notes, customer_type, tax_number, company_name, special_dates
) VALUES
-- Bireysel (25 müşteri)
(1, 'Ahmet Yılmaz', '5551234001', 'ahmet.y@email.com', 'İstanbul', 'Kadıköy', 'Kırmızı gülleri tercih ediyor', 'retail', NULL, NULL, '{"birthday": "1980-05-15"}'),
(1, 'Ayşe Demir', '5551234002', 'ayse.d@email.com', 'İstanbul', 'Üsküdar', 'Alerjisi var - zambak', 'retail', NULL, NULL, '{"birthday": "1985-03-20"}'),
(1, 'Mehmet Kaya', '5551234003', 'mehmet.k@email.com', 'İstanbul', 'Kadıköy', 'Hafta sonu teslimat', 'retail', NULL, NULL, '{"birthday": "1975-12-10"}'),
(1, 'Zeynep Çelik', '5551234004', 'zeynep.c@email.com', 'İstanbul', 'Ataşehir', 'Orkide sever', 'retail', NULL, NULL, '{"birthday": "1990-08-25"}'),
(1, 'Ali Öztürk', '5551234005','ali.o@email.com', 'İstanbul', 'Üsküdar', 'Sabah teslimat', 'retail', NULL, NULL, '{"birthday": "1982-04-18"}'),
(1, 'Fatma Yıldız', '5551234006', 'fatma.y@email.com', 'İstanbul', 'Beşiktaş', 'Renkli buketler', 'retail', NULL, NULL, '{"birthday": "1988-07-30"}'),
(1, 'Mustafa Şahin', '5551234007', 'mustafa.s@email.com', 'İstanbul', 'Şişli', 'Akşam teslimat', 'retail', NULL, NULL, '{"birthday": "1979-11-22"}'),
(1, 'Elif Aydın', '5551234008', 'elif.a@email.com', 'İstanbul', 'Kadıköy', 'Papatya sever', 'retail', NULL, NULL, '{"birthday": "1992-02-14"}'),
(1, 'Hüseyin Korkmaz', '5551234009', 'huseyin.k@email.com', 'İstanbul', 'Maltepe', NULL, 'retail', NULL, NULL, '{"birthday": "1977-09-05"}'),
(1, 'Selin Arslan', '5551234010', 'selin.a@email.com', 'İstanbul', 'Kadıköy', 'Saksı çiçekleri', 'retail', NULL, NULL, '{"birthday": "1987-12-03"}'),
(1, 'Can Yılmaz', '5551234011', 'can.y@email.com', 'İstanbul', 'Beşiktaş', NULL, 'retail', NULL, NULL, '{"birthday": "1983-06-28"}'),
(1, 'Esra Demir', '5551234012', 'esra.d@email.com', 'İstanbul', 'Üsküdar', 'Hafta sonu', 'retail', NULL, NULL, '{"birthday": "1991-04-15"}'),
(1, 'Burak Kara', '5551234013', 'burak.k@email.com', 'İstanbul', 'Ataşehir', NULL, 'retail', NULL, NULL, '{"birthday": "1984-08-12"}'),
(1, 'Deniz Yıldırım', '5551234014', 'deniz.y@email.com', 'İstanbul', 'Kadıköy', 'Öğlen teslimat', 'retail', NULL, NULL, '{"birthday": "1986-01-25"}'),
(1, 'Gül Çetin', '5551234015','gul.c@email.com', 'İstanbul', 'Beşiktaş', 'Beyaz çiçekler', 'retail', NULL, NULL, '{"birthday": "1989-03-18"}'),

-- Kurumsal (10 müşteri)
(1, 'ABC Holding', '5551234101', 'info@abcholding.com', 'İstanbul', 'Maslak', 'Her pazartesi ofis', 'corporate', '1234567890', 'ABC Holding A.Ş.', NULL),
(1, 'XYZ Teknoloji', '5551234102', 'info@xyztech.com', 'İstanbul', 'Levent', 'Özel etkinlikler', 'corporate', '2345678901', 'XYZ Teknoloji Ltd.', NULL),
(1, 'Delta Otel', '5551234103', 'info@deltaotel.com', 'İstanbul', 'Beşiktaş', 'Lobi çiçekleri', 'corporate', '3456789012', 'Delta Otel İşletmeleri', NULL),
(1, 'Star Restaurant', '5551234104', 'info@starrest.com', 'İstanbul', 'Kadıköy', 'Masa aranjmanları', 'corporate', '4567890123', 'Star Restaurant Ltd.', NULL),
(1, 'Mega Plaza', '5551234105', 'info@megaplaza.com', 'İstanbul', 'Şişli', 'Resepsiyon çiçekleri', 'corporate', '5678901234', 'Mega Plaza İş Merkezi', NULL);

-- Adresler
INSERT INTO addresses (
    tenant_id, customer_id, label, city, district, street, building_no, floor, apartment_no, postal_code, lat, lng, is_default
) VALUES
-- Bireysel müşteri ev adresleri (ilk 15 müşteri için)
(1, 1, 'Ev', 'İstanbul', 'Kadıköy', 'Moda Caddesi', '123', '3', '5', '34710', 40.9845, 29.0287, 1),
(1, 2, 'Ev', 'İstanbul', 'Üsküdar', 'Acıbadem', '45', '4', '12', '34718', 40.9912, 29.0461, 1),
(1, 3, 'Ev', 'İstanbul', 'Kadıköy', 'Bağdat Caddesi', '67', '8', '16', '34728', 40.9623, 29.0756, 1),
(1, 4, 'Ev', 'İstanbul', 'Ataşehir', 'Ataşehir Bulvarı', '89', '5', '10', '34758', 40.9954, 29.1276, 1),
(1, 5, 'Ev', 'İstanbul', 'Üsküdar', 'Validebağ', '12', '2', '3', '34664', 41.0123, 29.0345, 1),
(1, 6, 'Ev', 'İstanbul', 'Beşiktaş', 'Nispetiye', '34', '6', '11', '34330', 41.0765, 29.0154, 1),
(1, 7, 'Ev', 'İstanbul', 'Şişli', 'Halaskargazi', '56', '4', '8', '34371', 41.0567, 28.9876, 1),
(1, 8, 'Ev', 'İstanbul', 'Kadıköy', 'Fenerbahçe', '78', '3', '6', '34726', 40.9698, 29.0367, 1),
(1, 9, 'Ev', 'İstanbul', 'Maltepe', 'Cevizli', '90', '7', '14', '34844', 40.9234, 29.1543, 1),
(1, 10, 'Ev', 'İstanbul', 'Kadıköy', 'Suadiye', '23', '5', '9', '34744', 40.9567, 29.0789, 1),

-- Seçili bireysel müşteriler için iş adresleri
(1, 1, 'İş', 'İstanbul', 'Ataşehir', 'Finans Merkezi', '15', '12', '55', '34768', 40.9977, 29.1254, 0),
(1, 2, 'İş', 'İstanbul', 'Levent', 'Büyükdere Cad.', '185', '15', '150', '34394', 41.0780, 29.0179, 0),
(1, 3, 'İş', 'İstanbul', 'Maslak', 'Maslak Plaza', '12', '8', '42', '34398', 41.1123, 29.0217, 0),
(1, 4, 'İş', 'İstanbul', 'Şişli', 'Mecidiyeköy', '45', '10', '101', '34381', 41.0678, 28.9908, 0),

-- Kurumsal müşteri adresleri (Merkez ve şube)
(1, 16, 'Merkez', 'İstanbul', 'Maslak', 'Plaza Caddesi', '5', '15', NULL, '34398', 41.1123, 29.0217, 1),
(1, 16, 'Şube', 'İstanbul', 'Kadıköy', 'Altıyol', '8', '3', NULL, '34710', 40.9890, 29.0289, 0),
(1, 17, 'Merkez', 'İstanbul', 'Levent', 'Büyükdere Cad.', '193', '8', NULL, '34394', 41.0780, 29.0179, 1),
(1, 17, 'Şube', 'İstanbul', 'Ataşehir', 'Ataşehir Bulvarı', '67', '4', NULL, '34758', 40.9954, 29.1276, 0);

-- Müşteri tercihleri
INSERT INTO customer_preferences (customer_id, key, value, notes) VALUES
-- Teslimat tercihleri
(1, 'teslimat_zamani', 'morning', 'Sabah teslimatı tercih ediyor'),
(2, 'teslimat_zamani', 'afternoon', 'Öğleden sonra teslimat'),
(3, 'teslimat_zamani', 'weekend', 'Hafta sonu teslimat'),
(4, 'teslimat_zamani', 'morning', 'Sabah teslimatı'),
(5, 'teslimat_zamani', 'evening', 'Akşam teslimatı'),

-- Çiçek tercihleri
(1, 'favori_renk', 'Kırmızı', 'Kırmızı gül tercih ediyor'),
(2, 'favori_renk', 'Beyaz', 'Beyaz çiçekler tercih ediyor'),
(3, 'favori_renk', 'Pembe', 'Pembe tonları tercih ediyor'),
(4, 'favori_çiçek', 'Orkide', 'Orkide tercih ediyor'),
(5, 'favori_çiçek', 'Papatya', 'Papatya seviyor'),

-- Alerjiler ve özel durumlar
(2, 'alerji', 'zambak', 'Zambak alerjisi var'),
(7, 'alerji', 'polen', 'Polen alerjisi var'),

-- Kurumsal müşteri tercihleri
(16, 'fatura_tipi', 'e-fatura', 'E-fatura zorunlu'),
(16, 'teslimat_notu', 'Her Pazartesi 09:00', 'Düzenli teslimat'),
(17, 'fatura_tipi', 'e-fatura', 'E-fatura zorunlu'),
(17, 'özel_not', 'Kartvizit ekle', 'Her bukete kartvizit eklenmeli'),
(18, 'teslimat_notu', 'Güvenlikten onay', 'Güvenlik onayı gerekli');
