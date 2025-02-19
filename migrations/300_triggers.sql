drop trigger if exists trg_stock_movement_update;
drop trigger if exists trg_order_status_log;
drop trigger if exists audit_orders_status;
drop trigger if exists check_delivery_date;
drop trigger if exists trg_recipe_cost_update;
drop trigger if exists check_stock_before_order;
drop trigger if exists check_stock_level;
drop trigger if exists soft_delete_customer_cascade;
drop trigger if exists update_orders_timestamp;
drop trigger if exists check_account_balance_before_transaction;
drop trigger if exists check_category_type_match;
drop trigger if exists audit_transactions_insert;
drop trigger if exists update_account_balance_after_transaction;

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

-- Sipariş durum güncellemesi - düzeltildi
CREATE TRIGGER trg_order_status_log
AFTER UPDATE OF status ON orders
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (
        tenant_id,
        table_name,
        record_id,
        action,        -- operation değil action kullanıyoruz
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

-- Sipariş durumu güncellendiğinde audit log - düzeltildi
CREATE TRIGGER audit_orders_status 
AFTER UPDATE ON orders 
WHEN OLD.status != NEW.status 
BEGIN
    INSERT INTO audit_log (
        tenant_id,
        table_name, 
        record_id, 
        action,      -- operation değil action kullanıyoruz
        old_data, 
        new_data
    ) VALUES (
        NEW.tenant_id,
        'orders', 
        OLD.id, 
        'STATUS_CHANGE',
        json_object('status', OLD.status),
        json_object('status', NEW.status)
    );
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

-- Orders tablosundaki durum güncellemesi tetikleyicisini ekle
CREATE TRIGGER update_orders_timestamp
AFTER UPDATE ON orders
BEGIN
    UPDATE orders 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Hesap bakiyesi güvenlik kontrolü
CREATE TRIGGER check_account_balance_before_transaction
BEFORE INSERT ON transactions
BEGIN
    SELECT CASE 
        WHEN (
            SELECT current_balance + 
            CASE 
                WHEN NEW.type = 'in' THEN NEW.amount 
                ELSE -NEW.amount 
            END 
            FROM accounts 
            WHERE id = NEW.account_id
        ) < 0 
        AND (
            SELECT allow_negative_balance 
            FROM accounts 
            WHERE id = NEW.account_id
        ) = 0
        THEN RAISE(ABORT, 'Yetersiz bakiye!')
    END;
END;

-- Kategori tipi kontrolü
CREATE TRIGGER check_category_type_match
BEFORE INSERT ON transactions
BEGIN
    SELECT CASE 
        WHEN NEW.category_id IS NOT NULL 
        AND NEW.type != (
            SELECT type 
            FROM transaction_categories 
            WHERE id = NEW.category_id
        )
        THEN RAISE(ABORT, 'İşlem tipi ile kategori tipi uyuşmuyor!')
    END;
END;

-- İşlem denetim kaydı
CREATE TRIGGER audit_transactions_insert
AFTER INSERT ON transactions
BEGIN
    INSERT INTO audit_log (
        tenant_id, table_name, record_id, action,
        old_data, new_data, created_by
    ) VALUES (
        NEW.tenant_id,
        'transactions',
        NEW.id,
        'INSERT',
        NULL,
        json_object(
            'account_id', NEW.account_id,
            'type', NEW.type,
            'amount', NEW.amount,
            'description', NEW.description
        ),
        NEW.created_by
    );
END;

-- Finans Modülü Trigger'ları --

-- Hesap bakiyesi otomatik güncelleme
CREATE TRIGGER update_account_balance_after_transaction
AFTER INSERT ON transactions
BEGIN
    UPDATE accounts 
    SET current_balance = current_balance + 
        CASE 
            WHEN NEW.type = 'in' THEN NEW.amount 
            ELSE -NEW.amount 
        END
    WHERE id = NEW.account_id;
END;