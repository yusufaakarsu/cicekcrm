DROP VIEW IF EXISTS vw_orders;
CREATE VIEW vw_orders AS
SELECT 
    o.*,
    c.name as customer_name,
    c.phone as customer_phone,
    r.name as recipient_name,
    r.phone as recipient_phone,
    a.district,
    a.label as delivery_address,
    (
        SELECT GROUP_CONCAT(
            oi.quantity || 'x ' || p.name
        )
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = o.id AND oi.deleted_at IS NULL
    ) as items_summary
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN recipients r ON o.recipient_id = r.id
JOIN addresses a ON o.address_id = a.id
WHERE o.deleted_at IS NULL;
