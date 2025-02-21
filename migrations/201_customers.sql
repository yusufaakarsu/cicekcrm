-- Tenant 1 için örnek müşteriler
INSERT INTO customers (tenant_id, name, phone, email, notes, created_at) VALUES 
(1, 'Ahmet Yılmaz', '5321234567', 'ahmet@email.com', 'VIP müşteri', datetime('now')),
(1, 'Ayşe Kara', '5331234567', 'ayse@email.com', 'Özel günlerde düzenli sipariş verir', datetime('now')),
(1, 'Mehmet Demir', '5341234567', 'mehmet@email.com', NULL, datetime('now')),
(1, 'ABC Şirketi', '5351234567', 'info@abc.com', 'Her ay düzenli sipariş', datetime('now')),
(1, 'Zeynep Ak', '5361234567', NULL, 'Tercih: Pembe güller', datetime('now'));

-- Tenant 1 için örnek alıcılar
INSERT INTO recipients (tenant_id, customer_id, name, phone, relationship, notes, special_dates) VALUES
(1, 1, 'Fatma Yılmaz', '5322345678', 'Eş', 'Kapıcıya haber verilecek', '{"birthday": "03-15", "anniversary": "06-22"}'),
(1, 1, 'Ali Yılmaz', '5323456789', 'Baba', NULL, '{"birthday": "08-10"}'),
(1, 2, 'Ayşe Kara', '5331234567', 'Kendisi', NULL, '{"birthday": "04-20"}'),
(1, 3, 'Melek Demir', '5342345678', 'Anne', 'Alerjisi var: zambak', '{"birthday": "05-12", "mothers_day": "05"}'),
(1, 4, 'ABC Şirketi Merkez', '5351234567', 'Firma', 'Resepsiyon: Elif Hanım', NULL);

-- Tenant 1 için örnek adresler
INSERT INTO addresses (
    tenant_id, customer_id, recipient_id, 
    here_place_id, label, district, neighborhood, street,
    lat, lng, building_no, floor_no, door_no, directions
) VALUES 
-- Ahmet Bey'in ev adresi
(1, 1, 1, 'here_123', 'Ataşehir, Atatürk Mah. Marmara Sok.', 'Ataşehir', 'Atatürk', 'Marmara Sokak',
40.9923, 29.1244, '15', '3', '8', 'Marketin yanındaki bina'),

-- Ahmet Bey'in iş adresi
(1, 1, 1, 'here_124', 'Kadıköy, Kozyatağı Mah. İnönü Cad.', 'Kadıköy', 'Kozyatağı', 'İnönü Caddesi',
40.9755, 29.0993, '122', '4', NULL, 'Metro çıkışı yanı'),

-- Ayşe Hanım'ın ev adresi
(1, 2, 2, 'here_125', 'Üsküdar, Acıbadem Mah. Tekin Sok.', 'Üsküdar', 'Acıbadem', 'Tekin Sokak',
41.0123, 29.0456, '7', '2', '4', 'Acıbadem Hastanesi arkası'),

-- Mehmet Bey'in annesi adresi
(1, 3, 4, 'here_126', 'Beşiktaş, Levent Mah. Çarşı Cad.', 'Beşiktaş', 'Levent', 'Çarşı Caddesi',
41.0789, 29.0123, '45', '5', '12', 'Metro istasyonu karşısı'),

-- ABC Şirketi adresi
(1, 4, 5, 'here_127', 'Şişli, Mecidiyeköy Mah. Büyükdere Cad.', 'Şişli', 'Mecidiyeköy', 'Büyükdere Caddesi',
41.0678, 28.9989, '155', '8', NULL, 'Trump Towers yanı'),

-- Zeynep Hanım adresi
(1, 5, NULL, 'here_128', 'Maltepe, Cevizli Mah. Bağdat Cad.', 'Maltepe', 'Cevizli', 'Bağdat Caddesi',
40.9234, 29.1567, '234', '1', '3', 'Sahil tarafı');

-- Örnek kart mesajları
INSERT INTO card_messages (tenant_id, category, title, content, display_order) VALUES
(1, 'birthday', 'Doğum Günü - 1', 'Nice mutlu yıllara! En güzel dileklerimle...', 1),
(1, 'anniversary', 'Yıldönümü - 1', 'Mutluluğunuz daim olsun! Nice yıllara...', 1),
(1, 'get_well', 'Geçmiş Olsun - 1', 'Acil şifalar dileriz...', 1),
(1, 'congratulations', 'Tebrik - 1', 'Tebrikler! En içten dileklerimle...', 1),
(1, 'sympathy', 'Taziye - 1', 'Başınız sağolsun, sabırlar dileriz...', 1);
