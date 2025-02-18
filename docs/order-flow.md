# Yeni Sipariş Akışı

## 1. Müşteri Arama/Ekleme

### Telefon ile Müşteri Arama
- `GET /api/customers/phone/:phone` endpointi ile müşteri aranır
- Eğer müşteri varsa müşteri detayları gösterilir
- Yoksa yeni müşteri formu açılır

### Yeni Müşteri Ekleme
- `POST /api/customers` endpointi ile yeni müşteri eklenir
- İşlemler:
  - `customers` tablosuna INSERT
  - Dönüşte müşteri ID ve detayları alınır

## 2. Adres Seçimi/Ekleme

### Kayıtlı Adresleri Listeleme
- `GET /api/customers/:id/addresses` ile müşterinin adresleri listelenir
- `addresses` tablosundan müşteriye ait kayıtlar çekilir

### Yeni Adres Ekleme
- HERE API ile adres araması yapılır
- Seçilen adres için detaylar (bina no, kat, daire) alınır
- `POST /api/addresses` endpointi ile yeni adres eklenir
- İşlemler:
  - `addresses` tablosuna INSERT
  - Dönüşte address_id alınır

## 3. Teslimat Bilgileri

### Teslimat Formu Doldurma
Aşağıdaki bilgiler alınır:
- Teslimat tarihi
- Teslimat saati (sabah/öğlen/akşam)
- Alıcı adı
- Alıcı telefonu
- Alternatif telefon
- Alıcı notu
- Kart mesajı

### Bilgilerin Saklanması
- Bilgiler geçici olarak sessionStorage'a kaydedilir
- Henüz veritabanına yazılmaz

## 4. Ürün Seçimi

### Kategorileri Listeleme
- `GET /api/products/product-categories` ile kategoriler listelenir
- `product_categories` tablosundan veriler çekilir

### Ürünleri Listeleme
- `GET /api/products` ile ürünler listelenir
- Filtreler:
  - Kategori
  - Arama metni
- `products` tablosundan veriler çekilir

### Sepet İşlemleri
- Seçilen ürünler client-side bir Map'te tutulur
- Her ürün için:
  - Miktar
  - Birim fiyat
  - Toplam tutar hesaplanır

## 5. Sipariş Oluşturma

### Sipariş Kaydı
`POST /api/orders` endpointi ile sipariş oluşturulur

#### Veritabanı İşlemleri:
1. `orders` tablosuna INSERT:
   - tenant_id
   - customer_id
   - status: 'new'
   - delivery_date
   - delivery_time_slot
   - delivery_address_id
   - recipient_name
   - recipient_phone
   - recipient_alternative_phone
   - recipient_note
   - card_message
   - subtotal
   - total_amount
   - payment_method
   - payment_status

2. `order_items` tablosuna INSERT:
   Her seçilen ürün için:
   - order_id
   - product_id
   - quantity
   - unit_price
   - cost_price

### Transaction Yönetimi
- Tüm kayıt işlemleri tek bir transaction içinde yapılır
- Hata durumunda tüm işlemler geri alınır (ROLLBACK)
- Başarılı durumda işlemler kaydedilir (COMMIT)

## 6. Sipariş Sonrası

### Yönlendirme
- Başarılı kayıt sonrası sipariş detay sayfasına yönlendirilir
- URL: `/orders/:id`

### Temizlik
- sessionStorage'daki geçici veriler temizlenir
- Seçili ürünler listesi sıfırlanır

## Veri İlişkileri
