WITH RECURSIVE dates(date) AS (
  SELECT date('now', '-30 days')
  UNION ALL
  SELECT date(date, '+1 day')
  FROM dates
  WHERE date < date('now', '+30 days')
)
INSERT INTO orders (
    tenant_id, customer_id, delivery_address_id,
    status, delivery_date, delivery_time_slot,
    recipient_name, recipient_phone,
    subtotal, delivery_fee, total_amount,
    payment_method, payment_status, source
) 
SELECT
    1, -- tenant_id
    ABS(RANDOM() % 15) + 1, -- customer_id (1-15 arası)
    (SELECT id FROM addresses WHERE customer_id = ABS(RANDOM() % 15) + 1 LIMIT 1),
    CASE 
        WHEN d.date < date('now') THEN 'delivered'
        WHEN d.date = date('now') THEN 'preparing'
        ELSE 'new'
    END,
    d.date,
    CASE ABS(RANDOM() % 3)
        WHEN 0 THEN 'morning'
        WHEN 1 THEN 'afternoon'
        ELSE 'evening'
    END,
    (SELECT name FROM customers WHERE id = ABS(RANDOM() % 15) + 1),
    (SELECT phone FROM customers WHERE id = ABS(RANDOM() % 15) + 1),
    CAST(ABS(RANDOM() % 800) + 200 AS REAL),
    50,
    CAST(ABS(RANDOM() % 800) + 250 AS REAL),
    CASE ABS(RANDOM() % 3)
        WHEN 0 THEN 'cash'
        WHEN 1 THEN 'credit_card'
        ELSE 'bank_transfer'
    END,
    'paid',
    CASE ABS(RANDOM() % 4)
        WHEN 0 THEN 'web'
        WHEN 1 THEN 'phone'
        WHEN 2 THEN 'app'    -- mobile yerine app kullanıyoruz
        ELSE 'store'
    END
FROM dates d
CROSS JOIN (SELECT 1 AS x UNION SELECT 2 UNION SELECT 3) t -- Her gün için 3 sipariş
ORDER BY d.date;

-- Her sipariş için rastgele ürünler ekle
INSERT INTO order_items (
    order_id, product_id, quantity, unit_price, total_price, cost_price
)
SELECT 
    o.id,
    p.id,
    ABS(RANDOM() % 5) + 1,
    p.retail_price,
    (ABS(RANDOM() % 5) + 1) * p.retail_price,
    p.purchase_price
FROM orders o
CROSS JOIN (
    SELECT id, retail_price, purchase_price 
    FROM products 
    WHERE is_active = 1 
    ORDER BY RANDOM() 
    LIMIT ABS(RANDOM() % 3) + 1
) p;
