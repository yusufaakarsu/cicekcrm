-- 1. Tedarikçi işlemleri için trigger
CREATE TRIGGER trg_after_supplier_insert
AFTER INSERT ON suppliers
BEGIN
    -- Audit log kaydı
    INSERT INTO audit_log (
        tenant_id,
        action,
        table_name,
        record_id,
        new_data
    )
    VALUES (
        NEW.tenant_id,
        'INSERT',
        'suppliers',
        NEW.id,
        json_object(
            'name', NEW.name,
            'contact_name', NEW.contact_name,
            'phone', NEW.phone,
            'status', NEW.status
        )
    );
END;

-- 2. Ham madde işlemleri için trigger
CREATE TRIGGER trg_after_raw_material_insert
AFTER INSERT ON raw_materials
BEGIN
    -- Audit log kaydı
    INSERT INTO audit_log (
        tenant_id,
        action,
        table_name,
        record_id,
        new_data
    )
    VALUES (
        NEW.tenant_id,
        'INSERT',
        'raw_materials',
        NEW.id,
        json_object(
            'name', NEW.name,
            'unit_id', NEW.unit_id,
            'category_id', NEW.category_id,
            'status', NEW.status
        )
    );
END;

-- 3. Fatura (Satın alma) işlemleri için trigger
CREATE TRIGGER trg_after_purchase_insert
AFTER INSERT ON purchase_orders
BEGIN
    -- Audit log kaydı
    INSERT INTO audit_log (
        tenant_id,
        action,
        table_name,
        record_id,
        new_data
    )
    VALUES (
        NEW.tenant_id,
        'INSERT',
        'purchase_orders',
        NEW.id,
        json_object(
            'supplier_id', NEW.supplier_id,
            'order_date', NEW.order_date,
            'notes', NEW.notes
        )
    );
END;

-- 4. Fatura kalemi eklendiğinde stok girişi yap
CREATE TRIGGER trg_after_purchase_item_insert
AFTER INSERT ON purchase_order_items
BEGIN
    -- Stok hareketi oluştur
    INSERT INTO stock_movements (
        tenant_id,
        material_id,
        movement_type,
        quantity,
        source_type,
        source_id,
        notes,
        created_by
    )
    SELECT 
        po.tenant_id,
        NEW.material_id,
        'in',
        NEW.quantity,
        'purchase',
        po.id,
        'Satın alma faturası: ' || po.id,
        po.created_by
    FROM purchase_orders po
    WHERE po.id = NEW.order_id;

    -- Fiyat geçmişini güncelle
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
        po.order_date
    FROM purchase_orders po
    WHERE po.id = NEW.order_id;

    -- Tedarikçi ödemesi oluştur
    INSERT INTO transactions (
        tenant_id,
        account_id,
        category_id,
        type,
        amount,
        date,
        related_type,
        related_id,
        payment_method,
        description,
        status,
        created_by
    )
    SELECT 
        po.tenant_id,
        (SELECT id FROM accounts WHERE tenant_id = po.tenant_id AND type = 'cash' LIMIT 1),
        (SELECT id FROM transaction_categories WHERE tenant_id = po.tenant_id AND name = 'Tedarikçi Ödemesi' LIMIT 1),
        'out',
        NEW.quantity * NEW.unit_price,
        CURRENT_TIMESTAMP,
        'purchase',
        po.id,
        'cash',
        'Satın alma ödemesi: ' || (SELECT name FROM suppliers WHERE id = po.supplier_id),
        'completed',
        po.created_by
    FROM purchase_orders po
    WHERE po.id = NEW.order_id;
END;

-- 5. Tedarikçi güncellendiğinde
CREATE TRIGGER trg_after_supplier_update
AFTER UPDATE ON suppliers
BEGIN
    INSERT INTO audit_log (
        tenant_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data
    )
    VALUES (
        NEW.tenant_id,
        'UPDATE',
        'suppliers',
        NEW.id,
        json_object(
            'name', OLD.name,
            'contact_name', OLD.contact_name,
            'phone', OLD.phone,
            'status', OLD.status
        ),
        json_object(
            'name', NEW.name,
            'contact_name', NEW.contact_name,
            'phone', NEW.phone,
            'status', NEW.status
        )
    );
END;

-- 6. Ham madde güncellendiğinde
CREATE TRIGGER trg_after_raw_material_update
AFTER UPDATE ON raw_materials
BEGIN
    INSERT INTO audit_log (
        tenant_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data
    )
    VALUES (
        NEW.tenant_id,
        'UPDATE',
        'raw_materials',
        NEW.id,
        json_object(
            'name', OLD.name,
            'unit_id', OLD.unit_id,
            'category_id', OLD.category_id,
            'status', OLD.status
        ),
        json_object(
            'name', NEW.name,
            'unit_id', NEW.unit_id,
            'category_id', NEW.category_id,
            'status', NEW.status
        )
    );
END;

-- 7. Fatura silindiğinde (soft delete)
CREATE TRIGGER trg_after_purchase_delete
AFTER UPDATE ON purchase_orders
WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL
BEGIN
    -- İlgili stok hareketlerini iptal et
    UPDATE stock_movements
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE source_type = 'purchase' 
    AND source_id = OLD.id;
    
    -- İlgili finansal işlemi iptal et
    UPDATE transactions
    SET status = 'cancelled',
        deleted_at = CURRENT_TIMESTAMP
    WHERE related_type = 'purchase' 
    AND related_id = OLD.id;

    -- Audit log kaydı
    INSERT INTO audit_log (
        tenant_id,
        action,
        table_name,
        record_id,
        old_data
    )
    VALUES (
        OLD.tenant_id,
        'DELETE',
        'purchase_orders',
        OLD.id,
        json_object(
            'supplier_id', OLD.supplier_id,
            'order_date', OLD.order_date,
            'notes', OLD.notes
        )
    );
END;

-- 8. Ham madde silindiğinde kontrol (hard delete engelleme)
CREATE TRIGGER trg_before_raw_material_delete
BEFORE DELETE ON raw_materials
BEGIN
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM stock_movements 
            WHERE material_id = OLD.id 
            AND deleted_at IS NULL
        )
        THEN RAISE(ABORT, 'Bu ham maddeye ait stok hareketleri var')
        
        WHEN EXISTS (
            SELECT 1 FROM product_materials 
            WHERE material_id = OLD.id 
            AND deleted_at IS NULL
        )
        THEN RAISE(ABORT, 'Bu ham madde ürün reçetelerinde kullanılıyor')
    END;
END;
