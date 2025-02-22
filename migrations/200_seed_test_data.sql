
-- Test müşterileri
INSERT INTO customers (tenant_id, name, phone, email, notes) VALUES
(1, 'Ahmet Yılmaz', '5551234567', 'ahmet@email.com', 'VIP müşteri'),
(1, 'Ayşe Kara', '5552345678', 'ayse@email.com', NULL),
(1, 'Mehmet Demir', '5553456789', NULL, 'Düzenli sipariş verir');

-- Test alıcılar
INSERT INTO recipients (tenant_id, customer_id, name, phone, relationship, notes, special_dates) VALUES
(1, 1, 'Fatma Yılmaz', '5554567890', 'Eş', 'Çiçekleri kapıda teslim edilecek', '{"birthday": "05-15"}'),
(1, 1, 'Zeynep Yılmaz', '5555678901', 'Kız', 'Alerjisi var', '{"birthday": "08-22"}'),
(1, 2, 'Ali Kara', '5556789012', 'Eş', NULL, '{"anniversary": "06-18"}');

-- Test adresler
INSERT INTO addresses (
    tenant_id, customer_id, recipient_id, 
    district, label, neighborhood, street,
    building_no, floor_no, door_no, directions
) VALUES
(1, 1, 1, 'Kadıköy', 'Ev Adresi', 'Caddebostan', 'Bağdat Caddesi', '123', '4', '8', 'Migros yanı'),
(1, 1, 2, 'Beşiktaş', 'İş Adresi', 'Levent', 'Büyükdere Caddesi', '205', '12', '45', 'Plaza girişi'),
(1, 2, 3, 'Şişli', 'Ev Adresi', 'Nişantaşı', 'Teşvikiye Caddesi', '34', '3', '7', NULL);

-- Test siparişler
INSERT INTO orders (
    tenant_id, customer_id, recipient_id, address_id,
    delivery_date, delivery_time, status,
    subtotal, delivery_fee, total_amount,
    payment_method, payment_status,
    custom_card_message, customer_notes,
    created_by
) VALUES
(1, 1, 1, 1, date('now'), 'morning', 'new', 399.90, 50.00, 449.90, 'credit_card', 'paid', 'Mutlu yıllar!', 'Sabah erken teslimat', 1),
(1, 2, 3, 3, date('now', '+1 day'), 'afternoon', 'new', 299.90, 50.00, 349.90, 'cash', 'pending', 'İyi ki doğdun!', NULL, 1),
(1, 1, 2, 2, date('now', '+2 day'), 'evening', 'new', 599.90, 50.00, 649.90, 'credit_card', 'paid', 'Nice senelere!', NULL, 1);

-- Sipariş kalemleri
INSERT INTO order_items (
    order_id, product_id, quantity, 
    unit_price, total_price, 
    customization_notes
) VALUES
(1, 1, 1, 399.90, 399.90, 'Ekstra kurdele eklenecek'),
(2, 2, 1, 299.90, 299.90, NULL),
(3, 3, 1, 599.90, 599.90, 'Beyaz lilyum tercih edilsin');

-- Örnek stok hareketleri
INSERT INTO stock_movements (
    tenant_id, material_id, movement_type,
    quantity, source_type, source_id,
    created_by
) VALUES
(1, 1, 'in', 100, 'purchase', 1, 1),  -- Kırmızı gül stok girişi
(1, 2, 'in', 100, 'purchase', 1, 1),  -- Beyaz gül stok girişi
(1, 7, 'in', 50, 'purchase', 1, 1);   -- Lilyum stok girişi

-- Örnek satın alma siparişleri
INSERT INTO purchase_orders (
    tenant_id, supplier_id, order_date,
    expected_date, status, total_amount,
    created_by
) VALUES
(1, 1, date('now'), date('now', '+3 day'), 'ordered', 5000.00, 1);

-- Satın alma sipariş kalemleri
INSERT INTO purchase_order_items (
    order_id, material_id, quantity,
    unit_price
) VALUES
(1, 1, 100, 15.00),  -- 100 adet kırmızı gül
(1, 2, 100, 15.00),  -- 100 adet beyaz gül
(1, 7, 50, 40.00);   -- 50 adet lilyum
