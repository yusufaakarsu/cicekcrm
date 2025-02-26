DROP TRIGGER IF EXISTS trg_after_tenant_insert;
DROP TRIGGER IF EXISTS trg_before_tenant_delete;
DROP TRIGGER IF EXISTS trg_after_user_insert;
DROP TRIGGER IF EXISTS trg_after_user_update;
DROP TRIGGER IF EXISTS trg_after_settings_update;

-- Core System Triggers
CREATE TRIGGER trg_after_tenant_insert 
AFTER INSERT ON tenants 
BEGIN
    -- 1. Temel ayarlar
    INSERT INTO tenant_settings (
        tenant_id, 
        require_stock,
        track_recipes,
        allow_negative_stock
    )
    VALUES (NEW.id, 1, 1, 0);

    -- 2. Finansal Hesaplar
    INSERT INTO accounts (tenant_id, name, type, initial_balance, status) VALUES
        (NEW.id, 'Ana Kasa', 'cash', 0, 'active'),
        (NEW.id, 'Kredi Kartı', 'pos', 0, 'active'),
        (NEW.id, 'Banka', 'bank', 0, 'active');

    -- 3. Temel Birimler (Genişletilmiş)
    INSERT INTO units (tenant_id, name, code, description) VALUES
        (NEW.id, 'Adet', 'ADET', 'Tek parça ürünler'),
        (NEW.id, 'Dal', 'DAL', 'Tek dal çiçekler'),
        (NEW.id, 'Demet', 'DEMET', '10-12 dallık demetler'),
        (NEW.id, 'Kutu', 'KUTU', 'Ambalaj malzemeleri'),
        (NEW.id, 'Metre', 'METRE', 'Kurdele, şerit vb.'),
        (NEW.id, 'Gram', 'GRAM', 'Toz/granül malzemeler'),
        (NEW.id, 'Paket', 'PAKET', 'Paketli ürünler');

    -- 4. Ham Madde Kategorileri (Genişletilmiş)
    INSERT INTO raw_material_categories (tenant_id, name) VALUES
        -- Çiçekler
        (NEW.id, 'Kesme Çiçekler'),
        (NEW.id, 'İthal Çiçekler'),
        (NEW.id, 'Yeşillikler'),
        (NEW.id, 'Saksı Çiçekleri'),
        -- Ambalaj
        (NEW.id, 'Kutular'),
        (NEW.id, 'Vazolar'),
        (NEW.id, 'Seramikler'),
        (NEW.id, 'Sepetler'),
        -- Süsleme
        (NEW.id, 'Kurdeleler'),
        (NEW.id, 'Spreyler'),
        (NEW.id, 'Aksesuarlar'),
        (NEW.id, 'Kartlar'),
        -- Bakım
        (NEW.id, 'Topraklar'),
        (NEW.id, 'Gübreler'),
        (NEW.id, 'Bakım Ürünleri');

    -- 5. Ürün Kategorileri (Genişletilmiş)
    INSERT INTO product_categories (tenant_id, name, description) VALUES
        (NEW.id, 'Buketler', 'El buketleri ve demet çiçekler'),
        (NEW.id, 'Kutuda Çiçekler', 'Özel tasarım kutu aranjmanları'),
        (NEW.id, 'Vazoda Çiçekler', 'Cam vazolu aranjmanlar'),
        (NEW.id, 'Saksı Çiçekleri', 'Dekoratif bitkiler'),
        (NEW.id, 'Teraryum', 'Minyatür bahçeler'),
        (NEW.id, 'VIP Tasarımlar', 'Özel tasarım çiçekler'),
        (NEW.id, 'Mevsimseller', 'Mevsimlik özel ürünler'),
        (NEW.id, 'Cenaze Çelenkleri', 'Taziye çelenkleri');

    -- 6. İşlem Kategorileri (Genişletilmiş)
    INSERT INTO transaction_categories (tenant_id, name, type, reporting_code) VALUES
        -- Kasa İşlemleri
        (NEW.id, 'Kasa Açılış', 'in', 'CASH_OPEN'),
        (NEW.id, 'Kasa Sayım Farkı (+)', 'in', 'CASH_COUNT_PLUS'),
        (NEW.id, 'Kasa Sayım Farkı (-)', 'out', 'CASH_COUNT_MINUS'),
        -- Ortaklık İşlemleri
        (NEW.id, 'Ortak Para Girişi', 'in', 'PARTNER_IN'),
        (NEW.id, 'Ortak Para Çıkışı', 'out', 'PARTNER_OUT'),
        -- Satışlar
        (NEW.id, 'Nakit Satış', 'in', 'SALES_CASH'),
        (NEW.id, 'Kredi Kartı Satış', 'in', 'SALES_CARD'),
        (NEW.id, 'Havale/EFT Satış', 'in', 'SALES_BANK'),
        (NEW.id, 'Online Satış', 'in', 'SALES_ONLINE'),
        -- Giderler
        (NEW.id, 'Tedarikçi Ödemesi', 'out', 'SUPPLIER'),
        (NEW.id, 'Personel Maaş', 'out', 'SALARY'),
        (NEW.id, 'Kira Gideri', 'out', 'RENT'),
        (NEW.id, 'Elektrik Faturası', 'out', 'ELECTRIC'),
        (NEW.id, 'Su Faturası', 'out', 'WATER'),
        (NEW.id, 'Doğalgaz Faturası', 'out', 'GAS'),
        (NEW.id, 'İnternet Faturası', 'out', 'INTERNET'),
        (NEW.id, 'Telefon Faturası', 'out', 'PHONE'),
        (NEW.id, 'Vergi Ödemesi', 'out', 'TAX'),
        (NEW.id, 'SGK Ödemesi', 'out', 'INSURANCE'),
        (NEW.id, 'Genel Giderler', 'out', 'GENERAL');

    -- 7. Hazır Kart Mesajları
    INSERT INTO card_messages (tenant_id, category, title, content, display_order) VALUES
        (NEW.id, 'birthday', 'Doğum Günü', 'Nice mutlu, sağlıklı yıllara...', 10),
        (NEW.id, 'birthday', 'Yaş Günü - 2', 'Yeni yaşınız kutlu olsun...', 20),
        (NEW.id, 'anniversary', 'Yıldönümü', 'Nice mutlu yıllara...', 30),
        (NEW.id, 'get_well', 'Geçmiş Olsun', 'Acil şifalar dileriz...', 40),
        (NEW.id, 'love', 'Sevgiliye', 'Seni seviyorum...', 50);

    -- 8. Audit log kaydı
    INSERT INTO audit_log (
        tenant_id, 
        action, 
        table_name, 
        record_id, 
        new_data
    )
    VALUES (
        NEW.id, 
        'TENANT_SETUP', 
        'tenants', 
        NEW.id, 
        json_object(
            'name', NEW.name,
            'company', NEW.company_name,
            'email', NEW.contact_email
        )
    );
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

