-- Trigger: Sipariş hazır durumuna geçtiğinde stok düşümü yapılır
CREATE TRIGGER IF NOT EXISTS trg_order_status_ready 
AFTER UPDATE ON orders
WHEN NEW.status = 'ready' AND OLD.status != 'ready' AND NEW.deleted_at IS NULL
BEGIN
    -- Atölyede kaydedilmiş malzeme kullanımlarını stoktan düş
    INSERT INTO stock_movements (
        material_id, movement_type, quantity,
        source_type, source_id, notes, created_by, created_at
    )
    SELECT 
        oim.material_id, 'out', oim.quantity,
        'sale', NEW.id, 'Sipariş malzeme kullanımı',
        NEW.updated_by, datetime('now')
    FROM order_items_materials oim
    WHERE oim.order_id = NEW.id
    AND oim.deleted_at IS NULL;
    
    -- Sipariş hazırlandı bilgisini güncelle
    UPDATE orders
    SET preparation_end = datetime('now'),
        prepared_by = NEW.updated_by
    WHERE id = NEW.id;
END;

-- Trigger: Sipariş iptal edildiğinde stokları geri al (hazır, yolda veya teslim edildi durumları)
CREATE TRIGGER IF NOT EXISTS trg_order_status_cancelled
AFTER UPDATE ON orders
WHEN NEW.status = 'cancelled' AND OLD.status IN ('ready', 'delivering', 'delivered') AND NEW.deleted_at IS NULL
BEGIN
    -- Stok hareketlerini geri al - ters yönde kayıt oluştur
    INSERT INTO stock_movements (
        material_id,
        movement_type,
        quantity,
        source_type,
        source_id,
        notes,
        created_by,
        created_at
    )
    SELECT 
        sm.material_id,
        'in', -- Tersine hareket
        sm.quantity,
        'adjustment',
        NEW.id,
        'İptal edilen sipariş stok iadesi',
        NEW.updated_by,
        datetime('now')
    FROM stock_movements sm
    WHERE sm.source_type = 'sale'
    AND sm.source_id = NEW.id
    AND sm.movement_type = 'out'
    AND sm.deleted_at IS NULL;
END;


-- Siparişlerin iptal edilmesi durumunda ödeme işlemlerini iptal et
DROP TRIGGER IF EXISTS trg_after_order_status_cancelled;

-- Sipariş iptal edildiğinde ilgili ödemeleri iptal et (deleted_at)
-- Bu sayede var olan trg_after_transaction_delete trigger'ı hesap bakiyelerini düzeltecek
CREATE TRIGGER trg_after_order_status_cancelled
AFTER UPDATE ON orders
WHEN NEW.status = 'cancelled' AND OLD.status != 'cancelled'
BEGIN
    -- Önce ödeme durumunu cancelled olarak güncelle
    UPDATE orders
    SET payment_status = 'cancelled'
    WHERE id = NEW.id;
    
    -- Ardından ilgili ödeme işlemlerini sil (soft delete)
    -- Bu işlem var olan trg_after_transaction_delete trigger'ını tetikleyecek
    UPDATE transactions
    SET deleted_at = datetime('now'),
        status = 'cancelled',
        notes = COALESCE(notes, '') || ' - Sipariş iptali nedeniyle iptal edildi'
    WHERE related_type = 'order' 
    AND related_id = NEW.id
    AND deleted_at IS NULL;
    
    -- Eğer müşteriden tahsil edilmiş bir tutar varsa, sıfırla
    -- Bu sayede sonraki raporlamalarda daha doğru veriler görülür
    UPDATE orders 
    SET paid_amount = 0
    WHERE id = NEW.id;
END;
