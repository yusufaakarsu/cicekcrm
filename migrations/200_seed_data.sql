-- Core System Data
--------------------------------------------------------------------------------
-- 1. Tenant
INSERT INTO tenants (id, name, company_name, contact_email, logo_url, primary_color) VALUES 
(1, 'Shirin Flower', 'Shirin Çiçekçilik Ltd. Şti.', 'info@shirinflower.com', 'https://shirinflower.com/logo.png', '#FF69B4');

-- 2. Users (password_hash'ler gerçek uygulamada hash'lenmiş olmalı)
INSERT INTO users (tenant_id, email, password_hash, name, role, is_active) VALUES
(1, 'yusufaakarsu@gmail.com', 'hash123', 'Yusuf Akarsu', 'admin', 1),
(1, 'aktasshilall@outlook.com', 'hash456', 'Hilal Akarsu', 'admin', 1),
(1, 'humeyraktas@gmail.com', 'hash789', 'Hümeyra Aktaş', 'admin', 1);

-- 3. Tedarikçiler
INSERT INTO suppliers (
    tenant_id, name, contact_name, phone, email, tax_number, address, notes, status
) VALUES
(1, 'Anadolu Çiçekçilik', 'Mehmet Yılmaz', '05321234567', 'info@anadoluflower.com', '1234567890', 
 'Çiçekçiler Hali No:123 İstanbul', 'Toptan kesme çiçek tedarikçisi', 'active'),

(1, 'Flora Ambalaj', 'Ayşe Demir', '0533987654', 'satis@floraambalaj.com', '9876543210', 
 'Sanayi Sitesi B Blok No:45 İstanbul', 'Ambalaj malzemeleri tedarikçisi', 'active'),

(1, 'Yeşil Aksesuar', 'Ali Kaya', '0535246813', 'info@yesilaksesuar.com', '4567891230', 
 'Çiçekçiler Çarşısı No:78 İstanbul', 'Çiçekçilik aksesuarları tedarikçisi', 'active');

-- 4. Müşteriler
INSERT INTO customers (
    tenant_id, name, phone, email, notes
) VALUES
(1, 'Fatma Yıldız', '0542123456', 'fatma.yildiz@gmail.com', 'VIP müşteri, kırmızı gül tercih eder'),
(1, 'Ahmet Kara', '0543234567', 'ahmet.k@outlook.com', 'Düzenli kurumsal müşteri'),
(1, 'Zeynep Ak', '0544345678', 'zeynep@gmail.com', 'Ayda bir buket siparişi verir');

-- 5. Alıcılar
INSERT INTO recipients (
    tenant_id, customer_id, name, phone, relationship, notes, special_dates, preferences
) VALUES
(1, 1, 'Ayşe Yıldız', '0552345678', 'anne', 'Kapıcıya haber verilmeli',
    '{"birthday": "05-15", "mothers_day": "05-14"}',
    '{"flower": "kırmızı gül", "color": "kırmızı", "allergens": ["zambak"]}'
),
(1, 2, 'Teknik A.Ş.', '0212876543', 'şirket', 'Resepsiyona teslim edilmeli',
    '{"company_anniversary": "03-20"}',
    '{"style": "modern", "type": "ofis çiçekleri"}'
),
(1, 3, 'Mehmet Ak', '0553456789', 'eş', 'Sürpriz teslimat',
    '{"anniversary": "08-12", "birthday": "11-23"}',
    '{"flower": "orkide", "color": "beyaz"}');

-- 6. Adresler
INSERT INTO addresses (
    tenant_id, customer_id, recipient_id, 
    here_place_id, label, district, neighborhood, street,
    lat, lng, building_no, floor_no, door_no, directions
) VALUES
(1, 1, 1, 'here123', 'Bağdat Caddesi No:123', 'Kadıköy', 'Suadiye', 'Bağdat Caddesi',
 40.962189, 29.071634, '123', '4', '8', 'Starbucks yanındaki bina'),

(1, 2, 2, 'here456', 'Büyükdere Caddesi No:456', 'Şişli', 'Levent', 'Büyükdere Caddesi',
 41.082707, 29.009706, '456', '12', null, 'Plaza B Blok'),

(1, 3, 3, 'here789', 'Acıbadem Mahallesi No:789', 'Üsküdar', 'Acıbadem', 'Şair Arşi Caddesi',
 41.004957, 29.045298, '789', '2', '5', 'Acıbadem Hastanesi karşısı');

-- 7. İlk bakiyeler
INSERT INTO transactions (
    tenant_id, account_id, category_id, type, amount, date,
    related_type, related_id, payment_method, description, status, created_by
) VALUES
(1, 
   (SELECT id FROM accounts WHERE tenant_id = 1 AND type = 'cash' LIMIT 1),
   (SELECT id FROM transaction_categories WHERE tenant_id = 1 AND reporting_code = 'CASH_OPEN' LIMIT 1),
   'in', 10000, CURRENT_TIMESTAMP, 'balance', 1, 'cash', 'İlk kasa açılış bakiyesi',
   'completed', 1);

-- Ham maddeler
INSERT INTO raw_materials (tenant_id, name, unit_id, category_id, description) VALUES
-- Kesme Çiçekler
(1, 'Kırmızı Gül', (SELECT id FROM units WHERE code='DAL' AND tenant_id=1), 
   (SELECT id FROM raw_material_categories WHERE name='Kesme Çiçekler' AND tenant_id=1),
   'Yerli kırmızı gül'),
(1, 'Beyaz Lilyum', (SELECT id FROM units WHERE code='DAL' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='Kesme Çiçekler' AND tenant_id=1),
   'Yerli beyaz lilyum'),
(1, 'Pembe Şakayık', (SELECT id FROM units WHERE code='DAL' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='Kesme Çiçekler' AND tenant_id=1),
   'Yerli pembe şakayık'),

-- İthal Çiçekler
(1, 'Mor Orkide', (SELECT id FROM units WHERE code='DAL' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='İthal Çiçekler' AND tenant_id=1),
   'İthal mor orkide'),
(1, 'Renkli Ranunculus', (SELECT id FROM units WHERE code='DEMET' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='İthal Çiçekler' AND tenant_id=1),
   'İthal karışık ranunculus'),

-- Yeşillikler
(1, 'Okaliptus', (SELECT id FROM units WHERE code='DAL' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='Yeşillikler' AND tenant_id=1),
   'Yeşil okaliptus dalı'),
(1, 'İtalyan Yeşili', (SELECT id FROM units WHERE code='DEMET' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='Yeşillikler' AND tenant_id=1),
   'İtalyan yeşili demet'),
(1, 'Pitos', (SELECT id FROM units WHERE code='DAL' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='Yeşillikler' AND tenant_id=1),
   'Pitos dalı'),

-- Kutular
(1, 'Silindir Kutu Siyah', (SELECT id FROM units WHERE code='ADET' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='Kutular' AND tenant_id=1),
   'Siyah silindir çiçek kutusu - medium'),
(1, 'Kare Kutu Beyaz', (SELECT id FROM units WHERE code='ADET' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='Kutular' AND tenant_id=1),
   'Beyaz kare çiçek kutusu - large'),

-- Vazolar
(1, 'Cam Silindir Vazo', (SELECT id FROM units WHERE code='ADET' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='Vazolar' AND tenant_id=1),
   '25cm şeffaf cam vazo'),
(1, 'Seramik Vazo Beyaz', (SELECT id FROM units WHERE code='ADET' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='Vazolar' AND tenant_id=1),
   'Beyaz seramik vazo - medium'),

-- Kurdeleler
(1, 'Saten Kurdele Kırmızı', (SELECT id FROM units WHERE code='METRE' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='Kurdeleler' AND tenant_id=1),
   '5cm genişlik kırmızı saten kurdele'),
(1, 'Organze Kurdele Beyaz', (SELECT id FROM units WHERE code='METRE' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='Kurdeleler' AND tenant_id=1),
   '3cm genişlik beyaz organze kurdele'),

-- Spreyler
(1, 'Yaprak Parlatıcı', (SELECT id FROM units WHERE code='ADET' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='Spreyler' AND tenant_id=1),
   '500ml yaprak parlatıcı sprey'),
(1, 'Çiçek Koruyucu', (SELECT id FROM units WHERE code='ADET' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='Spreyler' AND tenant_id=1),
   '250ml çiçek koruyucu sprey'),

-- Aksesuarlar
(1, 'Kartvizitlik', (SELECT id FROM units WHERE code='ADET' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='Aksesuarlar' AND tenant_id=1),
   'Plastik kartvizitlik'),
(1, 'Su Süngeri', (SELECT id FROM units WHERE code='ADET' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='Aksesuarlar' AND tenant_id=1),
   'Yeşil çiçek süngeri'),

-- Topraklar
(1, 'Orkide Toprağı', (SELECT id FROM units WHERE code='PAKET' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='Topraklar' AND tenant_id=1),
   '1kg orkide toprağı'),
(1, 'Saksı Toprağı', (SELECT id FROM units WHERE code='PAKET' AND tenant_id=1),
   (SELECT id FROM raw_material_categories WHERE name='Topraklar' AND tenant_id=1),
   '2kg genel kullanım toprağı');

-- Önce ürünleri ekleyelim
INSERT INTO products (tenant_id, category_id, name, description, base_price, status) VALUES 
(1, (SELECT id FROM product_categories WHERE tenant_id=1 AND name='Buketler'), 
   'Kırmızı Gül Buketi', '12 adet kırmızı gül buketi', 750, 'active'),
(1, (SELECT id FROM product_categories WHERE tenant_id=1 AND name='Buketler'),
   'Mevsim Buketi', 'Mevsim çiçeklerinden karma buket', 550, 'active'),
(1, (SELECT id FROM product_categories WHERE tenant_id=1 AND name='Kutuda Çiçekler'),
   'Siyah Kutuda Güller', 'Silindir kutuda 20 kırmızı gül', 1200, 'active'),
(1, (SELECT id FROM product_categories WHERE tenant_id=1 AND name='Kutuda Çiçekler'),
   'Beyaz Kutuda Karışık', 'Kare kutuda mevsim çiçekleri', 850, 'active'),
(1, (SELECT id FROM product_categories WHERE tenant_id=1 AND name='Vazoda Çiçekler'),
   'Cam Vazoda Lilyum', 'Cam vazoda beyaz lilyumlar', 650, 'active'),
(1, (SELECT id FROM product_categories WHERE tenant_id=1 AND name='Vazoda Çiçekler'),
   'Seramik Vazoda Orkide', 'Beyaz seramik vazoda mor orkide', 950, 'active'),
(1, (SELECT id FROM product_categories WHERE tenant_id=1 AND name='VIP Tasarımlar'),
   'Premium Gül Kutusu', 'Özel tasarım kutuda 50 gül', 2500, 'active'),
(1, (SELECT id FROM product_categories WHERE tenant_id=1 AND name='VIP Tasarımlar'),
   'Orkide Kompozisyonu', '3 dallı mor orkide özel tasarım', 1800, 'active'),
(1, (SELECT id FROM product_categories WHERE tenant_id=1 AND name='Teraryum'),
   'Mini Teraryum', 'Cam fanus içinde mini bahçe', 450, 'active'),
(1, (SELECT id FROM product_categories WHERE tenant_id=1 AND name='Teraryum'),
   'Sukulent Teraryum', 'Sukulent bitkilerle teraryum', 400, 'active');

/* Ürün reçetelerini ekleyelim */
INSERT INTO product_materials (
    product_id, material_id, default_quantity, is_required,
    notes, created_at
) 
SELECT 
    p.id,
    m.id,
    12,
    1,
    'Standart reçete',
    CURRENT_TIMESTAMP
FROM products p
CROSS JOIN raw_materials m
WHERE p.name = 'Kırmızı Gül Buketi'
AND m.name = 'Kırmızı Gül'
AND p.tenant_id = 1;

-- Her ürün için ayrı ayrı malzemeleri ekleyelim 
INSERT INTO product_materials (
    product_id, material_id, default_quantity, is_required, 
    notes, created_at
) 
SELECT 
    p.id,
    m.id,
    CASE m.name 
        WHEN 'İtalyan Yeşili' THEN 1
        WHEN 'Saten Kurdele Kırmızı' THEN 1
    END,
    1,
    'Standart reçete',
    CURRENT_TIMESTAMP
FROM products p
CROSS JOIN raw_materials m
WHERE p.name = 'Kırmızı Gül Buketi'
AND m.name IN ('İtalyan Yeşili', 'Saten Kurdele Kırmızı')
AND p.tenant_id = 1;

-- Mevsim Buketi reçetesi
INSERT INTO product_materials (product_id, material_id, default_quantity, is_required, notes, created_at) 
SELECT 
    p.id,
    m.id,
    CASE m.name 
        WHEN 'Renkli Ranunculus' THEN 1
        WHEN 'Okaliptus' THEN 2
        WHEN 'Organze Kurdele Beyaz' THEN 1
    END,
    1,
    'Standart reçete',
    CURRENT_TIMESTAMP
FROM products p
CROSS JOIN raw_materials m
WHERE p.name = 'Mevsim Buketi'
AND m.name IN ('Renkli Ranunculus', 'Okaliptus', 'Organze Kurdele Beyaz')
AND p.tenant_id = 1;

-- Siyah Kutuda Güller reçetesi
INSERT INTO product_materials (product_id, material_id, default_quantity, is_required, notes, created_at) 
SELECT 
    p.id,
    m.id,
    CASE m.name 
        WHEN 'Kırmızı Gül' THEN 20
        WHEN 'Silindir Kutu Siyah' THEN 1
        WHEN 'Su Süngeri' THEN 2
        WHEN 'Yaprak Parlatıcı' THEN 1
    END,
    1,
    'Standart reçete',
    CURRENT_TIMESTAMP
FROM products p
CROSS JOIN raw_materials m
WHERE p.name = 'Siyah Kutuda Güller'
AND m.name IN ('Kırmızı Gül', 'Silindir Kutu Siyah', 'Su Süngeri', 'Yaprak Parlatıcı')
AND p.tenant_id = 1;

-- Beyaz Kutuda Karışık reçetesi
INSERT INTO product_materials (product_id, material_id, default_quantity, is_required, notes, created_at) 
SELECT 
    p.id,
    m.id,
    CASE m.name 
        WHEN 'Beyaz Lilyum' THEN 3
        WHEN 'Pembe Şakayık' THEN 5
        WHEN 'Kare Kutu Beyaz' THEN 1
        WHEN 'Su Süngeri' THEN 2
    END,
    1,
    'Standart reçete',
    CURRENT_TIMESTAMP
FROM products p
CROSS JOIN raw_materials m
WHERE p.name = 'Beyaz Kutuda Karışık'
AND m.name IN ('Beyaz Lilyum', 'Pembe Şakayık', 'Kare Kutu Beyaz', 'Su Süngeri')
AND p.tenant_id = 1;

-- Cam Vazoda Lilyum reçetesi
INSERT INTO product_materials (product_id, material_id, default_quantity, is_required, notes, created_at) 
SELECT 
    p.id,
    m.id,
    CASE m.name 
        WHEN 'Beyaz Lilyum' THEN 5
        WHEN 'Cam Silindir Vazo' THEN 1
        WHEN 'Okaliptus' THEN 3
    END,
    1,
    'Standart reçete',
    CURRENT_TIMESTAMP
FROM products p
CROSS JOIN raw_materials m
WHERE p.name = 'Cam Vazoda Lilyum'
AND m.name IN ('Beyaz Lilyum', 'Cam Silindir Vazo', 'Okaliptus')
AND p.tenant_id = 1;

-- Seramik Vazoda Orkide reçetesi
INSERT INTO product_materials (product_id, material_id, default_quantity, is_required, notes, created_at) 
SELECT 
    p.id,
    m.id,
    CASE m.name 
        WHEN 'Mor Orkide' THEN 1
        WHEN 'Seramik Vazo Beyaz' THEN 1
        WHEN 'Orkide Toprağı' THEN 1
    END,
    1,
    'Standart reçete',
    CURRENT_TIMESTAMP
FROM products p
CROSS JOIN raw_materials m
WHERE p.name = 'Seramik Vazoda Orkide'
AND m.name IN ('Mor Orkide', 'Seramik Vazo Beyaz', 'Orkide Toprağı')
AND p.tenant_id = 1;

-- Premium Gül Kutusu reçetesi
INSERT INTO product_materials (product_id, material_id, default_quantity, is_required, notes, created_at) 
SELECT 
    p.id,
    m.id,
    CASE m.name 
        WHEN 'Kırmızı Gül' THEN 50
        WHEN 'Silindir Kutu Siyah' THEN 2
        WHEN 'Su Süngeri' THEN 4
        WHEN 'Yaprak Parlatıcı' THEN 1
    END,
    1,
    'Standart reçete',
    CURRENT_TIMESTAMP
FROM products p
CROSS JOIN raw_materials m
WHERE p.name = 'Premium Gül Kutusu'
AND m.name IN ('Kırmızı Gül', 'Silindir Kutu Siyah', 'Su Süngeri', 'Yaprak Parlatıcı')
AND p.tenant_id = 1;

-- Orkide Kompozisyonu reçetesi
INSERT INTO product_materials (product_id, material_id, default_quantity, is_required, notes, created_at) 
SELECT 
    p.id,
    m.id,
    CASE m.name 
        WHEN 'Mor Orkide' THEN 3
        WHEN 'Seramik Vazo Beyaz' THEN 1
        WHEN 'Orkide Toprağı' THEN 2
        WHEN 'Çiçek Koruyucu' THEN 1
    END,
    1,
    'Standart reçete',
    CURRENT_TIMESTAMP
FROM products p
CROSS JOIN raw_materials m
WHERE p.name = 'Orkide Kompozisyonu'
AND m.name IN ('Mor Orkide', 'Seramik Vazo Beyaz', 'Orkide Toprağı', 'Çiçek Koruyucu')
AND p.tenant_id = 1;

-- Mini Teraryum reçetesi
INSERT INTO product_materials (product_id, material_id, default_quantity, is_required, notes, created_at) 
SELECT 
    p.id,
    m.id,
    CASE m.name 
        WHEN 'Cam Silindir Vazo' THEN 1
        WHEN 'Saksı Toprağı' THEN 1
    END,
    1,
    'Standart reçete',
    CURRENT_TIMESTAMP
FROM products p
CROSS JOIN raw_materials m
WHERE p.name = 'Mini Teraryum'
AND m.name IN ('Cam Silindir Vazo', 'Saksı Toprağı')
AND p.tenant_id = 1;

-- Sukulent Teraryum reçetesi
INSERT INTO product_materials (product_id, material_id, default_quantity, is_required, notes, created_at) 
SELECT 
    p.id,
    m.id,
    CASE m.name 
        WHEN 'Cam Silindir Vazo' THEN 1
        WHEN 'Saksı Toprağı' THEN 1
        WHEN 'Çiçek Koruyucu' THEN 1
    END,
    1,
    'Standart reçete',
    CURRENT_TIMESTAMP
FROM products p
CROSS JOIN raw_materials m
WHERE p.name = 'Sukulent Teraryum'
AND m.name IN ('Cam Silindir Vazo', 'Saksı Toprağı', 'Çiçek Koruyucu')
AND p.tenant_id = 1;

