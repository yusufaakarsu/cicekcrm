# Sipariş Ekleme Süreci

## 1. Akış Diyagramı

```mermaid
graph TD
    A[Başlangıç] --> B[Müşteri Seçimi]
    B --> |Mevcut Müşteri| C[Müşteri Seç]
    B --> |Yeni Müşteri| D[Müşteri Kaydet]
    C --> E[Teslimat Bilgileri]
    D --> E
    E --> |Mevcut Adres| F[Adres Seç]
    E --> |Yeni Adres| G[Adres Kaydet]
    F --> H[Ürün Seçimi]
    G --> H
    H --> I[Ödeme Bilgileri]
    I --> J[Sipariş Oluştur]