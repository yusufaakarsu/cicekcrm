# Çiçek CRM - Ürün ve Sipariş İş Akışı

## 1. Ürün Yönetimi

### 1.1 Ürün Tanımlama
- Ürünün temel bilgileri girilir:
  * Ürün adı
  * Kategori
  * Satış fiyatı
  * Açıklama
  * Durum (aktif/pasif)

### 1.2 Taslak Reçete
- Her ürün için tahmini/önerilen malzemeler tanımlanır:
  * Kullanılabilecek ham maddeler 
  * Önerilen miktarlar
  * Malzeme notları
  * İşçilik maliyeti
  * Hazırlama süresi

### 1.3 Maliyet Hesaplama
- Reçetedeki malzemelerin birim fiyatları üzerinden:
  * Hammadde maliyeti
  * İşçilik maliyeti 
  * Toplam maliyet hesaplanır
- Bu maliyet tahmini/önerilen maliyettir

## 2. Sipariş Süreci

### 2.1 Sipariş Alma
- Müşteri bilgileri
- Alıcı bilgileri  
- Teslimat bilgileri
- Ürün seçimi
- Ödeme bilgileri

### 2.2 Atölye Süreci
1. Sipariş atölyeye düşer
2. Atölye personeli siparişi görür
3. Ürünün taslak reçetesi görüntülenir
4. Ürün hazırlanır
5. **Gerçek kullanılan malzemeler girilir:**
   * Hangi malzeme
   * Ne kadar kullanıldı
   * Ek notlar

### 2.3 Stok ve Maliyet İşlemleri
1. Kullanılan malzemeler stoktan düşülür
2. Gerçek maliyet hesaplanır:
   * Kullanılan malzemelerin güncel fiyatları
   * Girilen işçilik maliyeti
   * Toplam maliyet

## 3. İlgili Tablolar

### 3.1 Hammadde ve Stok Tabloları
- raw_materials
- material_price_history
- stock_movements 

### 3.2 Ürün Tabloları
- products
- product_categories
- product_materials

### 3.3 Sipariş Tabloları
- orders
- order_items
- order_items_materials

## 4. İş Kuralları

1. Ürünlerin standart reçetesi yoktur, sadece tavsiye niteliğindedir
2. Gerçek malzeme kullanımı sipariş hazırlanırken girilir
3. Stok düşümü ve maliyet hesabı gerçek kullanıma göre yapılır
4. Her sipariş için benzersiz reçete kaydı tutulur
5. Malzeme fiyatları değişkendir, her kullanımda güncel fiyat alınır

## 5. Süreç Özeti

1. Ürün tanımlama:
   - Temel bilgileri gir
   - Tavsiye reçete hazırla
   - Satış fiyatını gir

2. Sipariş alma:
   - Ürün seç
   - Müşteri/alıcı bilgileri al
   - Teslimat planla
   - Ödeme al

3. Atölye süreci:
   - Siparişi görüntüle
   - Tavsiye reçeteyi incele
   - Ürünü hazırla
   - Gerçek malzeme kullanımını kaydet
   - Süre ottomatik hesaplanır Siparişler tablosuna trigger ile kaydedilir

4. Tamamlama:
    - Atölye sipariş durumunu hazır yapınca
   - Stok düş
   - Maliyet hesapla
   - Sipariş durumu güncelle
