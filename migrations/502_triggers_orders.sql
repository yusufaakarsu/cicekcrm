
-- 1. Sipariş oluşturulduğunda
CREATE TRIGGER trg_after_order_insert
AFTER INSERT ON orders
BEGIN
    -- Sipariş tutarlarını hesapla (subtotal)
    UPDATE orders 
    SET subtotal = (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM order_items
        WHERE order_id = NEW.id
    ),
    total_amount = subtotal + delivery_fee - discount_amount
    WHERE id = NEW.id;
    
    -- Audit log
    INSERT INTO audit_log (tenant_id, user_id, action, table_name, record_id)
    VALUES (NEW.tenant_id, NEW.created_by, 'INSERT', 'orders', NEW.id);
END;

-- 2. Sipariş durumu değiştiğinde
CREATE TRIGGER trg_order_status_change
AFTER UPDATE OF status ON orders
WHEN NEW.status != OLD.status
BEGIN
    -- Preparing durumuna geçince reçeteyi kopyala
    INSERT INTO order_items_materials (
        order_id, order_item_id, material_id, 
        quantity, unit_price, total_amount
    )
    SELECT 
        NEW.id,
        oi.id,
        pm.material_id,
        oi.quantity * pm.default_quantity,
        (SELECT COALESCE(MAX(unit_price), 0) FROM material_price_history 
         WHERE material_id = pm.material_id 
         AND valid_to IS NULL),
        oi.quantity * pm.default_quantity * unit_price
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN product_materials pm ON p.id = pm.product_id
    WHERE oi.order_id = NEW.id
    AND NEW.status = 'preparing'
    AND OLD.status != 'preparing';
    
    -- Delivered durumuna geçince stok düş ve kasa işle
    INSERT INTO stock_movements (
        tenant_id, material_id, movement_type, 
        quantity, source_type, source_id, created_by
    )
    SELECT 
        NEW.tenant_id,
        oim.material_id,
        'out',
        oim.quantity,
        'sale',
        NEW.id,
        NEW.updated_by
    FROM order_items_materials oim
    WHERE oim.order_id = NEW.id
    AND NEW.status = 'delivered'
    AND OLD.status != 'delivered';

    -- Kasa hareketi oluştur
    INSERT INTO transactions (
        tenant_id, account_id, category_id,
        type, amount, date, related_type,
        related_id, payment_method, description,
        created_by
    )
    SELECT 
        NEW.tenant_id,
        (SELECT id FROM accounts WHERE type = NEW.payment_method LIMIT 1),
        (SELECT id FROM transaction_categories WHERE name = 'Satış Geliri' LIMIT 1),
        'in',
        NEW.total_amount,
        CURRENT_TIMESTAMP,
        'order',
        NEW.id,
        NEW.payment_method,
        'Sipariş ödemesi #' || NEW.id,
        NEW.updated_by
    WHERE NEW.status = 'delivered'
    AND OLD.status != 'delivered';
    
    -- İptal durumunda stok iade
    INSERT INTO stock_movements (
        tenant_id, material_id, movement_type,
        quantity, source_type, source_id, created_by
    )
    SELECT 
        NEW.tenant_id,
        oim.material_id,
        'in',
        oim.quantity,
        'return',
        NEW.id,
        NEW.updated_by
    FROM order_items_materials oim
    WHERE oim.order_id = NEW.id
    AND NEW.status = 'cancelled'
    AND OLD.status != 'cancelled';

    -- Durum değişikliğini logla
    UPDATE orders 
    SET status_updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- 3. Sipariş kalemi eklenince/silinince
CREATE TRIGGER trg_order_items_change
AFTER INSERT OR DELETE ON order_items
BEGIN
    -- Sipariş tutarlarını güncelle
    UPDATE orders 
    SET subtotal = (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM order_items
        WHERE order_id = CASE
            WHEN TG_OP = 'DELETE' THEN OLD.order_id
            ELSE NEW.order_id
        END
    )
    WHERE id = CASE
        WHEN TG_OP = 'DELETE' THEN OLD.order_id
        ELSE NEW.order_id
    END;
END;
