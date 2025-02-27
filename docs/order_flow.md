# Çiçek CRM Sipariş Süreci

## 1. Genel Bakış
Çiçek CRM sistemindeki sipariş süreci, müşteri kaydından başlayarak teslimatın tamamlanmasına kadar olan tüm adımları kapsar. Süreç özellikle çiçekçilik sektörünün ihtiyaçlarına göre özelleştirilmiştir ve reçeteye dayalı değil, esnek hammadde kullanımına izin verir.

## 2. Sipariş Oluşturma Adımları

### 2.1 Müşteri Seçimi veya Kaydı
- Kullanıcı `new-order.html` sayfasında telefon numarası ile müşteri araması yapar
- Eğer müşteri kayıtlı ise bilgileri otomatik doldurulur
- Kayıtlı değilse yeni müşteri formu açılır:
  * İsim, telefon ve diğer temel bilgiler girilir 
  * Müşteri bilgileri kaydedilir ve müşteri ID'si alınır
  * Sistem, yeni kayıtla ilgili bir bildirim gösterir

### 2.2 Adres Seçimi 
- Müşteri seçildikten sonra adres seçim/ekleme ekranına geçilir
- Müşterinin kayıtlı adresleri varsa listelenir
- Yeni adres eklemek için "Yeni Adres" seçeneği kullanılabilir:
  * HERE API ile adres araması yapılır
  * Adres seçilir ve ek detaylar (bina no, kat, daire no) eklenir
  * Adrese etiket (ev, iş vb.) ve tarif gibi bilgiler eklenebilir
- Adres bilgisi seçilince veya oluşturulunca bir sonraki adıma geçilir

### 2.3 Alıcı ve Teslimat Bilgileri
- Teslimat tarihi ve saati seçilir (sabah, öğlen, akşam)
- Alıcı bilgileri girilir:
  * Alıcı adı ve telefonu (zorunlu)
  * Alıcı notu (isteğe bağlı)
  * Kart mesajı (isteğe bağlı)

### 2.4 Ürün Seçimi
- Kategoriler ve arama ile ürünler listelenir
- Seçilen ürünler sepete eklenir
- Her ürün için adet ve fiyat bilgisi kaydedilir 
- Sipariş özeti görüntülenir ve toplam tutar hesaplanır

### 2.5 Sipariş Onaylama
- "Ürünleri Onayla ve Devam Et" butonuna tıklanır
- Sistem sipariş bilgilerini veritabanına kaydeder:
  * `orders` tablosuna ana sipariş bilgileri (ödeme durumu 'pending' olarak)
  * `order_items` tablosuna siparişteki ürünler
  * `recipients` tablosuna alıcı bilgileri
- Başarılı kayıt durumunda sipariş detay sayfasına yönlendirilir

## 3. Sipariş Durum Yönetimi

Sipariş oluşturulduktan sonra aşağıdaki durum akışını takip eder:

1. **Yeni (new)**: Sipariş yeni oluşturulmuştur
2. **Hazırlanıyor (preparing)**: Atölye çalışanları siparişi hazırlamaya başlamıştır
   - Bu aşamada gerçekte kullanılan malzemeler kaydedilir
   - Malzemeler `order_items_materials` tablosuna kaydedilir
   - Varsayılan reçete (ürünlere bağlı malzemeler) sadece referans amaçlıdır
3. **Hazır (ready)**: Sipariş hazır durumdadır ve teslimata hazırdır
   - Sipariş bu duruma geçince stok düşümü otomatik gerçekleşir
   - Trigger `trg_order_status_ready` çalışarak `stock_movements` tablosuna kayıt ekler
   - Kaydedilen gerçek malzeme kullanımları üzerinden stok düşülür
4. **Yolda (delivering)**: Sipariş teslimat için yoldadır
5. **Teslim Edildi (delivered)**: Sipariş müşteriye teslim edilmiştir
6. **İptal (cancelled)**: Sipariş iptal edilmiştir
   - Eğer sipariş hazır, yolda veya teslim edildi durumundayken iptal edilirse, stoklar geri iade edilir
   - Trigger `trg_order_status_cancelled` çalışarak tersine stok hareketleri oluşturur

## 4. Hammadde (Malzeme) Kullanımı ve Stok Yönetimi

Çiçek CRM'de stok yönetimi, çiçekçilik sektörünün özel ihtiyaçlarını karşılamak için tasarlanmıştır:

### 4.1 Ürün Reçeteleri vs. Gerçek Kullanım
- **Ürün Reçeteleri**: Her ürün için (`products` tablosunda) varsayılan hammadde kullanımları tanımlanabilir (`product_materials` tablosunda)
- **Gerçek Kullanım**: Atölye çalışanları, siparişi hazırlarken gerçek kullanılan malzemeleri kaydeder
  * Her sipariş farklı özelliklerde olabilir (renk, boyut, ekstra malzemeler)
  * Bu nedenle gerçek kullanım, varsayılan reçeteden farklılık gösterebilir

### 4.2 Stok Düşüm Mantığı
- Sipariş "hazır" durumuna geçtiğinde stok düşümü otomatik gerçekleşir
- Düşüm sırası:
  1. Eğer `order_items_materials` tablosunda sipariş için özel malzeme kayıtları varsa, bunlara göre stok düşülür
  2. Olmayan malzemeler için varsayılan reçeteler kullanılır (bu senaryo sistem tarafından desteklenmektedir, ancak normal kullanımda genellikle atölye çalışanları malzeme kullanımlarını kaydeder)

### 4.3 İptal Durumunda Stok İadesi
- Eğer "hazır", "yolda" veya "teslim edildi" durumlarından "iptal" durumuna geçiş olursa
- Önceden düşülen stoklar otomatik olarak iade edilir
- Bu işlem `trg_order_status_cancelled` trigger'ı tarafından yönetilir

## 5. Ödemeler ve Faturalama
- Sipariş oluşturulduğunda ödeme durumu "beklemede" (pending) olarak ayarlanır
- Ödeme işlemi sonradan siparişler listesinden seçilip yapılır:
  * Ödeme sayfasında ödeme yöntemi (nakit, kredi kartı, havale/EFT) seçilir
  * Ödeme tutarı girilir ve işlem kaydedilir
- Ödeme işlemi "accounts" ve "transactions" tabloları üzerinden takip edilir
- Ödeme yapıldığında sipariş ödeme durumu "ödendi" olarak güncellenir

## 6. Dikkat Edilmesi Gereken Noktalar
- Çiçek CRM'de stok düşümü, standart reçetelere göre değil gerçek malzeme kullanımına göre yapılır
- "Hazırlanıyor" durumundayken malzeme kullanımı kaydı yapılması önemlidir
- Siparişin durumu "Hazır" olarak değiştirildiğinde stok düşümü otomatik gerçekleşir
- İptal işlemlerinde stok iadesi otomatik yapılır
- Ödeme işlemi, sipariş kaydından ayrı olarak daha sonra gerçekleştirilir

---

## Teknik Referans

Sipariş sürecinde kullanılan temel tablolar:
- `orders`: Ana sipariş bilgileri
- `order_items`: Siparişteki ürünler
- `order_items_materials`: Gerçek malzeme kullanımı
- `recipients`: Alıcı bilgileri
- `addresses`: Teslimat adresleri
- `stock_movements`: Stok hareketleri

Sipariş sürecinde kullanılan trigger'lar:
- `trg_order_status_ready`: Sipariş hazır durumuna geçtiğinde stok düşer
- `trg_order_status_cancelled`: Sipariş iptal edildiğinde stoklar iade edilir