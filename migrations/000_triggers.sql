-- Mevcut trigger'ları sil (varsa)
DROP TRIGGER IF EXISTS trg_after_tenant_insert;
DROP TRIGGER IF EXISTS trg_before_tenant_delete;
DROP TRIGGER IF EXISTS trg_after_user_insert;
DROP TRIGGER IF EXISTS trg_after_user_update;
DROP TRIGGER IF EXISTS trg_after_settings_update;
DROP TRIGGER IF EXISTS trg_after_purchase_item_insert;
DROP TRIGGER IF EXISTS trg_after_purchase_delete;
DROP TRIGGER IF EXISTS trg_after_purchase_update;
DROP TRIGGER IF EXISTS trg_after_purchase_item_update;
DROP TRIGGER IF EXISTS trg_after_purchase_payment;
DROP TRIGGER IF EXISTS trg_after_purchase_payment;
DROP TRIGGER IF EXISTS trg_after_purchase_payment;
DROP TRIGGER IF EXISTS after_order_items_materials_insert;
DROP TRIGGER IF EXISTS trg_before_order_items_materials_insert;
DROP TRIGGER IF EXISTS after_order_cancel;
DROP TRIGGER IF EXISTS trg_after_order_status_update;
DROP TRIGGER IF EXISTS trg_after_order_material_update;
DROP TRIGGER IF EXISTS trg_after_order_ready;
DROP TRIGGER IF EXISTS trg_after_transaction_insert;
DROP TRIGGER IF EXISTS trg_after_transaction_update;
DROP TRIGGER IF EXISTS trg_after_transaction_cancel;
DROP TRIGGER IF EXISTS trg_after_payment_status_change;
DROP TRIGGER IF EXISTS trg_prevent_manual_stock_update;
DROP TRIGGER IF EXISTS trg_before_transaction_insert;
DROP TRIGGER IF EXISTS trg_before_transaction_update;
DROP TRIGGER IF EXISTS trg_after_order_item_insert;
DROP TRIGGER IF EXISTS trg_after_order_item_update;
DROP TRIGGER IF EXISTS trg_after_purchase_item_insert_total;
DROP TRIGGER IF EXISTS trg_after_purchase_item_update_total;
DROP TRIGGER IF EXISTS trg_after_customer_insert;
DROP TRIGGER IF EXISTS trg_after_customer_update;
DROP TRIGGER IF EXISTS trg_after_customer_delete;
DROP TRIGGER IF EXISTS trg_after_order_payment_status_change;

-- Yeni tenant eklendiğinde çalışacak trigger
CREATE TRIGGER trg_after_tenant_insert 
AFTER INSERT ON tenants 
BEGIN
    -- 8. Denetim kaydını ekle (düz metin ile)
    INSERT INTO audit_log (
        tenant_id, 
        user_id, 
        action, 
        table_name, 
        record_id, 
        new_data
    )
    VALUES (
        NEW.id, 
        0,  -- Sistem kullanıcısı için varsayılan değer
        'TENANT_SETUP', 
        'tenants', 
        NEW.id, 
        'name: ' || NEW.name || ', company: ' || NEW.company_name || ', email: ' || NEW.contact_email
    );
END;

-- Tenant silinmeden önce kontrol trigger'ı
CREATE TRIGGER trg_before_tenant_delete 
BEFORE DELETE ON tenants 
BEGIN
    SELECT CASE
        -- Aktif kullanıcı kontrolü
        WHEN EXISTS (SELECT 1 FROM users WHERE tenant_id = OLD.id AND deleted_at IS NULL) 
        THEN RAISE(ABORT, 'Aktif kullanıcılar var')
        
        -- Aktif sipariş kontrolü
        WHEN EXISTS (SELECT 1 FROM orders WHERE tenant_id = OLD.id AND status NOT IN ('delivered', 'cancelled'))
        THEN RAISE(ABORT, 'Aktif siparişler var')
        
        -- Aktif hesap kontrolü
        WHEN EXISTS (SELECT 1 FROM accounts WHERE tenant_id = OLD.id AND status = 'active')
        THEN RAISE(ABORT, 'Aktif hesaplar var')
        
        -- Tenant ayarları kontrolü
        WHEN EXISTS (SELECT 1 FROM tenant_settings WHERE tenant_id = OLD.id AND deleted_at IS NULL)
        THEN RAISE(ABORT, 'Aktif tenant ayarları var')
    END;
END;

-- Kullanıcı eklendiğinde çalışacak trigger
CREATE TRIGGER trg_after_user_insert
AFTER INSERT ON users 
BEGIN
    INSERT INTO audit_log (
        tenant_id, 
        user_id, 
        action, 
        table_name, 
        record_id, 
        new_data
    )
    VALUES (
        NEW.tenant_id,
        NEW.id,
        'INSERT',
        'users',
        NEW.id,
        'role: ' || NEW.role || ', is_active: ' || NEW.is_active || ', email: ' || NEW.email || ', name: ' || NEW.name
    );
END;

-- Kullanıcı güncellendiğinde çalışacak trigger
CREATE TRIGGER trg_after_user_update
AFTER UPDATE ON users 
BEGIN
    INSERT INTO audit_log (
        tenant_id, 
        user_id, 
        action, 
        table_name, 
        record_id, 
        old_data,
        new_data
    )
    VALUES (
        NEW.tenant_id,
        NEW.id,
        'UPDATE',
        'users',
        NEW.id,
        'role: ' || OLD.role || ', is_active: ' || OLD.is_active || ', email: ' || OLD.email || ', name: ' || OLD.name,
        'role: ' || NEW.role || ', is_active: ' || NEW.is_active || ', email: ' || NEW.email || ', name: ' || NEW.name
    );
END;

-- Ayarlar güncellendiğinde çalışacak trigger
CREATE TRIGGER trg_after_settings_update 
AFTER UPDATE ON tenant_settings
BEGIN
    INSERT INTO audit_log (
        tenant_id, 
        user_id, 
        action, 
        table_name, 
        record_id, 
        old_data,
        new_data
    )
    VALUES (
        NEW.tenant_id,
        NEW.updated_by,  -- Güncellemeyi yapan kullanıcı (varsayılan alan)
        'UPDATE',
        'tenant_settings',
        NEW.id,
        'require_stock: ' || OLD.require_stock || ', track_recipes: ' || OLD.track_recipes || ', allow_negative_stock: ' || OLD.allow_negative_stock,
        'require_stock: ' || NEW.require_stock || ', track_recipes: ' || NEW.track_recipes || ', allow_negative_stock: ' || NEW.allow_negative_stock
    );
END;

CREATE TRIGGER trg_after_purchase_item_insert 
AFTER INSERT ON purchase_order_items 
BEGIN 
    -- Siparişin varlığını ve silinmemiş olduğunu kontrol et
    SELECT RAISE(ABORT, 'Geçersiz sipariş')
    WHERE NOT EXISTS (
        SELECT 1 FROM purchase_orders 
        WHERE id = NEW.order_id 
        AND deleted_at IS NULL
    );

    -- Toplam tutarı güncelle
    UPDATE purchase_orders
    SET total_amount = (
        SELECT COALESCE(SUM(quantity * unit_price), 0)
        FROM purchase_order_items
        WHERE order_id = NEW.order_id
        AND deleted_at IS NULL
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.order_id;

    -- Malzeme fiyat geçmişini güncelle
    UPDATE material_price_history 
    SET valid_to = date((
        SELECT order_date FROM purchase_orders WHERE id = NEW.order_id
    ))
    WHERE material_id = NEW.material_id
    AND valid_to IS NULL;

    -- Yeni fiyat geçmişi kaydı ekle
    INSERT INTO material_price_history (
        tenant_id, material_id, supplier_id, unit_price, valid_from
    )
    SELECT 
        po.tenant_id, NEW.material_id, po.supplier_id, NEW.unit_price, date(po.order_date)
    FROM purchase_orders po
    WHERE po.id = NEW.order_id;

    -- Denetim kaydı ekle
    INSERT INTO audit_log (
        tenant_id, action, table_name, record_id, new_data, user_id
    )
    SELECT
        po.tenant_id, 'PURCHASE_ITEM_ADDED', 'purchase_order_items', NEW.id,
        json_object('order_id', NEW.order_id, 'material_id', NEW.material_id, 
                    'quantity', NEW.quantity, 'unit_price', NEW.unit_price, 
                    'total', NEW.quantity * NEW.unit_price),
        po.created_by
    FROM purchase_orders po
    WHERE po.id = NEW.order_id;
END;

CREATE TRIGGER trg_after_purchase_delete 
AFTER UPDATE ON purchase_orders
WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL
BEGIN
    -- İlgili stok hareketlerini iptal et
    UPDATE stock_movements
    SET deleted_at = CURRENT_TIMESTAMP,
        notes = notes || ' (İptal edildi)'
    WHERE source_type = 'purchase' 
    AND source_id = OLD.id;

    -- Denetim kaydı ekle
    INSERT INTO audit_log (
        tenant_id, action, table_name, record_id, old_data
    ) 
    VALUES (
        OLD.tenant_id, 'PURCHASE_CANCELLED', 'purchase_orders', OLD.id,
        json_object('supplier_id', OLD.supplier_id, 'total_amount', OLD.total_amount)
    );
END;

CREATE TRIGGER trg_after_purchase_update 
AFTER UPDATE ON purchase_orders
WHEN NEW.status != OLD.status OR NEW.payment_status != OLD.payment_status
BEGIN
    -- Durum veya ödeme durumu değişikliği için denetim kaydı ekle
    INSERT INTO audit_log (
        tenant_id, action, table_name, record_id, old_data, new_data
    ) 
    VALUES (
        NEW.tenant_id, 'UPDATE', 'purchase_orders', NEW.id,
        json_object('status', OLD.status, 'payment_status', OLD.payment_status),
        json_object('status', NEW.status, 'payment_status', NEW.payment_status)
    );
END;

CREATE TRIGGER trg_after_purchase_item_update 
AFTER UPDATE ON purchase_order_items
WHEN NEW.quantity != OLD.quantity OR NEW.deleted_at IS NOT NULL
BEGIN
    -- Stok hareketlerini güncelle
    UPDATE stock_movements
    SET quantity = CASE 
            WHEN NEW.deleted_at IS NOT NULL THEN 0
            ELSE NEW.quantity 
        END,
        deleted_at = NEW.deleted_at,
        notes = CASE 
            WHEN NEW.deleted_at IS NOT NULL THEN 'Kalem silindi'
            ELSE notes 
        END
    WHERE source_type = 'purchase'
    AND source_id = NEW.order_id
    AND material_id = NEW.material_id;

    -- Toplam tutarı yeniden hesapla
    UPDATE purchase_orders
    SET total_amount = (
        SELECT COALESCE(SUM(quantity * unit_price), 0)
        FROM purchase_order_items
        WHERE order_id = NEW.order_id
        AND deleted_at IS NULL
    )
    WHERE id = NEW.order_id;
END;

CREATE TRIGGER trg_after_purchase_payment
AFTER UPDATE OF paid_amount ON purchase_orders
WHEN OLD.paid_amount != NEW.paid_amount 
AND NEW.status != 'cancelled'
BEGIN
    -- Ödeme durumunu güncelle
    UPDATE purchase_orders 
    SET payment_status = CASE
        WHEN NEW.paid_amount = 0 THEN 'pending'
        WHEN NEW.paid_amount < NEW.total_amount THEN 'partial'
        WHEN NEW.paid_amount >= NEW.total_amount THEN 'paid'
        ELSE payment_status
    END
    WHERE id = NEW.id;

    -- Denetim kaydı ekle
    INSERT INTO audit_log (
        tenant_id, action, table_name, record_id, old_data, new_data
    ) VALUES (
        NEW.tenant_id, 'PAYMENT_UPDATE', 'purchase_orders', NEW.id,
        json_object('paid_amount', OLD.paid_amount, 'payment_status', OLD.payment_status),
        json_object('paid_amount', NEW.paid_amount, 'payment_status', NEW.payment_status)
    );
END;

CREATE TRIGGER after_order_items_materials_insert
AFTER INSERT ON order_items_materials
BEGIN
    -- Negatif stok izni yoksa stok kontrolü yap
    SELECT CASE 
        WHEN (
            SELECT allow_negative_stock 
            FROM tenant_settings 
            WHERE tenant_id = NEW.tenant_id
        ) = 0 
        AND (
            SELECT COALESCE(stock_quantity, 0) 
            FROM raw_materials 
            WHERE id = NEW.material_id
        ) < NEW.quantity
        THEN RAISE(ABORT, 'Yetersiz stok')
    END;
    
    -- Stok miktarını güncelle
    UPDATE raw_materials 
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.material_id;

    -- Stok hareketi kaydı ekle
    INSERT INTO stock_movements (
        tenant_id, material_id, movement_type, quantity, source_type, source_id, notes, created_by
    ) 
    SELECT 
        o.tenant_id, NEW.material_id, 'out', NEW.quantity, 'sale', NEW.order_id,
        'Sipariş hazırlama malzeme kullanımı', o.prepared_by
    FROM orders o
    WHERE o.id = NEW.order_id;
END;

CREATE TRIGGER trg_before_order_items_materials_insert
BEFORE INSERT ON order_items_materials
BEGIN
    -- Geçerli bir fiyatın varlığını kontrol et
    SELECT RAISE(ABORT, 'Geçerli fiyat bulunamadı')
    WHERE NOT EXISTS (
        SELECT 1 
        FROM material_price_history
        WHERE material_id = NEW.material_id
        AND valid_from <= CURRENT_DATE
        AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
    );

    -- Birim fiyatı son fiyata ayarla
    SELECT NEW.unit_price = COALESCE(
        (SELECT unit_price 
         FROM material_price_history
         WHERE material_id = NEW.material_id
         AND valid_from <= CURRENT_DATE
         AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
         ORDER BY valid_from DESC
         LIMIT 1),
        0
    );

    -- Toplam tutarı hesapla
    SELECT NEW.total_amount = NEW.quantity * NEW.unit_price;
END;

CREATE TRIGGER after_order_cancel
AFTER UPDATE ON orders
WHEN NEW.status = 'cancelled' 
AND OLD.status IN ('ready', 'preparing')
BEGIN
    -- Stok miktarlarını geri yükle
    UPDATE raw_materials
    SET stock_quantity = stock_quantity + (
        SELECT quantity 
        FROM order_items_materials 
        WHERE order_id = NEW.id AND material_id = raw_materials.id
    )
    WHERE id IN (
        SELECT material_id 
        FROM order_items_materials 
        WHERE order_id = NEW.id
    );

    -- Stok hareketi kaydı ekle
    INSERT INTO stock_movements (
        tenant_id, material_id, movement_type, quantity, source_type, source_id, notes, created_by
    )
    SELECT 
        o.tenant_id, oim.material_id, 'in', oim.quantity, 'adjustment', o.id,
        'Sipariş iptali - malzeme iadesi', o.updated_by
    FROM orders o
    JOIN order_items_materials oim ON oim.order_id = o.id
    WHERE o.id = NEW.id;
END;

CREATE TRIGGER trg_after_order_status_update
AFTER UPDATE ON orders
WHEN NEW.status != OLD.status
BEGIN
    -- Geçersiz durum geçişlerini engelle
    SELECT CASE
        WHEN OLD.status = 'new' AND NEW.status NOT IN ('confirmed', 'cancelled')
        THEN RAISE(ABORT, 'Geçersiz durum değişikliği')
    END;

    -- Hazırlık zamanlarını güncelle
    UPDATE orders SET 
        preparation_start = CASE 
            WHEN NEW.status = 'preparing' THEN CURRENT_TIMESTAMP 
            ELSE preparation_start 
        END,
        preparation_end = CASE 
            WHEN NEW.status = 'ready' THEN CURRENT_TIMESTAMP 
            ELSE preparation_end 
        END
    WHERE id = NEW.id;

    -- Denetim kaydı ekle
    INSERT INTO audit_log (tenant_id, action, table_name, record_id, old_data, new_data)
    VALUES (
        NEW.tenant_id, 'STATUS_CHANGE', 'orders', NEW.id,
        json_object('status', OLD.status),
        json_object('status', NEW.status)
    );
END;

CREATE TRIGGER trg_after_order_material_update
AFTER UPDATE ON order_items_materials
WHEN NEW.quantity != OLD.quantity
BEGIN
    -- Stok miktarını ayarla
    UPDATE raw_materials 
    SET stock_quantity = stock_quantity + OLD.quantity - NEW.quantity
    WHERE id = NEW.material_id;

    -- Stok hareketi kaydı ekle
    INSERT INTO stock_movements (
        tenant_id, material_id, movement_type, quantity, source_type, source_id, notes, created_by
    ) 
    SELECT 
        o.tenant_id, NEW.material_id,
        CASE WHEN NEW.quantity > OLD.quantity THEN 'out' ELSE 'in' END,
        ABS(NEW.quantity - OLD.quantity), 'adjustment', o.id,
        'Sipariş malzeme miktarı güncelleme', o.updated_by
    FROM orders o
    WHERE o.id = NEW.order_id;
END;

CREATE TRIGGER trg_after_order_ready
AFTER UPDATE ON orders
WHEN NEW.status = 'ready' AND OLD.status = 'preparing'
BEGIN
    -- Negatif stok izni yoksa stok kontrolü yap
    SELECT RAISE(ABORT, 'Yetersiz stok')
    WHERE EXISTS (
        SELECT 1 
        FROM order_items_materials oim
        WHERE oim.order_id = NEW.id
        AND oim.quantity > (
            SELECT COALESCE(stock_quantity, 0)
            FROM raw_materials 
            WHERE id = oim.material_id
        )
        AND NOT EXISTS (
            SELECT 1 FROM tenant_settings 
            WHERE tenant_id = NEW.tenant_id 
            AND allow_negative_stock = 1
        )
    );

    -- Stok miktarlarını düşür
    UPDATE raw_materials 
    SET stock_quantity = stock_quantity - (
        SELECT quantity 
        FROM order_items_materials 
        WHERE order_id = NEW.id 
        AND material_id = raw_materials.id
    )
    WHERE id IN (
        SELECT material_id 
        FROM order_items_materials 
        WHERE order_id = NEW.id
    );

    -- Stok hareketi kaydı ekle
    INSERT INTO stock_movements (
        tenant_id, material_id, movement_type, quantity, source_type, source_id, notes, created_by
    )
    SELECT 
        o.tenant_id, oim.material_id, 'out', oim.quantity, 'sale', o.id,
        'Sipariş tamamlandı - malzeme kullanımı', o.updated_by
    FROM orders o
    JOIN order_items_materials oim ON oim.order_id = o.id
    WHERE o.id = NEW.id;

    -- Denetim kaydı ekle
    INSERT INTO audit_log (
        tenant_id, action, table_name, record_id, new_data
    )
    VALUES (
        NEW.tenant_id, 'ORDER_COMPLETED', 'orders', NEW.id,
        json_object('preparation_time', strftime('%s', NEW.preparation_end) - strftime('%s', NEW.preparation_start))
    );
END;

CREATE TRIGGER trg_after_transaction_insert
AFTER INSERT ON transactions
WHEN NEW.status = 'paid'
BEGIN
    -- Hesap bakiyesini güncelle
    UPDATE accounts 
    SET balance_calculated = balance_calculated + 
        CASE WHEN NEW.type = 'in' THEN NEW.amount ELSE -NEW.amount END
    WHERE id = NEW.account_id;

    -- Denetim kaydı ekle
    INSERT INTO audit_log (tenant_id, action, table_name, record_id, new_data)
    VALUES (
        NEW.tenant_id, 'BALANCE_UPDATE', 'accounts', NEW.account_id,
        json_object('transaction_id', NEW.id, 'amount', NEW.amount, 'type', NEW.type)
    );
END;

CREATE TRIGGER trg_after_transaction_update 
AFTER UPDATE ON transactions 
WHEN NEW.status = 'paid' AND OLD.status = 'pending'
BEGIN
    -- Hesap bakiyesini güncelle
    UPDATE accounts 
    SET balance_calculated = balance_calculated + 
        CASE WHEN NEW.type = 'in' THEN NEW.amount ELSE -NEW.amount END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.account_id;

    -- Denetim kaydı ekle
    INSERT INTO audit_log (tenant_id, action, table_name, record_id, new_data)
    VALUES (
        NEW.tenant_id, 'BALANCE_UPDATE', 'accounts', NEW.account_id,
        json_object('transaction_id', NEW.id, 'amount', NEW.amount, 'type', NEW.type)
    );
END;

CREATE TRIGGER trg_after_transaction_cancel
AFTER UPDATE ON transactions 
WHEN NEW.status = 'cancelled' AND OLD.status = 'paid'
BEGIN
    -- Hesap bakiyesini geri al
    UPDATE accounts 
    SET balance_calculated = balance_calculated - 
        CASE WHEN OLD.type = 'in' THEN OLD.amount ELSE -OLD.amount END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.account_id;

    -- İlgili sipariş veya satın alma ödeme durumunu güncelle
    UPDATE orders 
    SET payment_status = CASE
            WHEN paid_amount - OLD.amount <= 0 THEN 'pending'
            WHEN paid_amount - OLD.amount < total_amount THEN 'partial'
            ELSE payment_status
        END,
        paid_amount = paid_amount - OLD.amount
    WHERE NEW.related_type = 'order' AND id = NEW.related_id;

    UPDATE purchase_orders
    SET payment_status = CASE
            WHEN paid_amount - OLD.amount <= 0 THEN 'pending'
            WHEN paid_amount - OLD.amount < total_amount THEN 'partial'
            ELSE payment_status
        END,
        paid_amount = paid_amount - OLD.amount
    WHERE NEW.related_type = 'purchase' AND id = NEW.related_id;

    -- Denetim kaydı ekle
    INSERT INTO audit_log (tenant_id, action, table_name, record_id, old_data, new_data)
    VALUES (
        NEW.tenant_id, 'TRANSACTION_CANCELLED', 'transactions', NEW.id,
        json_object('status', OLD.status, 'amount', OLD.amount),
        json_object('status', NEW.status)
    );
END;

CREATE TRIGGER trg_after_payment_status_change
AFTER UPDATE ON purchase_orders
WHEN NEW.payment_status = 'paid' AND OLD.payment_status = 'pending'
BEGIN
    -- Tedarikçi ödemesi için işlem kaydı ekle
    INSERT INTO transactions (
        tenant_id, account_id, category_id, type, amount, date, related_type, related_id,
        payment_method, description, status, created_by
    )
    SELECT 
        NEW.tenant_id,
        (SELECT id FROM accounts WHERE tenant_id = NEW.tenant_id AND type = 'cash' LIMIT 1),
        (SELECT id FROM transaction_categories WHERE tenant_id = NEW.tenant_id AND reporting_code = 'SUPPLIER' LIMIT 1),
        'out', NEW.total_amount, CURRENT_TIMESTAMP, 'purchase', NEW.id,
        'cash', 'Tedarikçi ödemesi #' || NEW.id, 'paid', NEW.created_by
    WHERE NEW.created_by IS NOT NULL;
END;

CREATE TRIGGER trg_after_order_payment_status_change 
AFTER UPDATE ON orders
WHEN NEW.payment_status = 'paid' AND OLD.payment_status = 'pending'
BEGIN
    -- Sipariş tahsilatı için işlem kaydı ekle
    INSERT INTO transactions (
        tenant_id, account_id, category_id, type, amount, date, related_type, related_id,
        payment_method, description, status, created_by
    )
    SELECT
        NEW.tenant_id,
        (SELECT id FROM accounts WHERE tenant_id = NEW.tenant_id AND type = 'cash' LIMIT 1),
        (SELECT id FROM transaction_categories WHERE tenant_id = NEW.tenant_id AND reporting_code = 'SALES_CASH' LIMIT 1),
        'in', NEW.total_amount, CURRENT_TIMESTAMP, 'order', NEW.id,
        'cash', 'Sipariş tahsilatı #' || NEW.id, 'paid', NEW.updated_by;

    -- Denetim kaydı ekle
    INSERT INTO audit_log (
        tenant_id, action, table_name, record_id, old_data, new_data
    ) VALUES (
        NEW.tenant_id, 'PAYMENT_STATUS_CHANGE', 'transactions', NEW.id,
        json_object('status', OLD.payment_status, 'amount', OLD.paid_amount),
        json_object('status', NEW.payment_status, 'amount', NEW.paid_amount)
    );
END;

CREATE TRIGGER trg_prevent_manual_stock_update
BEFORE UPDATE ON raw_materials
WHEN NEW.stock_quantity != OLD.stock_quantity
BEGIN
    SELECT RAISE(ABORT, 'Stok miktarı manual olarak güncellenemez');
END;

CREATE TRIGGER trg_before_transaction_insert
BEFORE INSERT ON transactions
BEGIN
    SELECT CASE 
        WHEN NEW.amount <= 0 THEN RAISE(ABORT, 'Tutar pozitif olmalı')
    END;
END;

CREATE TRIGGER trg_before_transaction_update
BEFORE UPDATE ON transactions
WHEN NEW.amount != OLD.amount
BEGIN
    SELECT CASE 
        WHEN NEW.amount <= 0 THEN RAISE(ABORT, 'Tutar pozitif olmalı')
    END;
END;

CREATE TRIGGER trg_after_order_item_insert
AFTER INSERT ON order_items
BEGIN
    UPDATE orders
    SET total_amount = (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM order_items
        WHERE order_id = NEW.order_id AND deleted_at IS NULL
    )
    WHERE id = NEW.order_id;
END;

CREATE TRIGGER trg_after_order_item_update
AFTER UPDATE ON order_items
WHEN NEW.total_amount != OLD.total_amount OR NEW.deleted_at IS NOT NULL
BEGIN
    UPDATE orders
    SET total_amount = (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM order_items
        WHERE order_id = NEW.order_id AND deleted_at IS NULL
    )
    WHERE id = NEW.order_id;
END;

CREATE TRIGGER trg_after_purchase_item_insert_total
AFTER INSERT ON purchase_order_items
BEGIN
    UPDATE purchase_orders
    SET total_amount = (
        SELECT COALESCE(SUM(quantity * unit_price), 0)
        FROM purchase_order_items
        WHERE order_id = NEW.order_id AND deleted_at IS NULL
    )
    WHERE id = NEW.order_id;
END;

CREATE TRIGGER trg_after_purchase_item_update_total
AFTER UPDATE ON purchase_order_items
WHEN NEW.quantity != OLD.quantity OR NEW.unit_price != OLD.unit_price OR NEW.deleted_at IS NOT NULL
BEGIN
    UPDATE purchase_orders
    SET total_amount = (
        SELECT COALESCE(SUM(quantity * unit_price), 0)
        FROM purchase_order_items
        WHERE order_id = NEW.order_id AND deleted_at IS NULL
    )
    WHERE id = NEW.order_id;
END;

CREATE TRIGGER trg_after_customer_insert
AFTER INSERT ON customers
BEGIN
    INSERT INTO audit_log (tenant_id, action, table_name, record_id, new_data)
    VALUES (
        NEW.tenant_id, 'INSERT', 'customers', NEW.id,
        json_object('name', NEW.name, 'phone', NEW.phone)
    );
END;

CREATE TRIGGER trg_after_customer_update
AFTER UPDATE ON customers
BEGIN
    INSERT INTO audit_log (tenant_id, action, table_name, record_id, old_data, new_data)
    VALUES (
        NEW.tenant_id, 'UPDATE', 'customers', NEW.id,
        json_object('name', OLD.name, 'phone', OLD.phone),
        json_object('name', NEW.name, 'phone', NEW.phone)
    );
END;

CREATE TRIGGER trg_after_customer_delete
AFTER UPDATE ON customers
WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL
BEGIN
    INSERT INTO audit_log (tenant_id, action, table_name, record_id, old_data)
    VALUES (
        OLD.tenant_id, 'DELETE', 'customers', OLD.id,
        json_object('name', OLD.name, 'phone', OLD.phone)
    );
END;
