-- Önce trigger'ları temizle
DROP TRIGGER IF EXISTS trg_after_purchase_item_insert;
DROP TRIGGER IF EXISTS trg_after_purchase_update;
DROP TRIGGER IF EXISTS trg_after_purchase_delete;
DROP TRIGGER IF EXISTS trg_after_purchase_item_update;
DROP TRIGGER IF EXISTS trg_after_purchase_payment;

-- Satın alma kalemi eklendiğinde
CREATE TRIGGER trg_after_purchase_item_insert 
AFTER INSERT ON purchase_order_items 
BEGIN 
    -- Geçerlilik kontrolü
    SELECT RAISE(ROLLBACK, 'Geçersiz sipariş')
    WHERE NOT EXISTS (
        SELECT 1 FROM purchase_orders 
        WHERE id = NEW.order_id 
        AND deleted_at IS NULL
    );

    -- Toplam tutar güncelle
    UPDATE purchase_orders
    SET total_amount = (
        SELECT COALESCE(SUM(quantity * unit_price), 0)
        FROM purchase_order_items
        WHERE order_id = NEW.order_id
        AND deleted_at IS NULL
    ),
    updated_at = CURRENT_TIMESTAMP -- Eklendi
    WHERE id = NEW.order_id;

    -- Fiyat geçmişini güncelle ve eskisini kapat
    UPDATE material_price_history 
    SET valid_to = date((
        SELECT order_date FROM purchase_orders WHERE id = NEW.order_id
    ))
    WHERE material_id = NEW.material_id
    AND valid_to IS NULL;

    -- Yeni fiyat geçmişi ekle
    INSERT INTO material_price_history (
        tenant_id,
        material_id,
        supplier_id,
        unit_price,
        valid_from
    )
    SELECT 
        po.tenant_id,
        NEW.material_id,
        po.supplier_id,
        NEW.unit_price,
        date(po.order_date)
    FROM purchase_orders po
    WHERE po.id = NEW.order_id;

    -- Audit log
    INSERT INTO audit_log (
        tenant_id,
        action,
        table_name,
        record_id,
        new_data,
        user_id  -- Eklendi
    )
    SELECT
        po.tenant_id,
        'PURCHASE_ITEM_ADDED',
        'purchase_order_items', 
        NEW.id,
        json_object(
            'order_id', NEW.order_id,
            'material_id', NEW.material_id,
            'quantity', NEW.quantity,
            'unit_price', NEW.unit_price,
            'total', NEW.quantity * NEW.unit_price -- Total eklendi
        ),
        po.created_by
    FROM purchase_orders po
    WHERE po.id = NEW.order_id;
END;

-- 2. Satın alma iptal edildiğinde stok iadesi
CREATE TRIGGER trg_after_purchase_delete 
AFTER UPDATE ON purchase_orders
WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL
BEGIN
    -- Stok hareketlerini iptal et
    UPDATE stock_movements
    SET deleted_at = CURRENT_TIMESTAMP,
        notes = notes || ' (İptal edildi)'
    WHERE source_type = 'purchase' 
    AND source_id = OLD.id;

    -- Audit log
    INSERT INTO audit_log (
        tenant_id, action, table_name, record_id, old_data
    ) 
    VALUES (
        OLD.tenant_id,
        'PURCHASE_CANCELLED',
        'purchase_orders',
        OLD.id,
        json_object(
            'supplier_id', OLD.supplier_id,
            'total_amount', OLD.total_amount
        )
    );
END;

-- Satın alma kaydı güncellendiğinde
CREATE TRIGGER trg_after_purchase_update 
AFTER UPDATE ON purchase_orders
WHEN NEW.status != OLD.status OR NEW.payment_status != OLD.payment_status
BEGIN
    -- Status değişiminde audit log
    INSERT INTO audit_log (
        tenant_id, action, table_name, record_id, old_data, new_data
    ) 
    VALUES (
        NEW.tenant_id,
        'UPDATE',
        'purchase_orders',
        NEW.id,
        json_object('status', OLD.status, 'payment_status', OLD.payment_status),
        json_object('status', NEW.status, 'payment_status', NEW.payment_status)
    );
END;

-- Satın alma kalemi güncellendiğinde
CREATE TRIGGER trg_after_purchase_item_update 
AFTER UPDATE ON purchase_order_items
WHEN NEW.quantity != OLD.quantity OR NEW.deleted_at IS NOT NULL
BEGIN
    -- Stok hareketini güncelle/iptal et
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

    -- Toplam tutarı güncelle
    UPDATE purchase_orders
    SET total_amount = (
        SELECT COALESCE(SUM(quantity * unit_price), 0)
        FROM purchase_order_items
        WHERE order_id = NEW.order_id
        AND deleted_at IS NULL
    )
    WHERE id = NEW.order_id;
END;

-- Satın alma ödemesi için trigger
DROP TRIGGER IF EXISTS trg_after_purchase_payment;

CREATE TRIGGER trg_after_purchase_payment
AFTER UPDATE OF paid_amount ON purchase_orders
WHEN OLD.paid_amount != NEW.paid_amount 
AND NEW.status != 'cancelled'
BEGIN
    UPDATE purchase_orders 
    SET payment_status = CASE
        WHEN NEW.paid_amount = 0 THEN 'pending'
        WHEN NEW.paid_amount < NEW.total_amount THEN 'partial'
        WHEN NEW.paid_amount >= NEW.total_amount THEN 'paid'
        ELSE payment_status
    END
    WHERE id = NEW.id;

    -- Audit log
    INSERT INTO audit_log (
        tenant_id, action, table_name, record_id, 
        old_data, new_data
    ) VALUES (
        NEW.tenant_id,
        'PAYMENT_UPDATE',
        'purchase_orders',
        NEW.id,
        json_object(
            'paid_amount', OLD.paid_amount,
            'payment_status', OLD.payment_status
        ),
        json_object(
            'paid_amount', NEW.paid_amount,
            'payment_status', NEW.payment_status
        )
    );
END;
