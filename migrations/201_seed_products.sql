-- Raw Materials (Ham Maddeler) - Daha önce eklenen units tablosundaki ID'lere göre
INSERT INTO raw_materials (tenant_id, name, unit_id, description, status) VALUES
-- Çiçekler (Dal - unit_id: 2)
(1, 'Kırmızı Gül', 2, 'Premium kalite kırmızı gül', 'active'),
(1, 'Beyaz Gül', 2, 'Premium kalite beyaz gül', 'active'),
(1, 'Pembe Gül', 2, 'Premium kalite pembe gül', 'active'),
(1, 'Sarı Gül', 2, 'Premium kalite sarı gül', 'active'),
(1, 'Mor Gül', 2, 'Premium kalite mor gül', 'active'),
(1, 'Turuncu Gül', 2, 'Premium kalite turuncu gül', 'active'),
(1, 'Beyaz Lilyum', 2, 'İthal lilyum', 'active'),
(1, 'Pembe Lilyum', 2, 'İthal lilyum', 'active'),
(1, 'Beyaz Orkide', 2, 'Phalaenopsis orkide', 'active'),
(1, 'Mor Orkide', 2, 'Phalaenopsis orkide', 'active'),
(1, 'Papatya', 2, 'Yerli papatya', 'active'),
(1, 'Kasımpatı', 2, 'Yerli kasımpatı', 'active'),
(1, 'Şebboy', 2, 'Yerli şebboy', 'active'),
(1, 'Gerbera', 2, 'Karışık renkli gerbera', 'active'),
(1, 'Lisyantus', 2, 'Premium lisyantus', 'active'),

-- Yeşillikler (Demet - unit_id: 3)
(1, 'Cipso', 3, 'Buket yeşilliği', 'active'),
(1, 'İtalyan Sası', 3, 'Buket yeşilliği', 'active'),
(1, 'Ökaliptus', 3, 'Aromatik yeşillik', 'active'),
(1, 'Pitos', 3, 'Dolgu yeşilliği', 'active'),
(1, 'Mersin', 3, 'Dolgu yeşilliği', 'active'),

-- Saksı ve Vazolar (Adet - unit_id: 1)
(1, 'Seramik Saksı (Küçük)', 1, '12cm çapında dekoratif saksı', 'active'),
(1, 'Seramik Saksı (Orta)', 1, '16cm çapında dekoratif saksı', 'active'),
(1, 'Seramik Saksı (Büyük)', 1, '20cm çapında dekoratif saksı', 'active'),
(1, 'Cam Vazo (Küçük)', 1, '20cm yüksekliğinde silindir vazo', 'active'),
(1, 'Cam Vazo (Orta)', 1, '25cm yüksekliğinde silindir vazo', 'active'),
(1, 'Cam Vazo (Büyük)', 1, '30cm yüksekliğinde silindir vazo', 'active'),

-- Ambalaj Malzemeleri
(1, 'Kraft Kağıt (Büyük)', 1, 'Buket ambalajı için kraft kağıt', 'active'),
(1, 'Kraft Kağıt (Orta)', 1, 'Buket ambalajı için kraft kağıt', 'active'),
(1, 'Şeffaf Naylon (Büyük)', 1, 'Buket ambalajı', 'active'),
(1, 'Şeffaf Naylon (Orta)', 1, 'Buket ambalajı', 'active'),
(1, 'Kurdele (Kırmızı)', 6, 'Saten kurdele', 'active'),
(1, 'Kurdele (Pembe)', 6, 'Saten kurdele', 'active'),
(1, 'Kurdele (Beyaz)', 6, 'Saten kurdele', 'active'),
(1, 'Kurdele (Mor)', 6, 'Saten kurdele', 'active');

-- Products (Ürünler) - Örnek ürünler
INSERT INTO products (tenant_id, category_id, name, description, base_price, status) VALUES
-- Buketler (category_id: 1)
(1, 1, 'Kırmızı Gül Buketi (12 Dal)', '12 adet kırmızı gül ile hazırlanmış buket', 399.90, 'active'),
(1, 1, 'Renkli Kır Çiçekleri Buketi', 'Mevsim çiçeklerinden hazırlanmış renkli buket', 299.90, 'active'),
(1, 1, 'Premium Gül & Lilyum Buketi', 'Güller ve lilyumlarla hazırlanmış özel buket', 599.90, 'active'),

-- Aranjmanlar (category_id: 2)
(1, 2, 'Cam Vazoda Renkli Güller', 'Renkli güllerle hazırlanmış vazo aranjmanı', 449.90, 'active'),
(1, 2, 'Seramik Saksıda Papatyalar', 'Beyaz papatyalarla hazırlanmış aranjman', 349.90, 'active'),
(1, 2, 'Lüks Orkide Aranjmanı', '2 dallı beyaz orkide özel tasarım', 799.90, 'active'),

-- Saksı Çiçekleri (category_id: 3)
(1, 3, 'Beyaz Orkide (2 Dallı)', 'Seramik saksıda 2 dallı beyaz orkide', 699.90, 'active'),
(1, 3, 'Mor Orkide (Çift Dallı)', 'Seramik saksıda 2 dallı mor orkide', 699.90, 'active'),
(1, 3, 'Benjamin Saksı Bitkisi', 'Dekoratif saksıda benjamin bitkisi', 449.90, 'active');

-- Reçeteler (Recipes) - Örnek reçeteler
INSERT INTO recipes (tenant_id, product_id, name, labor_cost, preparation_time, instructions) VALUES
(1, 1, 'Kırmızı Gül Buketi (12 Dal) - Standart', 50.00, 15, 'Gülleri spiral şeklinde dizin, yeşilliklerle destekleyin.'),
(1, 2, 'Renkli Kır Çiçekleri Buketi - Standart', 40.00, 20, 'Çiçekleri boylarına göre yerleştirin, simetrik olmasına dikkat edin.'),
(1, 3, 'Premium Gül & Lilyum Buketi - Standart', 60.00, 25, 'Lilyumları merkeze, gülleri çevresine yerleştirin.');

-- Reçete Malzemeleri (Recipe Items)
INSERT INTO recipe_items (recipe_id, material_id, quantity, unit_id) VALUES
-- Kırmızı Gül Buketi Reçetesi
(1, 1, 12, 2),    -- 12 dal kırmızı gül
(1, 16, 1, 3),    -- 1 demet cipso
(1, 27, 1, 1),    -- 1 adet kraft kağıt (büyük)
(1, 31, 2, 6),    -- 2 metre kırmızı kurdele

-- Renkli Kır Çiçekleri Buketi Reçetesi
(2, 11, 10, 2),   -- 10 dal papatya
(2, 14, 5, 2),    -- 5 dal gerbera
(2, 16, 1, 3),    -- 1 demet cipso
(2, 28, 1, 1),    -- 1 adet kraft kağıt (orta)
(2, 32, 1.5, 6),  -- 1.5 metre pembe kurdele

-- Premium Gül & Lilyum Buketi Reçetesi
(3, 1, 8, 2),     -- 8 dal kırmızı gül
(3, 7, 3, 2),     -- 3 dal beyaz lilyum
(3, 16, 1, 3),    -- 1 demet cipso
(3, 18, 1, 3),    -- 1 demet ökaliptus
(3, 27, 1, 1),    -- 1 adet kraft kağıt (büyük)
(3, 31, 2, 6);    -- 2 metre kırmızı kurdele
