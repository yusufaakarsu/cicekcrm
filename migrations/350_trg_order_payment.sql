
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
