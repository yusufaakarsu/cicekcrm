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
