
-- Örnek ürün kategorileri
INSERT INTO product_categories (tenant_id, name, description) VALUES
(1, 'Buketler', 'Gül, papatya ve karışık çiçek buketleri'),
(1, 'Aranjmanlar', 'Özel tasarım çiçek aranjmanları'),
(1, 'Orkideler', 'Tekli ve çoklu orkide çeşitleri'),
(1, 'Kutlama/Açılış', 'Kutlama ve açılış çiçekleri');

-- Örnek ürünler
INSERT INTO products (
    tenant_id, category_id, name, description, base_price, 
    status, created_at
) VALUES
-- Buketler
(1, 1, 'Kırmızı Gül Buketi', '11 adet kırmızı gül buketi', 450.00, 'active', datetime('now')),
(1, 1, 'Renkli Papatya Buketi', 'Renkli papatyalardan buket', 140.00, 'active', datetime('now')),
(1, 1, 'Karışık Mevsim Buketi', 'Mevsim çiçeklerinden buket', 280.00, 'active', datetime('now')),

-- Aranjmanlar
(1, 2, 'Lüks Aranjman', 'Özel tasarım lüks aranjman', 750.00, 'active', datetime('now')),
(1, 2, 'Kutlama Aranjmanı', 'Açılış/Kutlama için özel aranjman', 600.00, 'active', datetime('now')),

-- Orkideler
(1, 3, 'Çift Dallı Orkide', '2 dallı beyaz orkide', 320.00, 'active', datetime('now')),
(1, 3, 'Mor Orkide', 'Tek dallı mor orkide', 280.00, 'active', datetime('now'));
