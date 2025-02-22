DROP VIEW IF EXISTS vw_deliveries;
CREATE VIEW vw_deliveries AS
SELECT 
    o.*,
    c.name as customer_name,
    c.phone as customer_phone,
    r.name as recipient_name,
    r.phone as recipient_phone,
    a.district,
    a.label as delivery_address,
    a.lat,
    a.lng,
    a.directions
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN recipients r ON o.recipient_id = r.id
JOIN addresses a ON o.address_id = a.id
WHERE o.deleted_at IS NULL 
AND o.delivery_date >= CURRENT_DATE
AND o.status NOT IN ('delivered', 'cancelled');
