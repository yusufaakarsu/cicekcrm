-- Temel ürün tiplerini ekleyelim
INSERT INTO product_types (tenant_id, name, code, description, allows_recipe, is_stock_tracked, default_unit_id, recipe_required, cost_tracked) VALUES 
(1, 'Tek Çiçek', 'single', 'Tek dal çiçekler', 0, 1, 3, 0, 1),
(1, 'Buket', 'bouquet', 'Hazır ve özel buketler', 1, 0, 1, 1, 1),
(1, 'Aranjman', 'arrangement', 'Özel tasarım aranjmanlar', 1, 0, 1, 1, 1),
(1, 'Saksı Çiçeği', 'potted', 'Saksıda çiçek ve bitkiler', 0, 1, 1, 0, 1),
(1, 'Sarf Malzeme', 'supply', 'Kurdele, süs vs.', 0, 1, 4, 0, 1),
(1, 'Hammadde', 'raw', 'Yeşillik, tel vs.', 0, 1, 3, 0, 1);

-- Önce kategorileri ekle
INSERT INTO product_categories (tenant_id, name, description, parent_id) VALUES
(1, 'Kesme Çiçekler', 'Tek dal ve demet çiçekler', NULL),
(1, 'Güller', 'Her renk taze güller', 1),
(1, 'Orkideler', 'Orkide çeşitleri', 1),
(1, 'Mevsimlikler', 'Mevsim çiçekleri', 1),
(1, 'Tasarım Ürünleri', 'Hazır ve özel tasarımlar', NULL),
(1, 'Buketler', 'Özel tasarım buketler', 5),
(1, 'Aranjmanlar', 'Özel tasarım aranjmanlar', 5),
(1, 'Saksı Bitkileri', 'İç mekan bitkileri', NULL),
(1, 'Orkide Saksıları', 'Orkide ve tasarımları', 8),
(1, 'İç Mekan Bitkileri', 'Bakımı kolay bitkiler', 8),
(1, 'Malzemeler', 'Yan ürünler', NULL),
(1, 'Yeşillikler', 'Buket yeşillikleri', 11),
(1, 'Süsleme', 'Kurdele ve aksesuarlar', 11),
(1, 'Saksı/Vazo', 'Dekoratif ürünler', 11);

-- Güller
INSERT INTO products (
    tenant_id, type_id, category_id, name, description, 
    sku, barcode, stock_unit_id, is_recipe, min_stock, 
    purchase_price, retail_price, current_stock, image_url, is_active,
    is_purchasable, default_supplier_id
) VALUES
(1, 1, 2, 'Premium Kırmızı Gül', 'Ekvador menşeili uzun saplı kırmızı gül', 'GUL-KIR-001', '8680001001', 3, 0, 100, 25, 45, 150, '/images/gul-kirmizi.jpg', 1, 1, 1),
(1, 1, 2, 'Beyaz Gül', 'Özel seçim beyaz gül', 'GUL-BYZ-001', '8680001002', 3, 0, 80, 25, 45, 120, '/images/gul-beyaz.jpg', 1, 1, 1),
(1, 1, 2, 'Pembe Gül', 'Soft pembe renk gül', 'GUL-PMB-001', '8680001003', 3, 0, 80, 25, 45, 90, '/images/gul-pembe.jpg', 1, 1, 1),
(1, 1, 2, 'Sarı Gül', 'Canlı sarı renk gül', 'GUL-SRI-001', '8680001004', 3, 0, 60, 25, 45, 75, '/images/gul-sari.jpg', 1, 1, 1),
(1, 1, 2, 'Turuncu Gül', 'Egzotik turuncu gül', 'GUL-TRN-001', '8680001005', 3, 0, 40, 28, 50, 45, '/images/gul-turuncu.jpg', 1, 1, 1);

-- Mevsimlikler
INSERT INTO products (tenant_id, type_id, category_id, name, description, sku, barcode, stock_unit_id, is_recipe, min_stock, purchase_price, retail_price, current_stock, image_url, is_active, is_purchasable, default_supplier_id) VALUES
(1, 1, 4, 'Beyaz Papatya', 'Taze papatya', 'PAP-BYZ-001', '8680001101', 3, 0, 100, 8, 15, 200, '/images/papatya.jpg', 1, 1, 2),
(1, 1, 4, 'Mor Lisyantus', 'Premium lisyantus', 'LIS-MOR-001', '8680001102', 3, 0, 50, 12, 22, 80, '/images/lisyantus.jpg', 1, 1, 2),
(1, 1, 4, 'Pembe Şebboy', 'Kokulu şebboy', 'SEB-PMB-001', '8680001103', 3, 0, 60, 10, 18, 100, '/images/sebboy.jpg', 1, 1, 2),
(1, 1, 4, 'Beyaz Freesia', 'Kokulu freesia', 'FRE-BYZ-001', '8680001104', 3, 0, 40, 15, 25, 60, '/images/freesia.jpg', 1, 1, 2);

-- Orkideler
INSERT INTO products (tenant_id, type_id, category_id, name, description, sku, barcode, stock_unit_id, is_recipe, min_stock, purchase_price, retail_price, current_stock, image_url, is_active, is_purchasable, default_supplier_id) VALUES
(1, 1, 3, 'Pembe Orkide Dalı', 'Phalaenopsis orkide dalı', 'ORK-PMB-001', '8680001201', 3, 0, 20, 45, 85, 25, '/images/orkide-pembe.jpg', 1, 1, 3),
(1, 1, 3, 'Beyaz Orkide Dalı', 'Phalaenopsis orkide dalı', 'ORK-BYZ-001', '8680001202', 3, 0, 20, 45, 85, 25, '/images/orkide-beyaz.jpg', 1, 1, 3);

-- Buketler
INSERT INTO products (tenant_id, type_id, category_id, name, description, sku, barcode, stock_unit_id, is_recipe, min_stock, purchase_price, retail_price, current_stock, image_url, is_active, is_purchasable, default_supplier_id) VALUES
(1, 2, 6, 'Klasik Kırmızı Buket', '25 kırmızı gül buketi', 'BUK-KIR-001', '8680002001', 1, 1, 0, 500, 750, 0, '/images/buket-kirmizi.jpg', 1, 1, NULL),
(1, 2, 6, 'Karışık Mevsim Buketi', 'Mevsim çiçeklerinden buket', 'BUK-KRS-001', '8680002002', 1, 1, 0, 300, 450, 0, '/images/buket-karisik.jpg', 1, 1, NULL),
(1, 2, 6, 'Premium Gül Buketi', '50 kırmızı gül buketi', 'BUK-PRE-001', '8680002003', 1, 1, 0, 1000, 1500, 0, '/images/buket-premium.jpg', 1, 1, NULL);

-- Saksı Çiçekleri
INSERT INTO products (tenant_id, type_id, category_id, name, description, sku, barcode, stock_unit_id, is_recipe, min_stock, purchase_price, retail_price, current_stock, image_url, is_active, is_purchasable, default_supplier_id) VALUES
(1, 4, 9, 'Çift Dallı Mor Orkide', 'Seramik saksıda orkide', 'SAK-ORK-001', '8680003001', 1, 0, 10, 250, 400, 15, '/images/saksi-orkide.jpg', 1, 1, 3),
(1, 4, 10, 'Barış Çiçeği', 'Spathiphyllum bitkisi', 'SAK-BRS-001', '8680003002', 1, 0, 15, 150, 250, 20, '/images/saksi-baris.jpg', 1, 1, 4),
(1, 4, 10, 'Beyaz Kalan Çiçeği', 'Spathiphyllum', 'SAK-KLN-001', '8680003003', 1, 0, 10, 120, 200, 12, '/images/saksi-kalan.jpg', 1, 1, 4);

-- Malzemeler
INSERT INTO products (tenant_id, type_id, category_id, name, description, sku, barcode, stock_unit_id, is_recipe, min_stock, purchase_price, retail_price, current_stock, image_url, is_active, is_purchasable, default_supplier_id) VALUES
(1, 5, 12, 'Şimşir', 'Buket yeşilliği', 'MLZ-SMS-001', '8680004001', 3, 0, 200, 3, 0, 250, '/images/yesil-simsir.jpg', 1, 1, 5),
(1, 5, 12, 'Pitos', 'Buket yeşilliği', 'MLZ-PTS-001', '8680004002', 3, 0, 200, 4, 0, 250, '/images/yesil-pitos.jpg', 1, 1, 5),
(1, 5, 13, 'İnce Kurdele (1cm)', 'Saten kurdele', 'MLZ-KRD-001', '8680004003', 4, 0, 500, 2, 0, 1000, '/images/kurdele-1cm.jpg', 1, 1, 6),
(1, 5, 13, 'Kalın Kurdele (2cm)', 'Saten kurdele', 'MLZ-KRD-002', '8680004004', 4, 0, 500, 3, 0, 1000, '/images/kurdele-2cm.jpg', 1, 1, 6),
(1, 5, 14, 'Orta Boy Vazo', '25cm cam vazo', 'MLZ-VZO-001', '8680004005', 1, 0, 50, 40, 0, 100, '/images/vazo-orta.jpg', 1, 1, 7),
(1, 5, 14, 'Büyük Boy Vazo', '40cm cam vazo', 'MLZ-VZO-002', '8680004006', 1, 0, 30, 60, 0, 80, '/images/vazo-buyuk.jpg', 1, 1, 7);


-- Reçete şablonları
INSERT INTO recipes (tenant_id, product_id, name, is_template, base_cost, preparation_time, difficulty_level, notes) VALUES
(1, 12, 'Klasik Kırmızı Buket', 1, 50, 30, 'medium', '25 güllü klasik buket'),
(1, 13, 'Karışık Mevsim Buketi', 1, 40, 25, 'easy', 'Mevsim çiçeklerinden karışık buket'),
(1, 14, 'Premium Gül Buketi', 1, 100, 45, 'hard', '50 güllü özel tasarım');

-- Reçete kalemleri
INSERT INTO recipe_items (
    recipe_id, component_id, quantity, unit_id, 
    is_optional, is_replaceable, min_quantity, max_quantity, 
    sequence, notes
) VALUES
-- Klasik Kırmızı Buket reçetesi
(1, 1, 25, 3, 0, 0, 25, 25, 1, 'Ana materyal - kırmızı güller'),
(1, 20, 5, 3, 0, 1, 3, 7, 2, 'Yeşillik - şimşir veya pitos'),
(1, 22, 2, 4, 0, 1, 2, 3, 3, 'Kurdele'),
(1, 24, 1, 1, 1, 1, 1, 1, 4, 'Vazo opsiyonel'),

-- Karışık Mevsim Buketi reçetesi
(2, 6, 10, 3, 0, 1, 8, 12, 1, 'Papatya ana materyal'),
(2, 7, 5, 3, 0, 1, 3, 7, 2, 'Lisyantus'),
(2, 8, 5, 3, 0, 1, 3, 7, 3, 'Şebboy'),
(2, 20, 3, 3, 0, 1, 2, 4, 4, 'Yeşillik'),
(2, 22, 2, 4, 0, 1, 2, 3, 5, 'Kurdele');
