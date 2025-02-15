# Çiçek CRM API Endpoint Listesi

## 1. Dashboard Endpointleri
| Endpoint | Metod | Açıklama |
|----------|--------|-----------|
| `/api/dashboard` | GET | Ana dashboard özet istatistikleri |
| `/api/dashboard/summary` | GET | Detaylı dashboard verileri |

## 2. Finans Endpointleri
| Endpoint | Metod | Açıklama |
|----------|--------|-----------|
| `/api/finance/stats` | GET | Finansal özet istatistikler |
| `/api/finance/transactions` | GET | Son finansal işlemler (son 20) |

## 3. Sipariş Endpointleri
| Endpoint | Metod | Açıklama |
|----------|--------|-----------|
| `/orders` | GET | Tüm siparişleri listele |
| `/orders` | POST | Yeni sipariş oluştur |
| `/orders/today` | GET | Bugünün teslimatları |
| `/orders/recent` | GET | Son siparişler (son 5) |
| `/orders/filtered` | GET | Filtrelenmiş sipariş listesi |
| `/orders/summary` | GET | 3 günlük sipariş özeti |
| `/orders/recent-detailed` | GET | Detaylı son siparişler |
| `/orders/:id` | PUT | Sipariş güncelle |
| `/orders/:id/cancel` | PUT | Sipariş iptal et |
| `/orders/:id/status` | PUT | Sipariş durumu güncelle |
| `/orders/:id/details` | GET | Sipariş detayları |
| `/orders/popular-areas` | GET | Popüler teslimat bölgeleri |
| `/orders/time-slots` | GET | Teslimat zaman dilimi analizi |

## 4. Müşteri Endpointleri
| Endpoint | Metod | Açıklama |
|----------|--------|-----------|
| `/customers` | GET | Tüm müşterileri listele |
| `/customers` | POST | Yeni müşteri ekle |
| `/customers/recent` | GET | Son müşteriler (son 5) |
| `/customers/search/phone/:phone` | GET | Telefon ile müşteri ara |
| `/customers/:id` | GET | Müşteri detayları |
| `/customers/:id` | PUT | Müşteri güncelle |
| `/customers/:id/orders` | GET | Müşterinin siparişleri |
| `/customers/distribution` | GET | Müşteri tipi dağılımı |

## 5. Ürün Endpointleri
| Endpoint | Metod | Açıklama |
|----------|--------|-----------|
| `/products/low-stock` | GET | Düşük stoklu ürünler |
| `/products/top-selling` | GET | En çok satan ürünler |

## 6. Analitik Endpointleri
| Endpoint | Metod | Açıklama |
|----------|--------|-----------|
| `/analytics/sales-trend` | GET | Aylık satış trendi |
| `/analytics/top-customers` | GET | En aktif müşteriler |
| `/analytics/delivery-performance` | GET | Teslimat performansı |

## Query Parametreleri

### Filtreleme Parametreleri (/orders/filtered)
- `status`: Sipariş durumu
- `date_filter`: Tarih filtresi (today, tomorrow, week, month)
- `start_date`: Başlangıç tarihi
- `end_date`: Bitiş tarihi
- `sort`: Sıralama
- `page`: Sayfa numarası
- `per_page`: Sayfa başına kayıt sayısı

## Durum Kodları
- 200: Başarılı
- 400: Hatalı istek
- 404: Bulunamadı
- 500: Sunucu hatası

## Authentication
Tüm endpointler için tenant_id gereklidir. Middleware ile otomatik olarak eklenir.

## Response Format
```json
// Başarılı yanıt
{
  "success": true,
  "data": { ... }
}

// Hata yanıtı
{
  "error": "Hata mesajı",
  "details": "Detaylı hata açıklaması" 
}
```
