DROP VIEW IF EXISTS vw_customers;
DROP VIEW IF EXISTS vw_customer_orders;
DROP VIEW IF EXISTS vw_customer_addresses;
drop view if exists vw_stock_status;
drop view if exists vw_stock_movements;
drop view if exists vw_critical_stock;

CREATE VIEW vw_customers AS
SELECT 
    c.*,
    COALESCE(o.total_orders, 0) as total_orders,
    COALESCE(o.total_spent, 0) as total_spent,
    o.last_order_date,
    COALESCE(a.address_count, 0) as address_count
FROM customers c
LEFT JOIN (
    SELECT 
        customer_id,
        COUNT(*) as total_orders,
        SUM(total_amount) as total_spent,
        MAX(created_at) as last_order_date
    FROM orders 
    WHERE deleted_at IS NULL
    GROUP BY customer_id
) o ON c.id = o.customer_id
LEFT JOIN (
    SELECT customer_id, COUNT(*) as address_count 
    FROM addresses 
    WHERE deleted_at IS NULL 
    GROUP BY customer_id
) a ON c.id = a.customer_id
WHERE c.deleted_at IS NULL;
