# Satın Alma Süreci

## 1. Ana Ekran Özellikleri

### 1.1 Filtreler
- Tedarikçi filtresi (supplier_id)
- Tarih filtresi
  - Bugün
  - Son 7 gün
  - Bu ay
  - Özel tarih aralığı
- Ödeme durumu (payment_status)
  - Bekleyen
  - Kısmi Ödeme
  - Ödendi
  - İptal
- Tutar aralığı filtreleme
  - Min tutar
  - Max tutar

### 1.2 Tablo Görünümü
- Sipariş No (#id)
- Tedarikçi Adı
- Sipariş Tarihi
- Ödeme Durumu (badge ile)
- Toplam Tutar
- Ödenen Tutar (varsa)
- İşlemler (Detay butonu)

## 2. Modal Yapıları

### 2.1 Yeni Sipariş Modalı
- Tedarikçi seçimi
- Sipariş tarihi
- Ürün listesi tablosu
  - Hammadde seçimi
  - Miktar girişi
  - Birim fiyat
  - Satır toplamı
  - Genel toplam
- Notlar
- Kaydet/İptal butonları

### 2.2 Detay Modalı
- Sipariş özet bilgileri
  - Tedarikçi
  - Tutar
  - Ödenen
  - Kalan
  - Durum
- Ürün listesi
- Ödeme formu (aynı modal içinde)
  - Ödeme tutarı
  - Hesap seçimi
  - Ödeme yöntemi

## 3. API Kullanımı

### 3.1 Endpoint'ler
- GET /api/purchase/orders (Listeleme)
- GET /api/purchase/orders/:id (Detay)
- POST /api/purchase/orders (Yeni sipariş)
- POST /api/purchase/orders/:id/payment (Ödeme)

### 3.2 Filtre Parametreleri
- supplier_id: Tedarikçi ID
- date_filter: Tarih filtresi tipi
- start_date: Başlangıç (özel aralık için)
- end_date: Bitiş (özel aralık için)
- min_amount: Minimum tutar
- max_amount: Maksimum tutar
- payment_status: Ödeme durumu

## 4. Görsel Öğeler

### 4.1 Status Badge'leri
- Bekliyor: bg-warning
- Kısmi Ödeme: bg-info
- Ödendi: bg-success
- İptal: bg-danger

### 4.2 Form Validasyonları
- Tedarikçi seçimi zorunlu
- En az 1 ürün girilmeli
- Miktar > 0 olmalı
- Birim fiyat >= 0 olmalı
- Ödeme tutarı kalan tutarı geçemez

## 5. JavaScript Fonksiyonları

### 5.1 Temel Fonksiyonlar
- loadPurchases(): Listeyi yükler
- showCreatePurchaseModal(): Yeni sipariş modalı
- addItemRow(): Ürün satırı ekler
- calculateRowTotal(): Satır toplamı hesaplar
- showPurchaseDetail(): Detay modalı
- makePayment(): Ödeme yapar

### 5.2 Helper Fonksiyonlar
- formatPrice(): Para birimi formatı
- formatDate(): Tarih formatı
- getStatusBadge(): Durum badge'i
- getStatusText(): Durum metni

## 1. Veri Modeli

### Tablolar ve İlişkiler
- **purchase_orders**: Ana sipariş bilgileri
  - total_amount: Toplam tutar
  - paid_amount: Ödenmiş tutar
  - payment_status: [pending, partial, paid, cancelled]
  - account_id: Ödeme yapılan hesap

- **purchase_order_items**: Sipariş kalemleri
  - quantity: Miktar
  - unit_price: Birim fiyat
  - material_id: Hammadde ID

- **stock_movements**: Stok hareketleri
  - material_id: Hammadde
  - movement_type: [in, out]
  - quantity: Miktar
  - source_type: [purchase, sale, waste, adjustment]

- **transactions**: Finansal işlemler
  - account_id: Hesap
  - type: [in, out]
  - amount: Tutar
  - status: İşlem durumu

- **accounts**: Kasa/Banka hesapları
  - balance_calculated: Güncel bakiye
  - type: [cash, pos, bank, online]

## 2. İş Akışı

### 2.1 Satın Alma Siparişi Oluşturma
1. Tedarikçi seçimi
2. Hammadde seçimi ve miktar girişi
3. Birim fiyat belirleme
4. Toplam tutar hesaplama
5. Sipariş kaydı

### 2.2 Stok Girişi (Otomatik)
1. Sipariş kaydedildiğinde trigger çalışır
2. Her kalem için stok hareketi oluşturulur
   - movement_type: 'in'
   - source_type: 'purchase'

### 2.3 Ödeme İşlemi
1. Ödeme modalı açılır
2. Sipariş özeti görüntülenir:
   - Toplam tutar
   - Ödenmiş tutar
   - Kalan tutar
3. Ödeme bilgileri girilir:
   - Ödeme tutarı
   - Ödeme yöntemi
   - Hesap seçimi
4. Ödeme kaydedilir

### 2.4 Finansal İşlemler (Otomatik)
1. Ödeme yapıldığında trigger çalışır
2. Transactions tablosuna kayıt atılır:
   - type: 'out'
   - related_type: 'purchase'
3. Hesap bakiyesi güncellenir:
   - balance_calculated azaltılır

## 3. Durum Kontrolleri

### 3.1 Ödeme Durumu (payment_status)
- **pending**: Hiç ödeme yapılmamış
- **partial**: Kısmi ödeme yapılmış
  - paid_amount < total_amount
- **paid**: Tamamen ödenmiş
  - paid_amount = total_amount
- **cancelled**: İptal edilmiş

### 3.2 Validasyonlar
1. Sipariş Oluşturma:
   - Tedarikçi zorunlu
   - En az bir kalem olmalı
   - Miktar > 0
   - Birim fiyat >= 0

2. Ödeme:
   - Tutar > 0
   - Tutar <= kalan_tutar
   - Hesap seçimi zorunlu
   - Ödeme yöntemi zorunlu

## 4. Güvenlik Kontrolleri
1. Ödeme tutarı toplam tutarı geçemez
2. Negatif ödeme yapılamaz
3. İptal edilmiş siparişe ödeme yapılamaz
4. Hesap bakiyesi negatife düşemez

## 5. Raporlama
1. Sipariş listesi:
   - Tedarikçi
   - Toplam tutar
   - Ödeme durumu
   - Kalem sayısı

2. Ödeme geçmişi:
   - Tarih
   - Tutar
   - Ödeme yöntemi
   - Hesap

## 6. Yaygın Senaryolar ve Çözümleri

### 6.1 Kısmi Ödeme İşlemleri
1. İlk Kısmi Ödeme
   - Status 'pending' -> 'partial' olur
   - paid_amount güncellenir
   - Kalan tutar hesaplanır

2. Tamamlayıcı Ödeme
   - Status 'partial' -> 'paid' olur
   - paid_amount = total_amount olur

### 6.2 Stok Yönetimi
1. Otomatik Stok Girişi
   - Sipariş onaylandığında
   - Her kalem için ayrı hareket
   - Birim dönüşümleri

2. Stok Düzeltmeleri
   - Eksik/fazla teslimat
   - Fire/zayi durumları
   - Manuel düzeltmeler

### 6.3 İptal/İade Süreçleri
1. Sipariş İptali
   - Henüz ödeme yapılmamış
   - Kısmi ödemeli
   - Tam ödemeli

2. Kısmi İade
   - Bazı kalemlerin iadesi
   - Stok ve ödeme düzeltmeleri
   - Yeni belge oluşturma

## 7. Kullanıcı İpuçları

### 7.1 Hızlı İşlemler
1. Filtreleme Kısayolları
   - "Bugün" butonu
   - "Bekleyen Ödemeler" butonu
   - "Son 7 Gün" butonu

2. Toplu İşlemler
   - Çoklu ödeme girişi
   - Toplu stok girişi
   - Excel'e aktarma

### 7.2 En İyi Pratikler
1. Sipariş Girişi
   - Önce tedarikçi seç
   - Sonra ürünleri ekle
   - Son olarak tarihleri belirle

2. Ödeme İşlemleri
   - Her gün kontrol et
   - Vadesi gelenleri işaretle
   - Eksik ödemeleri listele

3. Raporlama
   - Günlük kontroller
   - Haftalık özet
   - Aylık analiz

## 8. Sorun Giderme

### 8.1 Yaygın Hatalar
1. Veri Girişi
   - Yanlış miktar/fiyat
   - Eksik ürün
   - Tarih hataları

2. Ödeme İşlemleri
   - Mükerrer ödeme
   - Yanlış hesap seçimi
   - Tutarsız bakiyeler

### 8.2 Çözüm Yolları
1. Hatalı Kayıtlar
   - Düzeltme yöntemleri
   - İptal/silme prosedürleri
   - Yeni kayıt oluşturma

2. Veri Tutarsızlığı
   - Bakiye mutabakatı
   - Stok sayımı
   - Log kontrolü

## 9. Özelleştirme

### 9.1 Rapor Şablonları
1. Standart Raporlar
   - Günlük sipariş listesi
   - Ödeme raporu
   - Tedarikçi performansı

2. Özel Raporlar
   - Tarih bazlı analizler
   - Kategori bazlı raporlar
   - Karşılaştırmalı tablolar

### 9.2 Bildirimler
1. Otomatik Uyarılar
   - Vadesi gelen ödemeler
   - Stok altı ürünler
   - Bekleyen siparişler

2. Email/SMS Bildirimleri
   - Günlük özet
   - Kritik uyarılar
   - Onay bildirimleri
