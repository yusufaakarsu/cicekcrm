-- Bölgeler (İstanbul'un popüler semtleri)
INSERT INTO delivery_regions (tenant_id, name, parent_id, base_fee, min_order, delivery_notes) VALUES
-- Anadolu Yakası
(1, 'Anadolu Yakası', NULL, NULL, NULL, 'Anadolu yakası teslimat bölgesi'),
(1, 'Kadıköy', 1, 50, 100, 'Merkez bölge - Aynı gün teslimat'),
(1, 'Üsküdar', 1, 50, 100, 'Merkez bölge - Aynı gün teslimat'), 
(1, 'Ataşehir', 1, 60, 100, 'Merkez bölge - Aynı gün teslimat'),
(1, 'Maltepe', 1, 60, 150, 'Sipariş cut-off: 16:00'),
(1, 'Kartal', 1, 70, 150, 'Sipariş cut-off: 16:00'),
(1, 'Pendik', 1, 80, 150, 'Sipariş cut-off: 15:00'),
(1, 'Tuzla', 1, 90, 200, 'Uzak bölge - Erken sipariş gerekli'),
(1, 'Çekmeköy', 1, 80, 150, 'Sipariş cut-off: 15:00'),
(1, 'Ümraniye', 1, 60, 100, 'Merkez bölge - Aynı gün teslimat'),
(1, 'Beykoz', 1, 90, 200, 'Uzak bölge - Erken sipariş gerekli'),
(1, 'Sancaktepe', 1, 80, 150, 'Sipariş cut-off: 15:00'),

-- Avrupa Yakası
(1, 'Avrupa Yakası', NULL, NULL, NULL, 'Avrupa yakası teslimat bölgesi'),
(1, 'Beşiktaş', 13, 50, 100, 'Merkez bölge - Aynı gün teslimat'),
(1, 'Şişli', 13, 50, 100, 'Merkez bölge - Aynı gün teslimat'),
(1, 'Beyoğlu', 13, 60, 100, 'Merkez bölge - Aynı gün teslimat'),
(1, 'Sarıyer', 13, 80, 150, 'Sipariş cut-off: 15:00'),
(1, 'Kağıthane', 13, 60, 100, 'Merkez bölge - Aynı gün teslimat'),
(1, 'Eyüp', 13, 70, 150, 'Sipariş cut-off: 16:00'),
(1, 'Gaziosmanpaşa', 13, 70, 150, 'Sipariş cut-off: 16:00'),
(1, 'Fatih', 13, 60, 100, 'Merkez bölge - Aynı gün teslimat'),
(1, 'Bakırköy', 13, 70, 150, 'Sipariş cut-off: 16:00'),
(1, 'Zeytinburnu', 13, 70, 150, 'Sipariş cut-off: 16:00'),
(1, 'Bahçelievler', 13, 80, 150, 'Sipariş cut-off: 15:00'),
(1, 'Avcılar', 13, 90, 200, 'Uzak bölge - Erken sipariş gerekli'),
(1, 'Esenyurt', 13, 90, 200, 'Uzak bölge - Erken sipariş gerekli'),
(1, 'Küçükçekmece', 13, 80, 150, 'Sipariş cut-off: 15:00'),
(1, 'Başakşehir', 13, 80, 150, 'Sipariş cut-off: 15:00');
