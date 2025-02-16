# Çiçek CRM Projesi

## Amaç
Çiçekçiler için kapsamlı yönetim sistemi:
- Müşteri yönetimi
- Sipariş takibi
- Teslimat planlaması
- Stok kontrolü
- Finans takibi

## Teknik Stack

### Frontend
- HTML + Vanilla JavaScript
- Bootstrap 5.3.2 + Bootstrap Icons
- Modüler yapı (her modül kendi JS/HTML dosyaları)

### Backend 
- Cloudflare Workers (Edge Functions)
- Cloudflare D1 (SQLite tabanlı)
- REST API

## Kod Düzenleme Kuralları

1. Mevcut Yapıyı Koru
- Proje yapısını değiştirmeden çalış
- Var olan dosya/klasör yapısına sadık kal 
- Yeni dosya/klasör oluşturmadan önce iki kez düşün

2. Minimal Değişiklik
- Çalışan kodu gereksiz yere değiştirme
- Sadece gerekli olan değişiklikleri yap
- "Daha iyi olur" diye çalışan kodu bozma

3. Test Et
- Çalıştığından emin olmadan commit etme
- Hata varsa hemen geri al

4. Git Kuralları
```bash
# Development branch'inde çalış
git checkout development

# Değişiklikleri commitle
git add .
git commit -m "Açıklayıcı commit mesajı"
git push origin development
```

5. Worker Değişiklikleri
```bash
cd workers
wrangler deploy
```

## Notlar

- Her değişiklik için commit mesajı yazılmalı
- Worker değişikliklerinde wrangler deploy yapılmalı
- Frontend değişikliklerinde branch'e push yapılmalı
- Terminal kodları verilirken yorum satırı bırakılmamalı 

# Çiçek CRM

Çiçekçi sipariş ve müşteri yönetim sistemi.

## Proje Yapısı ve Dosya Açıklamaları

```
/Users/yusuf/Downloads/kod/CCRM/
├── migrations/                         # Veritabanı Migrasyon Klasörü
│   ├── data.sql                       # Test verileri ve örnek kayıtlar
│   └── schema.sql                     # Veritabanı tablo yapıları ve ilişkileri
├── public/                            # Frontend Ana Klasörü
│   ├── calendar/                      # Takvim Modülü
│   │   ├── calendar.js             # Takvim işlevleri ve teslimat planlaması
│   │   └── index.html                 # Teslimat takvimi görünümü
│   ├── common/                        # Ortak UI Bileşenleri
│   │   ├── header.html               # Site üst menü ve navigasyon
│   │   └── layout.html               # Ana sayfa düzeni şablonu
│   ├── css/                          # Stil Dosyaları
│   │   └── style.css                 # Özel CSS tanımlamaları
│   ├── customers/                     # Müşteri Yönetimi Modülü
│   │   ├── customers.js            # Müşteri işlemleri mantığı
│   │   └── index.html               # Müşteri listeleme sayfası
│   ├── delivery/                     # Teslimat Yönetimi Modülü
│   │   ├── delivery.js            # Teslimat takip ve güncelleme işlevleri
│   │   └── index.html               # Teslimat takip ve yönetim sayfası
│   ├── finance/                      # Finans Modülü
│   │   ├── finance.js             # Finansal hesaplama ve raporlama
│   │   └── index.html               # Finansal raporlar ve analizler
│   ├── js/                          # JavaScript Ana Klasörü
│   │   └──common.js               # Ortak yardımcı fonksiyonlar
│   ├── orders/                     # Sipariş Yönetimi Modülü
│   │   ├── index.html             # Sipariş listeleme sayfası
│   │   ├── new.html              # Yeni sipariş oluşturma formu
│   │   └── orders.js              # Sipariş yönetimi işlevleri
│   ├── dashboard.js            # Panel ve istatistik işlemleri
│   └── index.html                 # Ana sayfa (Dashboard)
├── workers/                        # Cloudflare Workers Backend
│   ├── node_modules/               #
│   ├── package-lock.json          # NPM bağımlılık kilitleri
│   ├── package.json               # Backend bağımlılıkları
│   ├── worker.ts                  # Ana API endpoint kodları
│   └── wrangler.toml             # Cloudflare Workers yapılandırması
├── README.md                      # Proje dokümantasyonu (bu dosya)
└── package.json                   # Frontend bağımlılıkları
```

## Teknolojiler

- Backend: Cloudflare Workers
- Frontend: Vanilla JS + Bootstrap
- Veritabanı: Cloudflare D1 (SQLite)

## Geliştirme

1. Bağımlılıkları yükle:
```bash
npm install
```

2. Geliştirme sunucusunu başlat:
```bash
npm run dev
```

3. Production'a deploy et:
```bash
npm run deploy
```

## Git İş Akışı

1. Development branch'inde çalış
2. Her değişiklik için:
```bash

git add .
git commit -m "Değişiklik açıklaması"
git push origin development

```

3. Worker değişikliklerinde deploy:
```bash

cd workers
wrangler deploy

```
4. veritabanı işlemleri:
```bash

wrangler d1 execute cicek-crm-db --remote --file=./migrations/schema.sql
wrangler d1 execute cicek-crm-db --remote --file=./migrations/data.sql

```

## Git Komutları

Development branch'te çalışırken:

git add .
git commit -m "feat: Değişiklik mesajı"
git push origin development

## Worker Komutları

API değişikliklerinde:

cd /Users/yusuf/Downloads/kod/CicekCRM/workers/api
wrangler deploy

## Veritabanı Komutları

Schema ve veri güncellemelerinde:

cd /Users/yusuf/Downloads/kod/CicekCRM/workers/api
wrangler d1 execute cicek-crm-db --remote --file=./schema.sql
wrangler d1 execute cicek-crm-db --remote --file=./migrations/data.sql

Veritabanı güncellemeleri için şu komutları kullanın:

```bash
wrangler d1 execute cicek-crm-db --remote --file=./schema.sql
wrangler d1 execute cicek-crm-db --remote --file=./migrations/data.sql
```

## Modüller

### Siparişler
- Sipariş listesi (/orders)
- Yeni sipariş (/orders/new)
- Sipariş detayları ve düzenleme
- Filtreleme ve arama
- Teslimat takibi

### Müşteriler
- Müşteri listesi (/customers)
- Yeni müşteri
- Müşteri detayları ve düzenleme

### Finans
- Gelir/gider takibi (/finance)
- Raporlar ve analizler

## API Endpoints

### Siparişler
- GET /api/orders - Sipariş listesi
- POST /api/orders - Yeni sipariş
- GET /api/orders/:id - Sipariş detayı
- PUT /api/orders/:id - Sipariş güncelleme
- PUT /api/orders/:id/status - Durum güncelleme

### Müşteriler
- GET /api/customers - Müşteri listesi
- POST /api/customers - Yeni müşteri
- GET /api/customers/:id - Müşteri detayı
- PUT /api/customers/:id - Müşteri güncelleme

## Veritabanı Şeması

### Ana Tablolar
- tenants: (id, name, domain, contact_email, created_at)
- customers: (id, tenant_id, name, email, phone, address, city, district, notes, customer_type, tax_number, company_name, special_dates, is_deleted, created_at, updated_at)  
  • Soft delete: is_deleted  
- product_categories: (id, tenant_id, name, description, is_deleted)  
  • Soft delete: is_deleted  
- products: (id, tenant_id, category_id, name, description, purchase_price, retail_price, wholesale_price, stock, min_stock, is_deleted, created_at, updated_at)  
  • Soft delete: is_deleted  
- suppliers: (id, tenant_id, name, contact_name, phone, email, address, tax_number, notes, is_deleted, created_at)  
  • Soft delete: is_deleted  
- orders: (id, tenant_id, customer_id, status, delivery_date, delivery_time_slot, delivery_address, delivery_city, delivery_district, delivery_notes, delivery_status, courier_notes, recipient_name, recipient_phone, recipient_note, recipient_address, card_message, recipient_alternative_phone, subtotal, delivery_fee, distance_fee, discount_amount, discount_code, total_amount, cost_price, profit_margin, payment_status, payment_method, payment_notes, source, notes, is_deleted, created_at, updated_at)  
  • Soft delete: is_deleted  
- order_items: (id, tenant_id, order_id, product_id, quantity, unit_price, cost_price, notes)
- purchase_orders: (id, supplier_id, status, total_amount, payment_status, notes, created_at, updated_at)
- purchase_order_items: (id, purchase_order_id, product_id, quantity, unit_price, total_price)

### İstatistik Görünümleri
- finance_stats: (date, total_orders, revenue, costs, profit, margin)
- delivery_stats: (date, delivery_time_slot, delivery_district, total_deliveries, avg_delivery_fee, completed_deliveries)

### Triggerlar ve Audit Log
- Tablolardaki güncelleme işlemlerinde customers.updated_at alanını otomatik güncelleyen trigger  
- Soft delete uygulandığında (customers.is_deleted) ilişkili orders tablosunun da soft delete yapılmasını sağlayan trigger  
- Audit trigger'lar: audit_customers_update, audit_customers_insert, audit_customers_delete  
- Audit log için ayrı audit_log tablosu

### İndeksler
- customers: phone
- orders: customer_id, delivery_date, status, delivery_status, payment_status, (delivery_date, status)
- order_items: order_id
- products: category_id
- purchase_orders: supplier_id
- purchase_order_items: purchase_order_id, product_id

### Foreign Key İlişkileri
- products -> product_categories (category_id)
- orders -> customers (customer_id)
- order_items -> orders (order_id)
- order_items -> products (product_id)
- purchase_orders -> suppliers (supplier_id)
- purchase_order_items -> purchase_orders (purchase_order_id)
- purchase_order_items -> products (product_id)

## Aktif Endpointler

### Dashboard & İstatistikler
- `/api/dashboard`: Ana panel istatistiklerini döndürür
- `/api/finance/stats`: Finansal metrikleri döndürür
- `/api/finance/transactions`: Son finansal işlemleri listeler

### Siparişler
- `GET /orders`: Tüm siparişleri listeler
- `POST /orders`: Yeni sipariş oluşturur
- `PUT /orders/:id`: Sipariş günceller
- `GET /orders/:id/details`: Sipariş detaylarını getirir
- `PUT /orders/:id/status`: Sipariş durumunu günceller
- `PUT /orders/:id/cancel`: Siparişi iptal eder
- `GET /orders/filtered`: Filtrelenmiş sipariş listesi
- `GET /orders/today`: Bugünün teslimatları
- `GET /orders/recent`: Son 5 siparişi listeler

### Müşteriler
- `GET /customers`: Tüm müşterileri listeler
- `POST /customers`: Yeni müşteri ekler
- `PUT /customers/:id`: Müşteri bilgilerini günceller
- `GET /customers/:id`: Müşteri detaylarını getirir
- `GET /customers/search/phone/:phone`: Telefon ile müşteri arar
- `GET /customers/recent`: Son 5 müşteriyi listeler
- `GET /customers/:id/orders`: Müşterinin siparişlerini listeler

### Ürünler
- `GET /products/low-stock`: Düşük stoklu ürünleri listeler
- `GET /products/top-selling`: En çok satan ürünleri listeler

## Teknolojiler
- Backend: Cloudflare Workers
- Frontend: Vanilla JS + Bootstrap 5.3.2
- Veritabanı: Cloudflare D1 (SQLite)

## Kurulum & Geliştirme

### 1. Projeyi klonla
```bash
git clone https://github.com/username/CCRM.git
cd CCRM
```

### 2. Bağımlılıkları yükle
```bash
# Worker API için
cd workers/api
npm install

# Frontend için
cd ../../
npm install
```

### 3. Geliştirme ortamı
```bash
# API'yi başlat
cd workers/api
wrangler dev

# Frontend'i başlat (ayrı terminalde)
npm run dev
```

### 4. Deploy
```bash
# API deploy
cd workers/api
wrangler deploy

# Frontend deploy
npm run build
```

## Veritabanı İşlemleri

### Schema güncelleme
```bash
cd workers/api
wrangler d1 execute cicek-crm-db --remote --file=./migrations/schema.sql
```

### Test datası yükleme
```bash
wrangler d1 execute cicek-crm-db --remote --file=./migrations/data.sql
```

## Git İş Akışı

1. Development branch'inde çalış:
```bash
git checkout development
```

2. Değişiklikleri commit'le:
```bash
git add .
git commit -m "feat/fix/docs: Açıklayıcı mesaj"
```

3. Push ve deploy:
```bash
git push origin development
cd workers/api && wrangler deploy
```

## Test & Hata Ayıklama

- API Testleri: `wrangler dev` ile lokalde test et
- Frontend Testleri: `npm run dev` ile lokalde test et
- Hata logları: Cloudflare Workers dashboard'da görüntüle

## Notlar

- `tenant_id` middleware ile otomatik ekleniyor
- Tüm tarihler UTC formatında
- Frontend'de Bootstrap 5.3.2 kullanılıyor
- API güvenlik katmanı henüz eklenmedi


