DROP VIEW IF EXISTS vw_products;
CREATE VIEW vw_products AS
SELECT 
    p.*,
    pc.name as category_name,
    COALESCE(r.recipe_count, 0) as recipe_count,
    COALESCE(s.sales_count, 0) as sales_count,
    COALESCE(s.total_revenue, 0) as total_revenue
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN (
    SELECT product_id, COUNT(*) as recipe_count
    FROM recipes WHERE deleted_at IS NULL
    GROUP BY product_id
) r ON p.id = r.product_id
LEFT JOIN (
    SELECT 
        product_id, 
        COUNT(*) as sales_count,
        SUM(total_price) as total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status != 'cancelled'
    GROUP BY product_id
) s ON p.id = s.product_id
WHERE p.deleted_at IS NULL;
