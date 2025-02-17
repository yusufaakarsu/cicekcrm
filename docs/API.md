# CCRM API Dokümantasyonu

## Base URL
Tüm API çağrıları `/api` prefix'i ile başlar.

## Endpoints

### Dashboard
- `GET /api/dashboard` - Dashboard verilerini ve istatistiklerini getirir

### Customers (Müşteriler)
- `GET /api/customers` - Tüm müşterileri listeler
- `GET /api/customers/:id` - Müşteri detayını getirir
- `GET /api/customers/phone/:phone` - Telefon numarasına göre müşteri arar
- `POST /api/customers` - Yeni müşteri ekler
- `PUT /api/customers/:id` - Müşteri bilgilerini günceller
- `GET /api/customers/:id/orders` - Müşterinin siparişlerini getirir
- `GET /api/customers/:id/addresses` - Müşterinin adreslerini getirir

### Orders (Siparişler)
- `GET /api/orders` - Tüm siparişleri listeler
- `GET /api/orders/filtered` - Filtrelenmiş siparişleri getirir
- `GET /api/orders/today` - Bugünün siparişlerini getirir
- `GET /api/orders/:id/details` - Sipariş detayını getirir
- `POST /api/orders` - Yeni sipariş oluşturur
- `PUT /api/orders/:id/status` - Sipariş durumunu günceller
- `PUT /api/orders/:id/cancel` - Siparişi iptal eder

### Addresses (Adresler)
- `GET /api/addresses` - Tüm adresleri listeler
- `POST /api/addresses` - Yeni adres ekler
- `PUT /api/addresses/:id` - Adres bilgilerini günceller
- `GET /api/addresses/search` - Adres araması yapar

### Finance (Finans)
- `GET /api/finance/stats` - Finansal istatistikleri getirir
- `GET /api/finance/transactions` - Son işlemleri listeler
- `GET /api/finance/daily-revenue` - Günlük gelir raporunu getirir
- `GET /api/finance/monthly-report` - Aylık raporu getirir

### Products (Ürünler)
- `GET /api/products` - Tüm ürünleri listeler
- `GET /api/products/low-stock` - Düşük stoklu ürünleri listeler
- `POST /api/products` - Yeni ürün ekler
- `PUT /api/products/:id` - Ürün bilgilerini günceller
- `PUT /api/products/:id/stock` - Ürün stok miktarını günceller

## Veri Formatları

### Sipariş Durumları
- `new` - Yeni
- `preparing` - Hazırlanıyor
- `ready` - Hazır
- `delivering` - Yolda
- `delivered` - Teslim Edildi
- `cancelled` - İptal

### Teslimat Zaman Dilimleri
- `morning` - Sabah (09:00-12:00)
- `afternoon` - Öğlen (12:00-17:00)
- `evening` - Akşam (17:00-21:00)

### Ödeme Durumları
- `pending` - Bekliyor
- `paid` - Ödendi
- `cancelled` - İptal

### Ödeme Yöntemleri
- `cash` - Nakit
- `credit_card` - Kredi Kartı
- `bank_transfer` - Havale/EFT

## Hata Kodları
- `400` - Bad Request (Geçersiz istek)
- `401` - Unauthorized (Yetkisiz erişim)
- `404` - Not Found (Kayıt bulunamadı)
- `500` - Internal Server Error (Sunucu hatası)
