# Minimal Gerekli Trigger'lar

## 1. Stok Yönetimi Trigger'ları

### trg_after_purchase_items_insert
- purchase_order_items tablosuna insert sonrası
- total_amount hesaplama
- Fiyat geçmişi güncelleme

### trg_after_stock_movement
- stock_movements tablosuna insert sonrası
- raw_materials stok miktarı güncelleme

## 2. Sipariş Yönetimi Trigger'ları

### trg_after_order_items_insert
- order_items tablosuna insert sonrası
- order toplam tutarını hesaplama

### trg_after_order_status_update
- orders status değişikliğinde
- Hazırlama/teslimat zamanlarını güncelleme

## 3. Finans Yönetimi Trigger'ları

### trg_after_transaction_insert
- transactions tablosuna insert sonrası
- Hesap bakiyesi güncelleme
- Ödeme durumu güncelleme

### trg_after_transaction_cancel
- transaction iptal edildiğinde
- Hesap bakiyesi düzeltme
- Ödeme durumu düzeltme

## 4. Denetim (Audit) Trigger'ları

### trg_after_user_auth
- Kullanıcı giriş/yetki değişiklikleri
- Audit log kayıtları

### trg_after_sensitive_update
- Önemli tablo güncellemeleri
- Değişiklik logları

Toplam: 8 temel trigger ile sistem çalışabilir. Diğer işlemler uygulama katmanında yönetilebilir.

## Notlar

1. Her trigger tek sorumluluk prensibine uymalı
2. Cascade güncellemelerden kaçınılmalı  
3. Döngüsel tetiklemeler engellenmeli
4. Performance için index'ler önemli
5. Hata yönetimi eklenmeli

Trigger'lar sade ve bakımı kolay tutulmalı, karmaşık iş mantığı uygulama katmanına taşınmalı.
