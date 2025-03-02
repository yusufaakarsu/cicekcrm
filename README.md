# 🌸 CCRM - Çiçek CRM/ERP Sistemi

Çiçek CRM, çiçekçi işletmeleri için tasarlanmış kapsamlı bir müşteri ilişkileri yönetimi (CRM) ve kurumsal kaynak planlama (ERP) sistemidir. Müşteri yönetimi, sipariş takibi, envanter kontrolü, satın alma ve finansal yönetim modüllerini entegre eden bu platform, çiçekçi işletmelerinin günlük operasyonlarını verimli bir şekilde yönetmeleri için gerekli tüm araçları sunmaktadır.

![Dashboard Ekranı](docs/screenshots/dashboard.png)

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Teknoloji Yığını](#️-teknoloji-yığını)
- [Proje Yapısı](#-proje-yapısı)
- [Kurulum](#-kurulum)
- [Kullanım Kılavuzu](#-kullanım-kılavuzu)
- [API Referansı](#-api-referansı)
- [Veritabanı Şeması](#-veritabanı-şeması)
- [Geliştirme Rehberi](#-geliştirme-rehberi)
- [Test Etme](#-test-etme)
- [Sorun Giderme](#-sorun-giderme)
- [Dağıtım](#-dağıtım)
- [Sürüm Notları](#-sürüm-notları)
- [Katkıda Bulunanlar](#-katkıda-bulunanlar)
- [SSS](#-sık-sorulan-sorular)
- [Lisans](#-lisans)

## 🚀 Özellikler

### 👥 Müşteri Yönetimi
- Müşteri kayıtları ve iletişim bilgileri
- Teslimat alıcıları ve çoklu adres yönetimi
- Müşteri sipariş geçmişi ve tercih takibi
- Doğum günü ve özel gün hatırlatıcıları

### 📦 Sipariş Yönetimi
- Kolay sipariş oluşturma arayüzü
- İleri tarihli siparişler ve dağıtım planlaması
- Çoklu teslimat adresi ve alıcı seçeneği
- Sipariş durumu izleme ve güncelleme
- Özel kart mesajları
- Müşteri ve iç notlar

### 🌹 Ürün Kataloğu
- Ürün kategorileri ve detaylı ürün bilgileri
- Her ürün için gerekli ham maddelerin belirlenmesi
- Fiyatlandırma ve envanter bağlantısı
- Ürün durum yönetimi (aktif, pasif, arşiv)

### 📊 Envanter Yönetimi
- Ham madde stok takibi
- Otomatik stok hareketleri
- Minimum stok seviyesi uyarıları
- Stok giriş/çıkış raporları
- Kategori bazlı ham madde organizasyonu

### 🛒 Satın Alma
- Tedarikçi kayıtları ve iletişim bilgileri
- Satın alma siparişleri oluşturma
- Ödemeler ve kısmi ödemeler
- Satın alma siparişi raporları

### 💰 Finansal İşlemler
- Gelir ve gider takibi
- Çoklu hesap yönetimi (kasa, banka, POS, online)
- Kategorilendirilmiş işlemler
- Ödeme takibi ve geç ödeme bildirimleri
- Finansal raporlar ve tahminler

### 📈 Dashboard & Raporlama
- Günlük/haftalık/aylık satış grafikleri
- Kategori dağılım analizleri
- Finansal performans göstergeleri
- Günlük teslimat programı
- Yerine getirilmesi gereken siparişlerin izlenmesi

### 🏭 Atölye Yönetimi
- Günlük üretim planlaması
- Sipariş hazırlama iş akışı
- Görev ataması ve takibi
- Hazırlık durumunun gerçek zamanlı güncellenmesi

## 🛠️ Teknoloji Yığını

### Frontend
- **HTML5/CSS3**: Modern web standartları
- **Vanilla JavaScript**: Framework kullanmadan saf JS ile geliştirme
- **Bootstrap 5**: Responsive tasarım ve UI bileşenleri
- **Bootstrap Icons**: İkon kütüphanesi
- **Chart.js**: Grafikler ve veri görselleştirme

### Backend
- **TypeScript**: Tip güvenliği ve daha iyi kod yapısı
- **Cloudflare Workers**: Sunucusuz ve hızlı backend hizmetleri
- **Hono framework**: Hızlı ve hafif API router
- **JWT**: Kimlik doğrulama için JSON Web Token

### Veritabanı
- **Cloudflare D1**: Dağıtık SQLite tabanlı veritabanı
- **SQL migrations**: Veritabanı şema ve veri yönetimi
- **Foreign key constraints**: Referans bütünlüğü
- **Soft delete**: Veri silmeden arşivleme

### Dağıtım & Altyapı
- **Cloudflare Pages**: Frontend dağıtımı
- **GitHub Actions**: CI/CD pipeline
- **Cloudflare KV**: Önbellek ve durum yönetimi
- **Cloudflare Analytics**: Kullanım analizi

## 📁 Proje Yapısı

CCRM projesi modüler bir yapıya sahiptir ve aşağıdaki klasör yapısını kullanır:

/public
  /js             # Ortak JavaScript dosyaları
  /customers      # Müşteri yönetimi ekranları
  /orders         # Sipariş yönetimi ekranları
  /stock          # Stok yönetimi ekranları
  /purchases      # Satın alma ekranları
  /settings       # Ayarlar ekranları
  index.html      # Dashboard ekranı

/workers
  /routes         # API endpoint tanımlamaları
  /middleware     # Ortak middleware fonksiyonları
  /services       # İş mantığı servisleri
  index.ts        # Ana Worker giriş noktası

/migrations       # Veritabanı şema ve veri dosyaları

/docs             # Dokümantasyon dosyaları

## 🚀 Geliştirme

Geliştirme ortamını kurmak için şu adımları izleyin:

```
1. Repoyu klonlayın
2. Node.js paketlerini yükleyin:
   npm install
```
3. Cloudflare Worker'ı başlatın:
   npm run dev
```
4. Tarayıcıda açın:
   http://localhost:8787
```

## 📝 Sürüm Notları

### v1.0.0
- İlk resmi sürüm
- Müşteri, sipariş, stok, satın alma ve finans modülleri
- Temel raporlama ve dashboard özellikleri

## 👥 Katkıda Bulunanlar

- Yusuf Akarsu - Proje Lideri
- Hilal Akarsu - UX/UI Tasarım
- Hümeyra Aktaş - Backend Geliştirme

## 📄 Lisans

Bu proje özel lisans ile korunmaktadır. Tüm hakları saklıdır.

