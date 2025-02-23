
-- 1. Müşteri validasyonları
CREATE TRIGGER trg_before_customer_insert
BEFORE INSERT ON customers
BEGIN
    -- Telefon format kontrolü (555-555-5555)
    SELECT CASE 
        WHEN NEW.phone NOT REGEXP '^[0-9]{3}-[0-9]{3}-[0-9]{4}$'
        THEN RAISE(ABORT, 'Geçersiz telefon formatı')
    END;
    
    -- Email format kontrolü (opsiyonel alan)
    SELECT CASE
        WHEN NEW.email IS NOT NULL 
        AND NEW.email NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        THEN RAISE(ABORT, 'Geçersiz email formatı')
    END;

    -- Mükerrer kayıt kontrolü
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM customers 
            WHERE tenant_id = NEW.tenant_id 
            AND phone = NEW.phone 
            AND deleted_at IS NULL
        )
        THEN RAISE(ABORT, 'Bu telefon numarası zaten kayıtlı')
    END;
END;

-- 2. Alıcı validasyonları
CREATE TRIGGER trg_before_recipient_insert
BEFORE INSERT ON recipients
BEGIN
    -- Telefon format kontrolü
    SELECT CASE 
        WHEN NEW.phone NOT REGEXP '^[0-9]{3}-[0-9]{3}-[0-9]{4}$'
        THEN RAISE(ABORT, 'Geçersiz telefon formatı')
    END;

    -- Müşteri aktif mi kontrolü
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM customers 
            WHERE id = NEW.customer_id 
            AND (deleted_at IS NOT NULL OR tenant_id != NEW.tenant_id)
        )
        THEN RAISE(ABORT, 'Geçersiz müşteri')
    END;
END;

-- 3. Adres işlemleri
CREATE TRIGGER trg_after_address_insert
AFTER INSERT ON addresses
BEGIN
    -- HERE API ile koordinat al (bu kısım worker'da yapılacak)
    UPDATE addresses 
    SET 
        lat = NULL, -- HERE API'den gelecek
        lng = NULL, -- HERE API'den gelecek
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;

    -- Bölge kontrolü
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM delivery_regions 
            WHERE tenant_id = NEW.tenant_id 
            AND name = NEW.district 
            AND is_active = 1
        )
        THEN RAISE(ABORT, 'Bu bölgeye teslimat yapılmamaktadır')
    END;
END;

-- 4. Müşteri silme kontrolü
CREATE TRIGGER trg_before_customer_delete
BEFORE DELETE ON customers
BEGIN
    -- Aktif sipariş kontrolü
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM orders 
            WHERE customer_id = OLD.id 
            AND status NOT IN ('delivered', 'cancelled')
        )
        THEN RAISE(ABORT, 'Aktif siparişi olan müşteri silinemez')
    END;

    -- Soft delete uygula
    UPDATE customers 
    SET deleted_at = CURRENT_TIMESTAMP 
    WHERE id = OLD.id;

    -- İlişkili kayıtları soft delete
    UPDATE recipients 
    SET deleted_at = CURRENT_TIMESTAMP 
    WHERE customer_id = OLD.id;

    UPDATE addresses 
    SET deleted_at = CURRENT_TIMESTAMP 
    WHERE customer_id = OLD.id;

    -- Asıl silme işlemini engelle
    SELECT RAISE(IGNORE);
END;

-- 5. Adres güncelleme logu
CREATE TRIGGER trg_after_address_update
AFTER UPDATE ON addresses
WHEN NEW.lat IS NOT NULL AND 
    (OLD.lat != NEW.lat OR OLD.lng != NEW.lng)
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
        'GEOCODE',
        'addresses',
        NEW.id,
        json_object('lat', OLD.lat, 'lng', OLD.lng),
        json_object('lat', NEW.lat, 'lng', NEW.lng)
    );
END;
