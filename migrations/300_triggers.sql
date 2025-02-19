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

-- Sipariş durumu güncellendiğinde audit log
CREATE TRIGGER audit_orders_status AFTER UPDATE ON orders 
WHEN OLD.status != NEW.status BEGIN
    INSERT INTO audit_log (table_name, record_id, operation, old_data, new_data)
    VALUES ('orders', OLD.id, 'STATUS_CHANGE', OLD.status, NEW.status);
END;

-- Teslimat tarihi değiştiğinde kontrol
CREATE TRIGGER check_delivery_date BEFORE UPDATE ON orders BEGIN
    SELECT CASE 
        WHEN NEW.delivery_date < date('now') 
        THEN RAISE(ABORT, 'Geçmiş tarihli teslimat tarihi seçilemez')
    END;
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

-- Stok kontrolü için trigger
CREATE TRIGGER check_stock_before_order
BEFORE INSERT ON order_items
FOR EACH ROW
BEGIN
    -- Tenant ayarlarını kontrol et
    SELECT CASE 
        WHEN (SELECT require_stock FROM tenant_settings WHERE tenant_id = NEW.tenant_id)
             AND
             (SELECT stock_tracked FROM product_types pt 
              JOIN products p ON p.type_id = pt.id 
              WHERE p.id = NEW.product_id)
             AND 
             (SELECT current_stock FROM products WHERE id = NEW.product_id) < NEW.quantity
             AND
             NOT (SELECT allow_negative_stock FROM tenant_settings WHERE tenant_id = NEW.tenant_id)
        THEN RAISE(ABORT, 'Yetersiz stok!')
    END;
END;

-- Stok hareketi kontrolü
CREATE TRIGGER check_stock_level AFTER UPDATE ON products 
WHEN NEW.stock < NEW.min_stock BEGIN
    INSERT INTO notifications (type, message, related_id)
    VALUES ('low_stock', 'Düşük stok uyarısı: ' || NEW.name, NEW.id);
END;

-- Müşteri silindiğinde adreslerini de sil
CREATE TRIGGER soft_delete_customer_cascade AFTER UPDATE ON customers 
WHEN NEW.is_deleted = 1 AND OLD.is_deleted = 0 BEGIN
    UPDATE addresses SET is_deleted = 1 WHERE customer_id = OLD.id;
    UPDATE orders SET is_deleted = 1 WHERE customer_id = OLD.id;
END;
