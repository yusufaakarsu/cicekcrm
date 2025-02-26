# Çiçek CRM Sistem Akışı ve Sorun Giderme Rehberi

## 1. Sipariş Oluşturma Süreci

### Frontend (orders.html)
1. Müşteri Seçimi
   - Mevcut müşteri seçimi veya yeni müşteri oluşturma
   - Müşteri bilgileri customers tablosuna kaydedilir
   - API: POST /api/customers

2. Alıcı Bilgileri
   - Mevcut alıcı seçimi veya yeni alıcı oluşturma
   - Alıcı bilgileri recipients tablosuna kaydedilir
   - API: POST /api/recipients

3. Teslimat Bilgileri
   - Bölge seçimi (delivery_regions tablosundan)
   - Seçilen bölgenin base_fee değeri orders.delivery_fee'ye yazılır
   - Adres bilgileri addresses tablosuna kaydedilir
   - API: POST /api/addresses

4. Sipariş Detayları
   - Ürün seçimi (products tablosundan)
   - Miktar girişi
   - Her ürün için orders_items tablosuna kayıt
   - Toplam tutar otomatik hesaplanır (trg_after_order_item_insert)

### Backend (orders.js)
1. Sipariş Kaydı
   - orders tablosuna ana kayıt
   - order_items tablosuna kalem kayıtları
   - Başlangıç durumu: 'new'

2. Trigger İşlemleri
   - trg_after_order_item_insert: Toplam tutarı hesaplar
   - Stok kontrolü henüz yapılmaz

## 2. Hazırlık Süreci

### Frontend (workshop.html) 
1. Yeni Siparişlerin Listelenmesi
   - status = 'new' olan siparişler
   - API: GET /api/orders?status=new

2. Hazırlama Başlangıcı
   - "Hazırlamaya Başla" butonu
   - API: PUT /api/orders/{id}/status
   - Yeni durum: 'preparing'

3. Malzeme Kullanımı
   - Ürün reçetesi görüntülenir (product_materials)
   - Gerçek kullanım miktarları girilir
   - API: POST /api/orders/{id}/materials

4. Hazırlama Bitişi
   - "Tamamla" butonu
   - API: PUT /api/orders/{id}/status
   - Yeni durum: 'ready'

### Backend İşlemler
1. Status = 'preparing' olduğunda:
   - trg_after_order_status_change tetiklenir
   - preparation_start ve prepared_by güncellenir
   - Audit log kaydı oluşur

2. Status = 'ready' olduğunda:
   - trg_after_order_ready tetiklenir
   - Stok kontrolü yapılır
   - Stok hareketi oluşturulur (stock_movements)
   - Malzeme maliyetleri hesaplanır
   - preparation_end güncellenir

## 3. Teslimat Süreci

### Frontend (delivery.html)
1. Hazır Siparişlerin Listelenmesi
   - status = 'ready' olan siparişler
   - API: GET /api/orders?status=ready

2. Kurye Ataması
   - Kurye seçimi
   - API: PUT /api/orders/{id}/courier

3. Teslimat Tamamlama
   - Teslim belgesi/fotoğraf yükleme
   - API: PUT /api/orders/{id}/complete

### Backend İşlemler
1. Teslimat Kaydı
   - delivered_at güncellenir
   - delivery_proof kaydedilir
   - status = 'delivered' olur

## 4. Ödeme Süreci

### Frontend (payments.html)
1. Ödeme Alma
   - Ödeme türü seçimi
   - Tutar girişi
   - API: POST /api/payments

### Backend İşlemler
1. Ödeme Kaydı
   - transactions tablosuna kayıt
   - orders.paid_amount güncellenir
   - trg_after_order_payment tetiklenir

2. Payment Status Güncelleme
   - Otomatik payment_status güncelleme
   - pending -> partial -> paid

## 5. Sorun Giderme

### Stok Sorunları
1. Yetersiz Stok
   - tenant_settings.allow_negative_stock kontrolü
   - Stok hareketi logları inceleme

### Ödeme Sorunları
1. Tutarsız Bakiyeler
   - transactions tablosu kontrolü
   - orders.paid_amount ve total_amount karşılaştırma

### Performans Sorunları
1. Yavaş Sorgular
   - İlgili indexler:
     * idx_orders_status
     * idx_orders_payment
     * idx_stock_movements_material

## 6. Veri Doğrulama

### Frontend Validasyonlar
1. Müşteri Formu
   - Zorunlu alanlar: name, phone
   - Format kontrolleri

2. Sipariş Formu
   - Teslimat tarihi kontrolü
   - Minimum sipariş tutarı kontrolü

### Backend Validasyonlar
1. Stok Kontrolleri
   - Negatif stok kontrolü
   - Miktar format kontrolü

2. Tutar Kontrolleri
   - Negatif tutar engelleme
   - Maximum limit kontrolleri

## 7. Audit ve Logging
1. Her İşlem İçin
   - Kullanıcı kaydı
   - Zaman damgası
   - Eski/yeni değerler
   - İşlem tipi

## 8. Raporlama
1. Günlük Raporlar
   - Ciro
   - Stok durumu
   - Bekleyen siparişler

2. Performans Metrikleri
   - Hazırlama süreleri
   - Teslimat süreleri
   - Ödeme süreleri