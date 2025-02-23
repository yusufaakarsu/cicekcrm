-- Core System Triggers
-- Yeni tenant oluşturulduğunda otomatik ayarlar oluştur
CREATE TRIGGER trg_after_tenant_insert 
AFTER INSERT ON tenants 
BEGIN
    -- Varsayılan ayarlar oluştur
    INSERT INTO tenant_settings (tenant_id, require_stock, track_recipes)
    VALUES (NEW.id, 1, 1);

    -- Ana kasa oluştur
    INSERT INTO accounts (tenant_id, name, type, initial_balance)
    VALUES (NEW.id, 'Ana Kasa', 'cash', 0);

    -- Log kaydı
    INSERT INTO audit_log (tenant_id, action, table_name, record_id, new_data)
    VALUES (NEW.id, 'INSERT', 'tenants', NEW.id, json_object('name', NEW.name));
END;

-- Tenant silinmeden önce ilişkili kayıtları kontrol et
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
    END;
END;

-- User INSERT işlemlerini logla
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
        json_object('role', NEW.role, 'is_active', NEW.is_active)
    );
END;

-- User UPDATE işlemlerini logla
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
        json_object('role', OLD.role, 'is_active', OLD.is_active),
        json_object('role', NEW.role, 'is_active', NEW.is_active)
    );
END;

-- Settings değişikliklerini logla
CREATE TRIGGER trg_after_settings_update 
AFTER UPDATE ON tenant_settings
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
        'tenant_settings',
        NEW.id,
        json_object(
            'require_stock', OLD.require_stock,
            'track_recipes', OLD.track_recipes,
            'allow_negative_stock', OLD.allow_negative_stock
        ),
        json_object(
            'require_stock', NEW.require_stock,
            'track_recipes', NEW.track_recipes,
            'allow_negative_stock', NEW.allow_negative_stock
        )
    );
END;

