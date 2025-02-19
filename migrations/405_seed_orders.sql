-- Son 30 gün ve gelecek 30 gün için siparişler (toplam 60 gün x 30 sipariş = 1800 sipariş)
WITH RECURSIVE dates(date) AS (
  SELECT date('now', '-30 days')
  UNION ALL
  SELECT date(date, '+1 day')
  FROM dates
  WHERE date < date('now', '+30 days')
)
INSERT INTO orders (
    tenant_id, customer_id, delivery_address_id, status, 
    delivery_date, delivery_time_slot,
    recipient_name, recipient_phone, recipient_note, card_message,
    subtotal, delivery_fee, total_amount,
    payment_method, payment_status, source, created_by, created_at,
    delivery_region_id
) 
SELECT
    1, -- tenant_id
    ABS(RANDOM() % 30) + 1, -- customer_id (1-30 arası)
    (SELECT id FROM addresses WHERE customer_id = (ABS(RANDOM() % 30) + 1) LIMIT 1), -- gerçek adres
    CASE 
        WHEN d.date < date('now') THEN 'delivered'
        WHEN d.date = date('now') THEN 
            CASE ABS(RANDOM() % 4)
                WHEN 0 THEN 'preparing'
                WHEN 1 THEN 'ready'
                WHEN 2 THEN 'delivering'
                ELSE 'delivered'
            END
        ELSE 'new'
    END,
    d.date,
    CASE ABS(RANDOM() % 3)
        WHEN 0 THEN 'morning'
        WHEN 1 THEN 'afternoon'
        ELSE 'evening'
    END,
    (SELECT name FROM customers WHERE id = (ABS(RANDOM() % 30) + 1)), -- gerçek müşteri adı
    (SELECT phone FROM customers WHERE id = (ABS(RANDOM() % 30) + 1)), -- gerçek müşteri telefonu
    CASE ABS(RANDOM() % 5) 
        WHEN 0 THEN 'Lütfen dikkatli taşıyın'
        WHEN 1 THEN 'Kapıda arayın'
        WHEN 2 THEN 'Binada asansör var'
        WHEN 3 THEN 'Site güvenliğine bırakılabilir'
        ELSE NULL
    END,
    CASE ABS(RANDOM() % 6)
        WHEN 0 THEN 'İyi ki doğdun!'
        WHEN 1 THEN 'Seni seviyorum!'
        WHEN 2 THEN 'Mutlu yıllar!'
        WHEN 3 THEN 'Nice mutlu senelere'
        WHEN 4 THEN 'Geçmiş olsun'
        ELSE NULL
    END,
    CAST(ABS(RANDOM() % 800) + 200 AS REAL), -- 200-1000 TL arası
    CASE (SELECT district FROM addresses WHERE id = delivery_address_id)
        WHEN 'Kadıköy' THEN 50
        WHEN 'Üsküdar' THEN 50
        WHEN 'Ataşehir' THEN 60
        ELSE 70
    END,
    CAST(ABS(RANDOM() % 800) + 250 + delivery_fee AS REAL),
    CASE ABS(RANDOM() % 4)
        WHEN 0 THEN 'cash'
        WHEN 1 THEN 'credit_card'
        WHEN 2 THEN 'bank_transfer'
        ELSE 'credit_card'
    END,
    CASE 
        WHEN d.date < date('now') THEN 'paid'
        ELSE CASE ABS(RANDOM() % 5)
            WHEN 0 THEN 'pending'
            ELSE 'paid'
        END
    END,
    CASE ABS(RANDOM() % 5)
        WHEN 0 THEN 'web'
        WHEN 1 THEN 'phone'
        WHEN 2 THEN 'mobile'
        ELSE 'store'
    END,
    ABS(RANDOM() % 3) + 1,
    datetime(d.date, 
        (CASE ABS(RANDOM() % 24)
            WHEN 0 THEN '09:00'
            WHEN 1 THEN '10:00'
            WHEN 2 THEN '11:00'
            WHEN 3 THEN '12:00'
            WHEN 4 THEN '13:00'
            WHEN 5 THEN '14:00'
            WHEN 6 THEN '15:00'
            WHEN 7 THEN '16:00'
            ELSE '17:00'
        END)
    ),
    (SELECT id FROM delivery_regions WHERE district = (
        SELECT district FROM addresses WHERE id = delivery_address_id
    ) LIMIT 1)
FROM dates d
CROSS JOIN (SELECT 1 AS x UNION ALL SELECT 2 UNION ALL SELECT 3) t1
CROSS JOIN (SELECT 1 AS x UNION ALL SELECT 2 UNION ALL SELECT 3) t2
CROSS JOIN (SELECT 1 AS x UNION ALL SELECT 2 UNION ALL SELECT 3) t3
ORDER BY d.date;

-- Her sipariş için 1-3 arası ürün ekle
INSERT INTO order_items (
    order_id, product_id, quantity, unit_price, total_price, cost_price
)
SELECT 
    o.id,
    p.id,
    CASE 
        WHEN p.type_id IN (1,5) THEN ABS(RANDOM() % 10) + 1  -- tek çiçek/malzeme: 1-10 adet
        WHEN p.type_id = 2 THEN ABS(RANDOM() % 2) + 1        -- buket: 1-2 adet
        ELSE 1                                                -- diğer: 1 adet
    END as quantity,
    p.retail_price,
    quantity * p.retail_price,
    p.purchase_price
FROM orders o
CROSS JOIN (
    SELECT id, type_id FROM products 
    WHERE is_active = 1 
    ORDER BY RANDOM() 
    LIMIT ABS(RANDOM() % 3) + 1  -- Her sipariş için 1-3 ürün
) p
ORDER BY o.id;

-- Reçeteli ürünler için order_recipes ekle
INSERT INTO order_recipes (
    order_item_id, recipe_id, base_cost, total_cost
)
SELECT 
    oi.id,
    r.id,
    r.base_cost,
    r.base_cost + (SELECT SUM(ri.quantity * p.purchase_price)
                   FROM recipe_items ri
                   JOIN products p ON ri.component_id = p.id
                   WHERE ri.recipe_id = r.id)
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN recipes r ON p.id = r.product_id
WHERE p.is_recipe = 1;
