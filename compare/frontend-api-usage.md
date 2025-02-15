# Frontend API Kullanım Listesi

## calendar.js API Kullanımı
- `GET /orders/filtered` 
  - Parametreler: start_date, end_date, per_page, date_filter
  - Kullanım: Takvim görünümü için teslimat verilerini getirir
  - Component: Takvim ayı ve gün görünümleri

## common.js API Kullanımı
- `GET /api/dashboard`
  - Kullanım: Genel dashboard verilerini getirir
  - Component: Dashboard kartları ve istatistikler
- `GET /orders`
  - Kullanım: Son siparişleri listeler
  - Component: Son siparişler tablosu

## customer.js API Kullanımı
- `GET /customers` 
  - Kullanım: Tüm müşterileri listeler
  - Component: Müşteri tablosu
- `GET /customers/:id`
  - Kullanım: Müşteri detaylarını getirir
  - Component: Müşteri detay modalı
- `GET /customers/:id/orders`
  - Kullanım: Müşterinin siparişlerini getirir
  - Component: Müşteri sipariş geçmişi
- `POST /customers`
  - Kullanım: Yeni müşteri ekleme
  - Component: Müşteri ekleme formu
- `PUT /customers/:id`
  - Kullanım: Müşteri bilgilerini güncelleme
  - Component: Müşteri düzenleme formu

## dashboard.js API Kullanımı
- `GET /api/dashboard`
  - Kullanım: Ana dashboard istatistiklerini getirir
  - Component: Dashboard kartları ve grafikler
- Veri alanları:
  - deliveryStats: Teslimat istatistikleri
  - finance: Finansal veriler
  - customers: Müşteri istatistikleri
  - lowStock: Stok uyarıları

## delivery.js API Kullanımı
- `GET /orders/today`
  - Kullanım: Bugünün teslimatlarını listeler
  - Component: Teslimat haritası ve listesi
- `PUT /orders/:id/status`
  - Kullanım: Teslimat durumu güncelleme
  - Component: Teslimat durum butonları

## finance.js API Kullanımı
- `GET /api/finance/stats`
  - Kullanım: Finansal istatistikleri getirir
  - Component: Finans kartları ve grafikler
- `GET /api/finance/transactions`
  - Kullanım: Son finansal işlemleri listeler
  - Component: İşlem geçmişi tablosu

## orders.js API Kullanımı
- `GET /orders`
  - Kullanım: Tüm siparişleri listeler
  - Component: Sipariş tablosu
- `GET /orders/:id/details`
  - Kullanım: Sipariş detaylarını getirir
  - Component: Sipariş detay modalı
- `POST /orders`
  - Kullanım: Yeni sipariş oluşturma
  - Component: Sipariş oluşturma formu
- `PUT /orders/:id`
  - Kullanım: Sipariş güncelleme
  - Component: Sipariş düzenleme formu
- `PUT /orders/:id/status`
  - Kullanım: Sipariş durumu güncelleme
  - Component: Durum güncelleme butonları
- `PUT /orders/:id/cancel`
  - Kullanım: Sipariş iptali
  - Component: İptal butonu

## Ortak Kullanılan Response Formatları

### Başarılı Yanıt
```json
{
  "success": true,
  "data": { ... }
}
```

### Hata Yanıtı
```json
{
  "error": "Hata mesajı",
  "details": "Detaylı hata açıklaması"
}
```

## Not
Her endpoint için tenant_id middleware tarafından otomatik olarak eklenir.
```