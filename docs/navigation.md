# Çiçek CRM Sistem Yapısı

## 1. DASHBOARD (/)
- Ana sayfa istatistikleri
- Günlük siparişlerin özeti
- Kritik stok bildirimleri
- Günlük teslimatlar
- Yaklaşan özel günler
- Finansal özet

## 2. SİPARİŞLER (/orders)

### Sipariş Listesi
- URL: /orders/orders.html
- Özellikler:
  * Sipariş listesi tablosu
  * Filtreleme (tarih, durum, müşteri vb.)
  * Sipariş detay modalı
  * Sipariş durumu güncelleme
  * Teslimat atama

### Yeni Sipariş
- URL: /orders/new-order.html
- Özellikler:
  * Ürün seçimi
  * Müşteri seçimi/ekleme
  * Alıcı seçimi/ekleme
  * Teslimat adresi seçimi/ekleme
  * Teslimat tarihi/saati belirleme
  * Kart mesajı ekleme
  * Ödeme bilgileri

## 3. ÜRÜNLER & STOK

### Ürün Listesi
- URL: /products/products.html
- Özellikler:
  * Ürün kataloğu
  * Kategori bazlı filtreleme
  * Ürün detay görüntüleme
  * Fiyat güncelleme
  * Ürün durumu değiştirme

### Kategoriler
- URL: /products/categories.html
- Özellikler:
  * Kategori listesi
  * Kategori ekleme/düzenleme
  * Kategori durumu değiştirme

### Stok Yönetimi
- URL: /stock/stock.html
- Özellikler:
  * Ham madde listesi
  * Stok seviyesi takibi
  * Stok hareketi ekleme
  * Hareket geçmişi görüntüleme
  * Kritik stok uyarıları

### Satın Alma
- URL: /purchases/purchases.html
- Özellikler:
  * Satın alma siparişleri listesi
  * Yeni sipariş oluşturma
  * Sipariş durumu güncelleme
  * Mal kabul işlemleri
  * Tedarikçi bazlı raporlama

### Tedarikçiler
- URL: /suppliers/suppliers.html
- Özellikler:
  * Tedarikçi listesi
  * Tedarikçi ekleme/düzenleme
  * İletişim bilgileri yönetimi
  * Tedarikçi durumu (aktif/pasif/kara liste)

## 4. MÜŞTERİLER
- URL: /customers/customers.html
- Özellikler:
  * Müşteri listesi
  * Müşteri ekleme/düzenleme
  * Sipariş geçmişi
  * Alıcı yönetimi
  * Adres yönetimi
  * Özel gün takibi

## 5. TESLİMAT
- URL: /delivery/delivery.html
- Özellikler:
  * Teslimat listesi
  * Kurye atama
  * Rota planlama
  * Teslimat durumu takibi
  * Teslimat bölgeleri yönetimi

## 6. FİNANS
- URL: /finance/finance.html
- Özellikler:
  * Genel durum raporu
  * Gelir/gider takibi
  * Kasa/banka hesapları
  * Ödeme işlemleri
  * Finansal raporlar

## 7. TAKVİM
- URL: /calendar/calendar.html
- Özellikler:
  * Teslimat planlaması
  * Özel gün hatırlatmaları
  * Randevu yönetimi
  * Takvim senkronizasyonu

## 8. AYARLAR
- URL: /settings/settings.html
- Özellikler:
  * Kullanıcı yönetimi
  * Firma bilgileri
  * Hazır mesajlar
  * Email şablonları
  * Sistem ayarları

## Teknik Notlar

### Modüller Arası İlişkiler
1. Ürünler -> Stok: Reçete bazlı stok düşme
2. Siparişler -> Müşteriler: Müşteri ve alıcı bilgileri
3. Siparişler -> Teslimat: Teslimat planlaması
4. Siparişler -> Finans: Ödeme takibi
5. Satın Alma -> Stok: Stok girişleri
6. Satın Alma -> Finans: Tedarikçi ödemeleri

### Veri Yapısı
- Her kayıt tenant_id ile izole edilmiş
- Soft delete yaklaşımı (deleted_at)
- Audit log kaydı
- İlişkisel veritabanı yapısı
