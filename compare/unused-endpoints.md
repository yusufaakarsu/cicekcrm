# Kullanılmayan API Endpointler

## Dashboard Endpointleri
| Endpoint | Metod | Durum |
|----------|--------|---------|
| `/api/dashboard/summary` | GET | Kullanılmıyor |

## Sipariş Endpointleri
| Endpoint | Metod | Durum |
|----------|--------|---------|
| `/orders/summary` | GET | Frontend'de karşılığı yok |
| `/orders/recent-detailed` | GET | Frontend'de karşılığı yok |
| `/orders/popular-areas` | GET | Frontend'de karşılığı yok |
| `/orders/time-slots` | GET | Frontend'de karşılığı yok |

## Müşteri Endpointleri
| Endpoint | Metod | Durum |
|----------|--------|---------|
| `/customers/distribution` | GET | Frontend'de karşılığı yok |

## Analitik Endpointleri
Tüm analitik endpointleri kullanılmıyor:
| Endpoint | Metod | Durum |
|----------|--------|---------|
| `/analytics/sales-trend` | GET | Frontend'de karşılığı yok |
| `/analytics/top-customers` | GET | Frontend'de karşılığı yok |
| `/analytics/delivery-performance` | GET | Frontend'de karşılığı yok |

## Öneriler

1. Bu endpointler için frontend komponentleri geliştirilebilir:
   - Dashboard özet sayfasında `/api/dashboard/summary` kullanılabilir
   - Sipariş analizleri sayfasında popular-areas ve time-slots kullanılabilir
   - Müşteri analizleri sayfasında distribution ve top-customers kullanılabilir

2. Ya da bu endpointler kullanılmıyorsa API'den kaldırılabilir.

3. Analitik endpointleri için yeni bir analiz/raporlama sayfası oluşturulabilir.
