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
