-- Stok hareketi trigger'ı
CREATE TRIGGER trg_stock_movement_update
AFTER INSERT ON stock_movements
FOR EACH ROW
BEGIN
    UPDATE products 
    SET current_stock = (
        SELECT COALESCE(SUM(CASE 
            WHEN movement_type = 'in' THEN quantity 
            ELSE -quantity 
        END), 0)
        FROM stock_movements 
        WHERE product_id = NEW.product_id
    )
    WHERE id = NEW.product_id;
END;

-- Sipariş durum güncellemesi
CREATE TRIGGER trg_order_status_log
AFTER UPDATE OF status ON orders
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (
        tenant_id,
        table_name,
        record_id,
        action,
        old_data,
        new_data
    ) VALUES (
        NEW.tenant_id,
        'orders',
        NEW.id,
        'STATUS_CHANGE',
        json_object('status', OLD.status),
        json_object('status', NEW.status)
    );
END;

-- Reçete maliyet hesaplama
CREATE TRIGGER trg_recipe_cost_update
AFTER INSERT ON recipe_items
FOR EACH ROW
BEGIN
    UPDATE recipes 
    SET base_cost = (
        SELECT COALESCE(SUM(ri.quantity * p.purchase_price), 0)
        FROM recipe_items ri
        JOIN products p ON ri.component_id = p.id
        WHERE ri.recipe_id = NEW.recipe_id
    )
    WHERE id = NEW.recipe_id;
END;
