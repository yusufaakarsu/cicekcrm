# Tablo Bazlı Trigger Listesi

## 1. Core Tablolar

### tenants
- AFTER INSERT: Varsayılan ayarlar oluştur
- BEFORE DELETE: İlişkili kayıtları kontrol et
- AFTER UPDATE: Audit log

### users
- AFTER INSERT: Audit log
- BEFORE DELETE: İlişkili işlemleri kontrol et
- AFTER UPDATE: Audit log

### tenant_settings
- AFTER UPDATE: Audit log

### audit_log
- (Trigger yok - Log tablosu)

## 2. Master Tablolar

### delivery_regions
- BEFORE INSERT: Parent bölge kontrolü
- AFTER INSERT/UPDATE/DELETE: Audit log

### units
- BEFORE INSERT: Kod benzersizlik kontrolü 
- AFTER INSERT/UPDATE/DELETE: Audit log

### raw_material_categories
- AFTER INSERT/UPDATE/DELETE: Audit log

## 3. Stok Yönetimi

### raw_materials
- AFTER INSERT: Stok kartı oluştur
- BEFORE DELETE: Stok ve reçete kontrolü
- AFTER UPDATE: Audit log + Fiyat güncellemesi

### suppliers
- AFTER INSERT/UPDATE/DELETE: Audit log
- BEFORE DELETE: Açık sipariş kontrolü

### stock_movements
- AFTER INSERT: 
  * Stok miktarı güncelle
  * Ortalama maliyet hesapla
- BEFORE DELETE: İzin verme
- AFTER UPDATE: İzin verme

## 4. Ürün Yönetimi

### product_categories
- AFTER INSERT/UPDATE/DELETE: Audit log

### products
- AFTER INSERT: Default reçete oluştur
- BEFORE DELETE: Sipariş kontrolü
- AFTER UPDATE: Audit log

### product_materials
- AFTER INSERT/UPDATE: 
  * Reçete maliyeti hesapla
  * Stok kontrolü

## 5. Müşteri Yönetimi

### customers
- AFTER INSERT/UPDATE: 
  * Telefon format kontrolü
  * Email format kontrolü
  * Audit log
- BEFORE DELETE: İlişkili sipariş kontrolü

### recipients
- AFTER INSERT/UPDATE: 
  * Telefon format kontrolü
  * Audit log
- BEFORE DELETE: İlişkili sipariş kontrolü

### addresses
- AFTER INSERT: Koordinat al (HERE API)
- AFTER UPDATE: Koordinat güncelle
- BEFORE DELETE: İlişkili sipariş kontrolü

### card_messages
- AFTER INSERT/UPDATE/DELETE: Audit log

## 6. Sipariş Yönetimi

### orders
- AFTER INSERT:
  * Sipariş numarası oluştur
  * Tutar hesapla
  * Stok rezerve et
- AFTER UPDATE status:
  * preparing -> reçete kopyala
  * delivered -> stok düş + kasa işle
  * cancelled -> stok iade
- BEFORE DELETE: İptal et, silme

### order_items
- AFTER INSERT/UPDATE/DELETE: 
  * Sipariş toplamını güncelle
  * Stok kontrolü

## 7. Finans Yönetimi

### accounts
- AFTER INSERT: Açılış bakiyesi işle
- BEFORE DELETE: Bakiye kontrolü
- AFTER UPDATE: Audit log

### transactions
- AFTER INSERT: 
  * Hesap bakiyesi güncelle
  * İlişkili kayıt güncelle
- BEFORE DELETE: İzin verme
- AFTER UPDATE: İzin verme

### transaction_categories
- AFTER INSERT/UPDATE/DELETE: Audit log

## 8. Satın Alma

### purchase_orders
- AFTER INSERT: Sipariş numarası oluştur
- AFTER UPDATE status:
  * received -> stok giriş
  * cancelled -> iptal
- BEFORE DELETE: İptal et, silme

### purchase_order_items
- AFTER INSERT/UPDATE/DELETE:
  * Sipariş toplamını güncelle
  * Fiyat geçmişi güncelle