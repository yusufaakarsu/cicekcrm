
-- Tenant 1 için örnek siparişler
INSERT INTO orders (
    tenant_id, customer_id, recipient_id, address_id,
    delivery_date, delivery_time,
    status, payment_method, payment_status,
    subtotal, delivery_fee, total_amount,
    custom_card_message, customer_notes,
    created_by, created_at
) VALUES
-- Bugünkü siparişler
(1, 1, 1, 1, date('now'), 'morning', 
 'preparing', 'credit_card', 'paid',
 450.00, 30.00, 480.00,
 'Doğum günün kutlu olsun canım eşim', 'Pembe kurdele olsun',
 1, datetime('now', '-3 hours')),

(1, 2, 2, 3, date('now'), 'afternoon',
 'confirmed', 'cash', 'pending', 
 280.00, 25.00, 305.00,
 'İyi ki varsın anneciğim', NULL,
 1, datetime('now', '-2 hours')),

-- Yarınki siparişler 
(1, 3, 4, 4, date('now', '+1 day'), 'morning',
 'new', 'credit_card', 'paid',
 750.00, 0.00, 750.00,
 'Geçmiş olsun dileklerimizle', 'Hastane odasına teslim',
 1, datetime('now', '-1 day')),

(1, 4, 5, 5, date('now', '+1 day'), 'afternoon',
 'new', 'bank_transfer', 'pending',
 1200.00, 0.00, 1200.00,
 'Yeni ofisiniz hayırlı olsun', 'Resepsiyona teslim',
 1, datetime('now', '-5 hours')),

-- Geçmiş siparişler
(1, 5, 5, 6, date('now', '-1 day'), 'morning',
 'delivered', 'cash', 'paid',
 320.00, 30.00, 350.00,
 'Nice yıllara', NULL,
 1, datetime('now', '-1 day')),

(1, 1, 1, 2, date('now', '-2 day'), 'evening',
 'delivered', 'credit_card', 'paid',
 550.00, 0.00, 550.00,
 'Sevgililer günün kutlu olsun', NULL,
 1, datetime('now', '-2 days'));

-- Sipariş kalemleri
INSERT INTO order_items (
    order_id, product_id, quantity, unit_price, total_price, customization_notes
) VALUES
-- Bugünkü 1. sipariş
(1, 1, 1, 450.00, 450.00, 'Kırmızı güller kullanılsın'),

-- Bugünkü 2. sipariş
(2, 2, 2, 140.00, 280.00, 'Beyaz orkideler tercih edilsin'),

-- Yarınki 1. sipariş (büyük aranjman)
(3, 3, 1, 750.00, 750.00, 'Canlı renkler kullanılsın'),

-- Yarınki 2. sipariş (ofis açılışı için)
(4, 4, 2, 600.00, 1200.00, 'Kurumsal renkler tercih edilsin'),

-- Geçmiş sipariş 1
(5, 5, 1, 320.00, 320.00, NULL),

-- Geçmiş sipariş 2
(6, 1, 1, 550.00, 550.00, 'Ekstra kırmızı gül eklensin');
