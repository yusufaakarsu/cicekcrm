-- Malzeme kullanımı için trigger'lar
CREATE TRIGGER after_order_items_materials_insert
AFTER INSERT ON order_items_materials
BEGIN
    -- Stok miktarını güncelle
    UPDATE raw_materials 
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.material_id;

    -- Stok hareketi kaydet
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
        o.tenant_id,
        NEW.material_id,
        'out',
        NEW.quantity,
        'sale',
        NEW.order_id,
        'Sipariş hazırlama malzeme kullanımı',
        o.prepared_by
    FROM orders o
    WHERE o.id = NEW.order_id;
END;

-- Malzeme eklendiğinde güncel fiyatı getir ve toplam tutarı hesapla
CREATE TRIGGER trg_before_order_items_materials_insert
BEFORE INSERT ON order_items_materials
BEGIN
    -- En güncel fiyatı al ve unit_price'ı güncelle
    SELECT NEW.unit_price = COALESCE(
        (SELECT unit_price 
         FROM material_price_history
         WHERE material_id = NEW.material_id
         AND valid_from <= CURRENT_DATE
         AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
         ORDER BY valid_from DESC
         LIMIT 1),
        0  -- Fiyat bulunamazsa 0 
    );

    -- Toplam tutarı hesapla
    SELECT NEW.total_amount = NEW.quantity * NEW.unit_price;
END;

-- Sipariş iptal edildiğinde malzemeleri geri al
CREATE TRIGGER after_order_cancel
AFTER UPDATE ON orders
WHEN NEW.status = 'cancelled' AND OLD.status != 'cancelled'
BEGIN
    -- Stokları geri ekle
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

    -- Stok hareketi kaydet
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
        o.tenant_id,
        oim.material_id,
        'in',
        oim.quantity,
        'adjustment',
        o.id,
        'Sipariş iptali - malzeme iadesi',
        o.updated_by
    FROM orders o
    JOIN order_items_materials oim ON oim.order_id = o.id
    WHERE o.id = NEW.id;
END;

-- Sipariş durumu değiştiğinde
CREATE TRIGGER trg_after_order_status_update
AFTER UPDATE ON orders
WHEN NEW.status != OLD.status
BEGIN
    -- Hazırlama başlangıç/bitiş zamanını kaydet
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

    -- Log kaydı
    INSERT INTO audit_log (tenant_id, action, table_name, record_id, old_data, new_data)
    VALUES (
        NEW.tenant_id,
        'STATUS_CHANGE',
        'orders',
        NEW.id,
        json_object('status', OLD.status),
        json_object('status', NEW.status)
    );
END;

-- Sipariş malzemesi güncellendiğinde stok kontrolü
CREATE TRIGGER trg_after_order_material_update
AFTER UPDATE ON order_items_materials
WHEN NEW.quantity != OLD.quantity
BEGIN
    -- Stok miktarını güncelle
    UPDATE raw_materials 
    SET stock_quantity = stock_quantity + OLD.quantity - NEW.quantity
    WHERE id = NEW.material_id;

    -- Stok hareketi kaydet
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
        o.tenant_id,
        NEW.material_id,
        CASE WHEN NEW.quantity > OLD.quantity THEN 'out' ELSE 'in' END,
        ABS(NEW.quantity - OLD.quantity),
        'adjustment',
        o.id,
        'Sipariş malzeme miktarı güncelleme',
        o.updated_by
    FROM orders o
    WHERE o.id = NEW.order_id;
END;

-- Sipariş hazır olduğunda stok düşme ve maliyet hesaplama
CREATE TRIGGER trg_after_order_ready
AFTER UPDATE ON orders
WHEN NEW.status = 'ready' AND OLD.status = 'preparing'
BEGIN
    -- 1. Reçetedeki malzemeleri stoktan düş
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

    -- 2. Stok hareketlerini kaydet
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
        o.tenant_id,
        oim.material_id,
        'out',
        oim.quantity,
        'sale',
        o.id,
        'Sipariş tamamlandı - malzeme kullanımı',
        o.updated_by
    FROM orders o
    JOIN order_items_materials oim ON oim.order_id = o.id
    WHERE o.id = NEW.id;

    -- 3. Audit log kaydı
    INSERT INTO audit_log (
        tenant_id,
        action,
        table_name,
        record_id,
        new_data
    )
    VALUES (
        NEW.tenant_id,
        'ORDER_COMPLETED',
        'orders',
        NEW.id,
        json_object(
            'preparation_time', 
            strftime('%s', NEW.preparation_end) - strftime('%s', NEW.preparation_start)
        )
    );
END;

-- Stok kontrolü ve trigger sıralaması önemli, önce kontrol sonra işlem yapılmalı
CREATE TRIGGER trg_before_order_material_insert
BEFORE INSERT ON order_items_materials
BEGIN
    -- Stok kontrolü
    SELECT CASE 
        WHEN (
            SELECT allow_negative_stock 
            FROM tenant_settings 
            WHERE tenant_id = NEW.tenant_id
        ) = 0 
        AND (
            SELECT stock_quantity 
            FROM raw_materials 
            WHERE id = NEW.material_id
        ) < NEW.quantity
        THEN RAISE(ABORT, 'Yetersiz stok')
    END;
END;
