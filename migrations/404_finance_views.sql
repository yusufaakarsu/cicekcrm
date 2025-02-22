DROP VIEW IF EXISTS vw_transactions;
CREATE VIEW vw_transactions AS
SELECT 
    t.*,
    a.name as account_name,
    tc.name as category_name,
    CASE t.related_type
        WHEN 'order' THEN (SELECT customer_name FROM vw_orders WHERE id = t.related_id)
        WHEN 'supplier' THEN (SELECT name FROM suppliers WHERE id = t.related_id)
        ELSE NULL
    END as related_name
FROM transactions t
JOIN accounts a ON t.account_id = a.id
JOIN transaction_categories tc ON t.category_id = tc.id
WHERE t.deleted_at IS NULL;
