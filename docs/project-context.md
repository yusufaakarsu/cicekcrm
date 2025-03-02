# CCRM Proje Bağlam Belgesi

## Proje Genel Bakış
CCRM (Çiçek Müşteri İlişkileri Yönetimi), çiçek dükkanları için kapsamlı bir CRM/ERP sistemidir ve şu teknolojilerle inşa edilmiştir:
- **Ön Uç**: Statik HTML + Vanilla JS + Bootstrap 5
- **Arka Uç**: Cloudflare Workers (TypeScript)
- **Veritabanı**: Cloudflare D1 (SQLite tabanlı)
- **Altyapı**: Cloudflare Pages (ön uç) + Workers (API)

Sistem, çiçek dükkanı iş akışını tamamen yönetir: müşteri yönetimi, sipariş işleme, envanter kontrolü, satın alma ve finansal takip.

## Temel Mimari Noktalar

### Ön Uç (`/public`)
- Özel CSS yok, yalnızca Bootstrap 5 ve Bootstrap İkonları kullanılıyor
- Vanilla JavaScript (çerçeve kullanılmıyor)
- Özelliklere göre modüler yapı (müşteriler, siparişler vb.)
- Ortak bileşenler `/public/js/common.js` dosyasında
- Workers uç noktalarına fetch() ile API iletişimi
- Veri görselleştirme için Chart.js
- Masaüstü ve mobil kullanım için duyarlı tasarım

#### Ön Uç Yapısı
/public
  /js             # Ortak JavaScript yardımcı araçları
    common.js     # Paylaşılan fonksiyonlar (API fetch, biçimlendirme vb.)
  /customers      # Müşteri yönetimi ekranları
  /orders         # Sipariş yönetimi ekranları
  /stock          # Envanter yönetimi ekranları
  /purchases      # Satın alma ekranları
  /finance        # Finansal yönetim ekranları
  /settings       # Sistem ayarları ekranları
  index.html      # Kontrol paneli ekranı

### Arka Uç (`/workers`)
- TypeScript tabanlı Cloudflare Workers
- Yönlendirme ve ara katman için Hono çerçevesi
- Standartlaştırılmış yanıtlarla RESTful API tasarımı
- Alanlara göre organize edilmiş rotalar (`/routes/*.ts`)
- Genel hata işleme ve CORS etkin
- JWT kimlik doğrulama (planlanmış)
- İş mantığı ayrımı için servis deseni
- Yerel geliştirme yok, Cloudflare alt domaininde test

#### API Yanıt Formatı
// Başarılı yanıt
{
  success: true,
  data: { ... }  // Varlığa özgü veriler
}

// Hata yanıtı
{
  success: false,
  error: "İnsan tarafından okunabilir hata mesajı",
  details: "Teknik detaylar (yalnızca geliştirme sırasında)"
}

### Veritabanı (`/migrations`)
- SQLite tabanlı Cloudflare D1
- Amaca göre numaralandırılmış sıralı göç dosyaları
- Temel tablolar:
  - müşteriler, alıcılar, adresler
  - siparişler, sipariş_öğeleri, sipariş_öğeleri_malzemeleri
  - ürünler, ürün_kategorileri, ürün_malzemeleri
  - ham_maddeler, ham_madde_kategorileri, stok_hareketleri
  - tedarikçiler, satın_alma_siparişleri, satın_alma_sipariş_öğeleri
  - hesaplar, işlemler, işlem_kategorileri
  - kullanıcılar, denetim_kayıtları, birimler, teslimat_bölgeleri, kart_mesajları

#### Temel Veritabanı Özellikleri
- Tüm tablolarda yumuşak silme (`deleted_at`)
- Tüm değişiklikleri yakalayan tetikleyicilerle denetim kaydı
- Referans bütünlüğü için dış anahtar kısıtlamaları
- Durum numaralandırmaları için CHECK kısıtlamaları (ör. sipariş durumu iş akışı)
- Zaman damgası takibi (`created_at`, `updated_at`)
- Finansal işlemler için çift girişli muhasebe

### İş Alanı

#### Müşteri Yönetimi
- İletişim bilgileriyle müşteri profilleri
- Müşterilere bağlı alıcılar (teslimat hedefleri)
- Müşteri/alıcı başına birden fazla teslimat adresi
- Teslimat rotası optimizasyonu için adres coğrafi kodlaması
- Sipariş geçmişi ve tercih takibi
- Özel tarih takibi (doğum günleri, yıldönümleri)

#### Sipariş İşleme
- Çok durumlu iş akışı:
  - yeni → onaylandı → hazırlanıyor → hazır → teslim ediliyor → teslim edildi
  - Farklı aşamalarda iptal mümkün
- Planlanmış teslimat tarihi ve zaman dilimleri (sabah, öğleden sonra, akşam)
- Bölgeye dayalı teslimat fiyatlandırması
- Öntanımlı ve özel kart mesajları
- Ham maddelerden oluşan ürünler (malzeme listesi)
- Siparişler hazırlandığında otomatik stok azaltma

#### Envanter Yönetimi
- Birim dönüşümleriyle ham madde takibi
- Stok hareketleri takibi (giriş/çıkış)
- Minimum stok seviyesi uyarıları
- Malzemelerin kategori organizasyonu
- Stok değerlemesi (FIFO yöntemi)
- Geçmiş stok seviyesi raporlama

#### Satın Alma
- Tedarikçi yönetimi
- Satın alma siparişi oluşturma ve takip
- Kalite kontrol ile mal kabulü
- Kısmi teslimatlar ve ödemeler
- Mal kabulünde otomatik stok güncellemeleri
- Tedarikçi performans metrikleri

#### Finansal Yönetim
- Birden fazla hesap türü (nakit, banka, POS, çevrimiçi)
- Kategorize edilmiş işlemler
- Siparişler ve satın almalar için ödeme takibi
- Gider yönetimi
- Temel muhasebe raporları
- Nakit akışı tahmini

## Kod Organizasyonu ve Desenler

### İsimlendirme Kuralları
- **Dosyalar**: Göç dosyaları için snake_case, JS/TS dosyaları için camelCase
- **Veritabanı**: Tablolar ve sütunlar için snake_case
- **JavaScript**: Değişkenler ve fonksiyonlar için camelCase, sınıflar için PascalCase
- **CSS Sınıfları**: Bootstrap sınıfları artı özel format: `custom-[bileşen]-[varyant]`
- **API Uç Noktaları**: Çoğul kaynak adlarıyla RESTful kurallar

### Ortak Desenler
- **API Çağrıları**: Hepsi `common.js` içindeki `fetchAPI()` yardımcı fonksiyonuyla
- **Form İşleme**: FormData API ile veri toplama
- **Modal Diyaloglar**: CRUD işlemleri için Bootstrap modalleri
- **Durum Yönetimi**: Varlıklar arasında tutarlı durum numaralandırmaları
- **Hata İşleme**: Try-catch ile kullanıcı dostu mesajlar
- **Tarih Biçimlendirme**: Ortak yardımcı fonksiyonlar aracılığıyla
- **Yükleme Durumları**: Asenkron işlemler sırasında yükleme göstergeleri göster/gizle

### API Uç Nokta Desenleri
GET    /varlık                 # Varlıkları listele
POST   /varlık                 # Varlık oluştur
GET    /varlık/:id             # Varlık detaylarını al
PUT    /varlık/:id             # Varlığı güncelle
DELETE /varlık/:id             # Varlığı sil (yumuşak)
PUT    /varlık/:id/durum       # Varlık durumunu güncelle
GET    /varlık/:id/ilgili      # İlgili varlıkları al
POST   /varlık/:id/eylem       # Özel bir eylem gerçekleştir

## Geliştirme Yönergeleri
1. Yeni tabloların tümü `deleted_at` sütunu ile yumuşak silmeyi desteklemeli
2. CHECK kısıtlamaları ile uygun durum numaralandırmaları kullanılmalı
3. Denetim alanları her zaman eklenmeli (`created_at`, `updated_at`, `created_by`, `updated_by`)
4. Tüm ilişkilerde dış anahtar bütünlüğü korunmalı
5. Tutarlı yanıt formatlarıyla RESTful API desenleri takip edilmeli
6. Karmaşık SQL sorguları mantığı açıklayan yorumlarla belgelenmeli
7. Tüm UI öğeleri için Bootstrap bileşenleri kullanılmalı (özel stil yok)
8. Ön uç kodu modüler organizasyonla vanilla JS olarak tutulmalı
9. Hatalar kullanıcı dostu mesajlarla zarifçe ele alınmalı
10. Tüm asenkron işlemler için yükleme durumları eklenmeli
11. Para birimi ve tarihler yardımcı fonksiyonlarla tutarlı şekilde biçimlendirilmeli
12. Tüm veritabanı sorguları için hazır ifadeler kullanılmalı

## Performans Hususları
- JS'de DOM manipülasyonu en aza indirilmeli
- Büyük veri setleri için sayfalama kullanılmalı
- Sık sorgulanan sütunlar indekslenmeli
- Sık erişilen referans veriler önbelleğe alınmalı
- SQL sorguları uygun JOIN ve indekslerle optimize edilmeli
- Kontrol paneli metrikleri için verimli SQL kullanılmalı
- 300 ms'den uzun işlemlerde yükleme göstergeleri uygulanmalı

## Test
- Henüz yerel geliştirme ortamı yok
- Testler Cloudflare geliştirme alt domaininde yapılıyor
- Geliştirme dalından GitHub Pages ile otomatik dağıtım
- Postman/cURL ile manuel API testi
- Hata ayıklama için console.log (daha sonra uygun günlükleme ile değiştirilecek)

## Güvenlik Notları
- JWT ile kimlik doğrulama/yetkilendirme eklenecek
- Veriler hem istemci hem sunucu tarafında doğrulanmalı
- SQL enjeksiyonunu önlemek için hazır ifadeler kullanılmalı
- Belirli kökenler için CORS yapılandırıldı
- İçerik Güvenlik Politikası uygulanacak
- İstemci tarafı depolamada hassas veri saklanmamalı

## Bilinen Sınırlamalar
- Çevrimdışı destek yok
- Sınırlı yazdırma yetenekleri
- Henüz otomatik test yok
- Şu anda çoklu dil desteği yok
- Raporların özelleştirilmesi sınırlı
- Ödeme ağ geçitleriyle entegrasyon yok
- Manuel yedekleme süreci

## Gelecek Yol Haritası
- Kullanıcı kimlik doğrulama ve rol tabanlı izinler
- Gelişmiş raporlama ve analitik
- Sadakat programı yönetimi
- E-posta/SMS bildirimleri
- Ödeme ağ geçidi entegrasyonu
- Teslimat rotası optimizasyonu
- Self-servis müşteri portalı
- Teslimat personeli için mobil uygulama

## Proje Özgü Kelime Dağarcığı
- **Ham Maddeler**: Ürünleri oluşturmak için kullanılan fiziksel öğeler (çiçekler, ambalaj vb.)
- **Ürünler**: Satılabilen bitmiş öğeler (buketler, düzenlemeler vb.)
- **Alıcılar**: Siparişleri alan kişiler (müşteriden farklı olabilir)
- **Teslimat Bölgeleri**: Belirli teslimat ücretleriyle coğrafi alanlar
- **Kart Mesajları**: Hediye kartları için öntanımlı veya özel mesajlar
- **Stok Hareketleri**: Envanter seviyelerindeki değişiklikleri kaydeden girişler
- **Satın Alma Siparişleri**: Tedarikçilere verilen siparişleri kaydeden belgeler

## Geliştirme Ortamı Kurulumu

### Ön Koşullar
- Node.js v16+
- npm veya yarn
- Git
- Workers ve D1 erişimli Cloudflare hesabı
- Wrangler CLI (Cloudflare Workers CLI)

### Kurulum Adımları
1. Depoyu klonlayın: `git clone https://github.com/kullaniciadi/ccrm.git`
2. Bağımlılıkları yükleyin: `npm install`
3. Cloudflare kimlik bilgilerini yapılandırın:
   - Gerekli ortam değişkenleriyle `.dev.vars` dosyasını oluşturun
   - `wrangler.toml` dosyasını uygun veritabanı bağlarıyla güncelleyin
4. Yerel olarak çalıştırın: `npm run dev`

### Yerel Geliştirme İş Akışı
1. `/public` içindeki ön uç dosyalarında değişiklik yapın
2. API değişikliklerini doğrudan API uç noktalarına çağrılarla test edin
3. Hata ayıklama için Tarayıcı Geliştirici Araçlarını kullanın
4. `/migrations` dizininde veritabanı göçleri oluşturun
5. Göçleri wrangler CLI ile uygulayın

## Dağıtım İş Akışı

### Ara Ortam Dağıtımları
1. Değişiklikleri geliştirme dalına kaydedin
2. Ara ortama otomatik dağıtım
3. Ara ortamda manuel test
4. Hazır olduğunda ana dal için PR oluşturun

### Üretim Dağıtımları
1. PR’yi ana dala birleştirin
2. CI/CD hattı testleri çalıştırır ve yapıları oluşturur
3. Üretime otomatik dağıtım
4. Dağıtım sonrası doğrulama

## Yaygın Sorun Giderme

### API Hataları
- Tarayıcı konsolunda hata mesajlarını kontrol edin
- API uç nokta yollarının doğru olduğunu doğrulayın
- Arka uç hataları için sunucu günlüklerini kontrol edin
- İsteklerdeki veri formatlarını doğrulayın

### Veritabanı Sorunları
- Göçlerin doğru sırayla çalıştığından emin olun
- Dış anahtar kısıtlama ihlallerini kontrol edin
- Doğrudan DB sorgularıyla veri bütünlüğünü doğrulayın
- Denetim için SQLite tarayıcı araçlarını kullanın

### Ön Uç Sorunları
- Tarayıcı önbelleğini temizleyin
- JS konsol hatalarını kontrol edin
- Ağ sekmesiyle API yanıtlarını doğrulayın
- Gizli/özel modda test edin

## Önemli Katkıda Bulunanlar ve İletişim
- Yusuf Akarsu - Proje Lideri - yusufaakarsu@gmail.com
- Hilal Akarsu - Ön Uç Geliştirici - aktasshilall@outlook.com
- Hümeyra Aktaş - Arka Uç Geliştirici - humeyraktas@gmail.com