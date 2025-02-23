-- Önce test müşterileri ekleyelim
INSERT INTO customers (tenant_id, name, phone, email) VALUES
(1, 'Ayşe Yılmaz', '5551234567', 'ayse@email.com'),
(1, 'Mehmet Demir', '5552345678', 'mehmet@email.com'),
(1, 'Fatma Kaya', '5553456789', 'fatma@email.com'),
(1, 'Ali Öztürk', '5554567890', 'ali@email.com');

-- Alıcılar
INSERT INTO recipients (tenant_id, customer_id, name, phone, relationship) VALUES
(1, 1, 'Zeynep Yılmaz', '5551112233', 'Anne'),
(1, 2, 'Ahmet Demir', '5552223344', 'Baba'),
(1, 3, 'Selin Kaya', '5553334455', 'Eş'),
(1, 4, 'Berk Öztürk', '5554445566', 'Kardeş');

-- Adresler
INSERT INTO addresses (tenant_id, customer_id, recipient_id, district, label, neighborhood) VALUES
(1, 1, 1, 'Kadıköy', 'Ev Adresi', 'Caferağa'),
(1, 2, 2, 'Beşiktaş', 'İş Adresi', 'Levent'),
(1, 3, 3, 'Şişli', 'Ev Adresi', 'Mecidiyeköy'),
(1, 4, 4, 'Üsküdar', 'Ev Adresi', 'Acıbadem');

-- Örnek siparişler
INSERT INTO orders (
    tenant_id, customer_id, recipient_id, address_id,
    delivery_date, delivery_time, status,
    subtotal, delivery_fee, total_amount,
    payment_method, payment_status,
    custom_card_message, created_by
) VALUES
-- Bugünkü siparişler
(1, 1, 1, 1, date('now'), 'morning', 'new', 
 299.90, 30.00, 329.90, 'credit_card', 'paid', 
 'İyi ki doğdun anneciğim!', 1),

(1, 2, 2, 2, date('now'), 'afternoon', 'preparing', 
 449.90, 30.00, 479.90, 'cash', 'pending', 
 'Doğum günün kutlu olsun!', 1),

(1, 3, 3, 3, date('now'), 'evening', 'delivering', 
 599.90, 30.00, 629.90, 'credit_card', 'paid', 
 'Nice yıllara!', 1),

-- Yarınki siparişler
(1, 4, 4, 4, date('now', '+1 day'), 'morning', 'confirmed', 
 399.90, 30.00, 429.90, 'bank_transfer', 'paid', 
 'Mutlu yıllar!', 1),

(1, 1, 1, 1, date('now', '+1 day'), 'afternoon', 'new', 
 349.90, 30.00, 379.90, 'credit_card', 'pending', 
 'Geçmiş olsun!', 1),

-- Dünkü tamamlanmış siparişler
(1, 2, 2, 2, date('now', '-1 day'), 'morning', 'delivered', 
 299.90, 30.00, 329.90, 'cash', 'paid', 
 'Tebrikler!', 1),

(1, 3, 3, 3, date('now', '-1 day'), 'afternoon', 'delivered', 
 449.90, 30.00, 479.90, 'credit_card', 'paid', 
 'Mutluluklar!', 1),

-- Gelecek siparişler
(1, 4, 4, 4, date('now', '+2 days'), 'morning', 'new', 
 599.90, 30.00, 629.90, 'credit_card', 'pending', 
 'Başarılar!', 1),

(1, 1, 1, 1, date('now', '+3 days'), 'afternoon', 'new', 
 349.90, 30.00, 379.90, 'bank_transfer', 'pending', 
 'Sevgilerle!', 1),

(1, 2, 2, 2, date('now', '+4 days'), 'evening', 'new', 
 399.90, 30.00, 429.90, 'credit_card', 'pending', 
 'İyi ki varsın!', 1);

-- Sipariş kalemleri
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) 
SELECT 
    o.id,                     -- Sipariş ID
    1,                        -- Ürün ID (varsayılan olarak 1)
    1,                        -- Miktar
    o.subtotal,              -- Birim fiyat
    o.subtotal               -- Toplam fiyat
FROM orders o;
