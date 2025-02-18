-- Stok durumu görünümü
CREATE VIEW v_current_stock AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.type_id,
    p.category_id,
    COALESCE(SUM(CASE 
        WHEN sm.movement_type = 'in' THEN sm.quantity 
        ELSE -sm.quantity 
    END), 0) as current_stock,
    p.min_stock,
    u.name as unit_name,
    u.symbol as unit_symbol
FROM products p
LEFT JOIN stock_movements sm ON p.id = sm.product_id
LEFT JOIN stock_units u ON p.stock_unit_id = u.id
GROUP BY p.id;

-- Sipariş özeti görünümü
CREATE VIEW v_order_summary AS
SELECT
    o.id as order_id,
    o.tenant_id,
    o.delivery_date,
    o.status,
    o.payment_status,
    o.total_amount,
    c.name as customer_name,
    c.phone as customer_phone,
    a.district as delivery_district,
    COUNT(oi.id) as item_count,
    GROUP_CONCAT(p.name) as products
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN addresses a ON o.delivery_address_id = a.id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
GROUP BY o.id;

-- Günlük teslimat özeti
CREATE VIEW v_daily_deliveries AS
SELECT
    delivery_date,
    delivery_time_slot,
    COUNT(*) as total_orders,
    SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
    COUNT(DISTINCT delivery_address_id) as unique_addresses,
    SUM(total_amount) as total_revenue
FROM orders
GROUP BY delivery_date, delivery_time_slot;

-- Reçete maliyet görünümü ekleniyor
CREATE VIEW v_recipe_costs AS
SELECT 
    r.id as recipe_id,
    r.name as recipe_name,
    r.product_id,
    p.name as product_name,
    SUM(ri.quantity * comp.purchase_price) as material_cost,
    r.base_cost as labor_cost,
    (SUM(ri.quantity * comp.purchase_price) + r.base_cost) as total_cost,
    COUNT(ri.id) as component_count
FROM recipes r
JOIN recipe_items ri ON r.id = ri.recipe_id
JOIN products p ON r.product_id = p.id
JOIN products comp ON ri.component_id = comp.id
GROUP BY r.id;

-- Envanter istatistikleri görünümü ekleniyor
CREATE VIEW v_inventory_stats AS
SELECT
    p.id as product_id,
    p.name as product_name,
    p.current_stock,
    p.min_stock,
    COALESCE(po.pending_quantity, 0) as pending_orders,
    COALESCE(sm_in.total_in, 0) as total_in,
    COALESCE(sm_out.total_out, 0) as total_out,
    COALESCE(sm_waste.total_waste, 0) as total_waste
FROM products p
LEFT JOIN (
    SELECT product_id, SUM(quantity) as pending_quantity
    FROM purchase_order_items 
    WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE status = 'ordered')
    GROUP BY product_id
) po ON p.id = po.product_id
LEFT JOIN (
    SELECT product_id, SUM(quantity) as total_in
    FROM stock_movements 
    WHERE movement_type = 'in' AND source_type = 'purchase'
    GROUP BY product_id
) sm_in ON p.id = sm_in.product_id
LEFT JOIN (
    SELECT product_id, SUM(quantity) as total_out
    FROM stock_movements 
    WHERE movement_type = 'out' AND source_type = 'sale'
    GROUP BY product_id
) sm_out ON p.id = sm_out.product_id
LEFT JOIN (
    SELECT product_id, SUM(quantity) as total_waste
    FROM stock_movements 
    WHERE movement_type = 'out' AND source_type = 'waste'
    GROUP BY product_id
) sm_waste ON p.id = sm_waste.product_id;

-- Müşteri sipariş görünümü ekleniyor
CREATE VIEW v_customer_orders AS
SELECT
    c.id as customer_id,
    c.name as customer_name,
    COUNT(o.id) as total_orders,
    SUM(o.total_amount) as total_spent,
    AVG(o.total_amount) as avg_order_value,
    MAX(o.delivery_date) as last_order_date,
    COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) as cancelled_orders,
    GROUP_CONCAT(DISTINCT a.district) as delivery_districts
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
LEFT JOIN addresses a ON o.delivery_address_id = a.id
GROUP BY c.id;
