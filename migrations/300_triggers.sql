-- Önce tüm trigger'ları temizle
DROP TRIGGER IF EXISTS trg_stock_movement_update;
DROP TRIGGER IF EXISTS trg_product_soft_delete;
DROP TRIGGER IF EXISTS trg_order_soft_delete;
DROP TRIGGER IF EXISTS trg_customer_soft_delete;
DROP TRIGGER IF EXISTS trg_supplier_soft_delete;
DROP TRIGGER IF EXISTS trg_check_deleted_relations;
DROP TRIGGER IF EXISTS trg_audit_log_changes;
DROP TRIGGER IF EXISTS check_stock_before_order;
DROP TRIGGER IF EXISTS trg_order_status_log;
DROP TRIGGER IF EXISTS audit_orders_status;
DROP TRIGGER IF EXISTS check_delivery_date;
DROP TRIGGER IF EXISTS trg_recipe_cost_update;
DROP TRIGGER IF EXISTS update_orders_timestamp;
DROP TRIGGER IF EXISTS check_account_balance_before_transaction;
DROP TRIGGER IF EXISTS update_account_balance_after_transaction;
DROP TRIGGER IF EXISTS check_category_type_match;
DROP TRIGGER IF EXISTS audit_transactions_insert;
DROP TRIGGER IF EXISTS trg_order_payment_received;
DROP TRIGGER IF EXISTS trg_order_refund;
DROP TRIGGER IF EXISTS trg_inventory_count_completed;
DROP TRIGGER IF EXISTS trg_check_unit_conversion;

-- 1. STOK TRIGGERLARİ
-- Stok hareketi güncellemesi (soft delete uyumlu)
CREATE TRIGGER trg_stock_movement_update
AFTER INSERT ON stock_movements
FOR EACH ROW
WHEN NEW.deleted_at IS NULL
BEGIN
    UPDATE products 
    SET current_stock = (
        SELECT COALESCE(SUM(CASE 
            WHEN movement_type = 'in' THEN quantity 
            ELSE -quantity 
        END), 0)
        FROM stock_movements 
        WHERE product_id = NEW.product_id
        AND deleted_at IS NULL
    )
    WHERE id = NEW.product_id;
END;

-- Stok hareketi kontrolü
CREATE TRIGGER check_stock_level AFTER UPDATE ON products 
WHEN NEW.stock < NEW.min_stock BEGIN
    INSERT INTO notifications (type, message, related_id)
    VALUES ('low_stock', 'Düşük stok uyarısı: ' || NEW.name, NEW.id);
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

-- 2. TEMEL İŞLEM TETİKLEYİCİLERİ 
-- Sipariş durumu ve denetim
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

-- 3. FİNANS TETİKLEYİCİLERİ
-- Hesap bakiyesi kontrolü
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

-- 4. SİPARİŞ ÖDEME TETİKLEYİCİLERİ
-- Sipariş ödemesi alındığında otomatik finansal işlem kaydı
CREATE TRIGGER trg_order_payment_received
AFTER UPDATE OF payment_status ON orders
WHEN NEW.payment_status = 'paid' AND OLD.payment_status != 'paid'
BEGIN
    -- Finans işlemi oluştur
    INSERT INTO transactions (
        tenant_id,
        account_id,
        type,
        amount,
        date,
        description,
        category_id,
        reference_type,
        reference_id,
        payment_method,
        created_by
    ) 
    SELECT 
        NEW.tenant_id,
        CASE NEW.payment_method
            WHEN 'cash' THEN (SELECT id FROM accounts WHERE type = 'cash' AND tenant_id = NEW.tenant_id LIMIT 1)
            WHEN 'credit_card' THEN (SELECT id FROM accounts WHERE type = 'bank' AND tenant_id = NEW.tenant_id LIMIT 1)
            ELSE (SELECT id FROM accounts WHERE type = 'bank' AND tenant_id = NEW.tenant_id LIMIT 1)
        END,
        'in',
        NEW.total_amount,
        CURRENT_TIMESTAMP,
        'Sipariş ödemesi #' || NEW.id,
        (SELECT id FROM transaction_categories WHERE type = 'in' AND tenant_id = NEW.tenant_id AND name = 'Satış Gelirleri' LIMIT 1),
        'order',
        NEW.id,
        NEW.payment_method,
        1;
END;

-- Sipariş iadesi tetikleyicisi
CREATE TRIGGER trg_order_refund
AFTER UPDATE OF status ON orders
WHEN NEW.status = 'refunded' AND OLD.status != 'refunded'
AND NEW.payment_status = 'paid'
BEGIN
    -- İade işlemi için ters kayıt oluştur
    INSERT INTO transactions (
        tenant_id,
        account_id,
        type,
        amount,
        date,
        description,
        category_id,
        reference_type,
        reference_id,
        payment_method,
        created_by
    )
    SELECT 
        NEW.tenant_id,
        t.account_id,
        'out',
        NEW.total_amount,
        CURRENT_TIMESTAMP,
        'Sipariş iadesi #' || NEW.id,
        (SELECT id FROM transaction_categories WHERE type = 'out' AND tenant_id = NEW.tenant_id AND name = 'İadeler' LIMIT 1),
        'order_refund',
        NEW.id,
        NEW.payment_method,
        1
    FROM transactions t
    WHERE t.reference_type = 'order' 
    AND t.reference_id = NEW.id 
    LIMIT 1;
END;

-- 5. SAYIM VE BİRİM TETİKLEYİCİLERİ
-- Sayım tamamlandığında stok düzeltme hareketi oluştur
CREATE TRIGGER trg_inventory_count_completed
AFTER UPDATE OF status ON inventory_counts
WHEN NEW.status = 'completed' AND OLD.status != 'completed'
BEGIN
    INSERT INTO stock_movements (
        tenant_id, product_id, movement_type,
        quantity, unit_id, source_type, source_id,
        notes, created_by
    )
    SELECT 
        NEW.tenant_id,
        item.product_id,
        CASE WHEN item.difference > 0 THEN 'in' ELSE 'out' END,
        ABS(item.difference),
        item.unit_id,
        'inventory_count',
        NEW.id,
        'Sayım düzeltmesi #' || NEW.id,
        NEW.completed_by
    FROM inventory_count_items item
    WHERE item.count_id = NEW.id
    AND item.difference != 0;
END;

-- Stok birimi dönüşüm oranı güncellendiğinde kontrol
CREATE TRIGGER trg_check_unit_conversion
BEFORE UPDATE OF conversion_rate ON stock_units
WHEN NEW.base_unit_id IS NOT NULL
BEGIN
    SELECT CASE 
        WHEN NEW.conversion_rate <= 0 
        THEN RAISE(ABORT, 'Dönüşüm oranı pozitif olmalıdır')
    END;
END;

-- Silinmiş kayıtlarla ilişki kurulmasını engelle (Genel Kontrol)
CREATE TRIGGER trg_check_deleted_relations
BEFORE INSERT ON order_items
BEGIN
    SELECT CASE
        WHEN EXISTS (SELECT 1 FROM products WHERE id = NEW.product_id AND deleted_at IS NOT NULL)
            THEN RAISE(ABORT, 'Silinmiş ürün seçilemez!')
        WHEN EXISTS (SELECT 1 FROM orders WHERE id = NEW.order_id AND deleted_at IS NOT NULL)
            THEN RAISE(ABORT, 'Silinmiş sipariş seçilemez!')
    END;
END;

-- Audit log trigger'ı
CREATE TRIGGER trg_audit_log_changes
AFTER UPDATE OF deleted_at ON orders
FOR EACH ROW
WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL
BEGIN
    INSERT INTO audit_log (
        tenant_id, table_name, record_id, action,
        old_data, new_data, created_by
    ) VALUES (
        NEW.tenant_id,
        'orders',
        NEW.id,
        'SOFT_DELETE',
        json_object('deleted_at', OLD.deleted_at),
        json_object('deleted_at', NEW.deleted_at),
        NEW.updated_by
    );
END;

-- Cascade soft delete triggerları
CREATE TRIGGER trg_customer_soft_delete 
AFTER UPDATE OF deleted_at ON customers 
WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL 
BEGIN
    UPDATE addresses SET deleted_at = CURRENT_TIMESTAMP WHERE customer_id = OLD.id;
    UPDATE customer_preferences SET deleted_at = CURRENT_TIMESTAMP WHERE customer_id = OLD.id;
    UPDATE customer_notes SET deleted_at = CURRENT_TIMESTAMP WHERE customer_id = OLD.id;
END;