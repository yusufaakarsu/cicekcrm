-- Önce tüm trigger'ları sil
DROP TRIGGER IF EXISTS trg_after_supplier_insert;
DROP TRIGGER IF EXISTS trg_after_raw_material_insert;
DROP TRIGGER IF EXISTS trg_after_purchase_insert;
DROP TRIGGER IF EXISTS trg_after_purchase_item_insert;
DROP TRIGGER IF EXISTS trg_after_supplier_update;
DROP TRIGGER IF EXISTS trg_after_raw_material_update;
DROP TRIGGER IF EXISTS trg_after_purchase_delete;
DROP TRIGGER IF EXISTS trg_before_raw_material_delete;
DROP TRIGGER IF EXISTS trg_after_stock_movement_update;
DROP TRIGGER IF EXISTS trg_after_purchase_item_update;
DROP TRIGGER IF EXISTS trg_after_material_price_change;
DROP TRIGGER IF EXISTS trg_after_purchase_item_insert_stock;

-- Basitleştirilmiş trigger - sadece stok hareketi ve fiyat geçmişi için
CREATE TRIGGER trg_after_purchase_item_insert 
AFTER INSERT ON purchase_order_items 
BEGIN 
    -- 1. Stok hareketi oluştur
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

    -- 2. Fiyat geçmişini güncelle
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
END;
