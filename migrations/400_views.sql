-- Önce mevcut view'ları drop edelim
DROP VIEW IF EXISTS vw_customers;
DROP VIEW IF EXISTS vw_customer_orders;
DROP VIEW IF EXISTS vw_customer_addresses;

-- Müşteri listesi için ana view
CREATE VIEW vw_customers AS
SELECT 
    c.*,
    COALESCE((SELECT COUNT(*) 
              FROM orders o 
              WHERE o.customer_id = c.id 
              AND o.tenant_id = c.tenant_id 
              AND o.deleted_at IS NULL), 0) as total_orders,
    (SELECT created_at 
     FROM orders o 
     WHERE o.customer_id = c.id 
     AND o.tenant_id = c.tenant_id 
     AND o.deleted_at IS NULL 
     ORDER BY created_at DESC LIMIT 1) as last_order,
    COALESCE((SELECT SUM(total_amount) 
              FROM orders o 
              WHERE o.customer_id = c.id 
              AND o.tenant_id = c.tenant_id 
              AND o.deleted_at IS NULL), 0) as total_spent,
    COALESCE((SELECT COUNT(*) 
              FROM addresses a 
              WHERE a.customer_id = c.id 
              AND a.tenant_id = c.tenant_id 
              AND a.deleted_at IS NULL), 0) as address_count
FROM customers c
WHERE c.deleted_at IS NULL;

-- Müşteri siparişleri listesi view
CREATE VIEW vw_customer_orders AS
SELECT 
    o.*,
    (
        SELECT GROUP_CONCAT(
            oi.quantity || 'x ' || COALESCE(p.name, 'Silinmiş Ürün')
        )
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = o.id
        AND oi.deleted_at IS NULL
    ) as items,
    c.name as customer_name,
    c.phone as customer_phone,
    r.name as recipient_name,
    r.phone as recipient_phone,
    a.district,
    a.label as delivery_address
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN recipients r ON o.recipient_id = r.id
JOIN addresses a ON o.address_id = a.id
WHERE o.deleted_at IS NULL;

-- Müşteri adres listesi view
CREATE VIEW vw_customer_addresses AS
SELECT 
    a.*,
    r.name as recipient_name,
    r.phone as recipient_phone,
    COUNT(o.id) as times_used
FROM addresses a
LEFT JOIN recipients r ON a.recipient_id = r.id
LEFT JOIN orders o ON o.address_id = a.id AND o.deleted_at IS NULL
WHERE a.deleted_at IS NULL
GROUP BY a.id;

-- Ürün listesi için ana view
CREATE VIEW vw_products AS
SELECT 
    p.*,
    pc.name as category_name,
    COALESCE(
        (SELECT SUM(quantity)
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE oi.product_id = p.id 
         AND o.tenant_id = p.tenant_id
         AND o.status IN ('new', 'confirmed', 'preparing')
         AND o.deleted_at IS NULL
        ), 0
    ) as reserved_quantity,
    COALESCE(
        (SELECT COUNT(*) 
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         WHERE oi.product_id = p.id
         AND o.tenant_id = p.tenant_id
         AND o.deleted_at IS NULL
        ), 0
    ) as total_orders,
    COALESCE(
        (SELECT COUNT(DISTINCT r.id)
         FROM recipes r
         WHERE r.product_id = p.id
         AND r.tenant_id = p.tenant_id
         AND r.deleted_at IS NULL
        ), 0
    ) as recipe_count
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE p.deleted_at IS NULL;

-- Ürün reçeteleri view
CREATE VIEW vw_product_recipes AS
SELECT 
    r.*,
    p.name as product_name,
    p.base_price as product_price,
    COUNT(ri.id) as material_count,
    COALESCE(
        (SELECT COUNT(*)
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE oi.recipe_data = r.id
         AND o.deleted_at IS NULL
        ), 0
    ) as usage_count
FROM recipes r
JOIN products p ON r.product_id = p.id
LEFT JOIN recipe_items ri ON r.id = ri.recipe_id
WHERE r.deleted_at IS NULL
GROUP BY r.id;

-- Kategori bazlı ürün özeti view
CREATE VIEW vw_category_products AS
SELECT 
    pc.id as category_id,
    pc.name as category_name,
    pc.tenant_id,
    COUNT(p.id) as product_count,
    COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_products,
    MIN(p.base_price) as min_price,
    MAX(p.base_price) as max_price,
    COUNT(DISTINCT r.id) as total_recipes
FROM product_categories pc
LEFT JOIN products p ON pc.id = p.category_id AND p.deleted_at IS NULL
LEFT JOIN recipes r ON p.id = r.product_id AND r.deleted_at IS NULL
WHERE pc.deleted_at IS NULL
GROUP BY pc.id;
