-- Stok durumu view
CREATE VIEW vw_stock_status AS
SELECT 
    rm.id,
    rm.tenant_id,
    rm.name,
    rm.unit_id,
    rm.min_stock,
    rm.status,
    u.name as unit_name,
    u.code as unit_code,
    COALESCE(
        (SELECT SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity ELSE -sm.quantity END)
         FROM stock_movements sm 
         WHERE sm.material_id = rm.id 
         AND sm.tenant_id = rm.tenant_id
         AND sm.deleted_at IS NULL
        ), 0
    ) as current_stock,
    (
        SELECT movement_date 
        FROM stock_movements 
        WHERE material_id = rm.id 
        AND tenant_id = rm.tenant_id 
        AND deleted_at IS NULL 
        ORDER BY movement_date DESC 
        LIMIT 1
    ) as last_movement
FROM raw_materials rm
LEFT JOIN units u ON rm.unit_id = u.id
WHERE rm.deleted_at IS NULL;

-- Stok hareketleri özeti
CREATE VIEW vw_stock_movements AS
SELECT 
    sm.*,
    rm.name as material_name,
    u.name as unit_name,
    u.code as unit_code,
    us.name as created_by_name
FROM stock_movements sm
JOIN raw_materials rm ON sm.material_id = rm.id
JOIN units u ON rm.unit_id = u.id
LEFT JOIN users us ON sm.created_by = us.id
WHERE sm.deleted_at IS NULL;

-- Kritik stok durumu
CREATE VIEW vw_critical_stock AS
SELECT 
    vs.*,
    CASE 
        WHEN current_stock <= min_stock * 0.5 THEN 'critical'
        WHEN current_stock <= min_stock THEN 'warning'
        ELSE 'ok'
    END as stock_status
FROM vw_stock_status vs
WHERE vs.min_stock IS NOT NULL
AND vs.status = 'active'
HAVING current_stock <= min_stock;
