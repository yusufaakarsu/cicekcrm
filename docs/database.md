# Çiçek CRM Veritabanı Yapısı

## 1. Temel Yapı (Core)
- **tenants**: Çoklu kiracı yapısı için temel tablo
- **users**: Sistem kullanıcıları
- **tenant_users**: Kiracı-kullanıcı ilişkileri
- **subscription_plans**: Abonelik planları
- **tenant_subscriptions**: Kiracı abonelikleri
- **audit_log**: Sistem geneli denetim kayıtları
- **tenant_settings**: Kiracı bazlı ayarlar

## 2. Stok Yönetimi (Stock)
- **stock_units**: Stok birimleri (adet, dal, demet vs.)
- **suppliers**: Tedarikçiler
- **stock_movements**: Stok hareketleri
- **inventory_counts**: Stok sayımları
- **purchase_orders**: Tedarikçi siparişleri

## 3. Ürün Yönetimi (Products)
- **product_types**: Ürün tipleri (tek, buket, aranjman vs.)
- **product_categories**: Ürün kategorileri (ağaç yapısı)
- **products**: Ürünler
- **recipes**: Ürün reçeteleri
- **recipe_items**: Reçete bileşenleri
- **recipe_costs**: Reçete maliyetleri

## 4. Müşteri Yönetimi (Customers)
- **customers**: Müşteriler (bireysel/kurumsal)
- **addresses**: Müşteri adresleri
- **customer_contacts**: Müşteri iletişim kişileri
- **customer_preferences**: Müşteri tercihleri

## 5. Sipariş Yönetimi (Orders)
- **orders**: Siparişler
- **order_items**: Sipariş kalemleri
- **order_recipes**: Sipariş reçeteleri
- **order_recipe_items**: Sipariş reçete detayları

## 6. Teslimat Yönetimi
- **delivery_regions**: Teslimat bölgeleri

## 7. İndeksler ve Görünümler
- Performans için temel indeksler
- Raporlama için hazır görünümler (views)

## 8. Trigger'lar
- Stok kontrolü
- Maliyet hesaplama
- Denetim (audit) kayıtları
- Sipariş durum kontrolleri

## 9. Örnek Veriler
- Temel veriler (tenant, birimler, kullanıcılar)
- Bölgeler ve teslimat alanları
- Müşteriler ve adresleri
- Ürünler ve reçeteler
- Test siparişleri

## Önemli İlişkiler
1. Her kayıt bir tenant'a ait
2. Ürünler kategorilere ve tiplere bağlı
3. Siparişler müşteri ve adres ile ilişkili
4. Reçeteler ürünlerle ve malzemelerle ilişkili
5. Stok hareketleri ürünler ve birimlerle ilişkili

## Veritabanı Özellikleri
- SQLite veritabanı
- Tam referans bütünlüğü (foreign key constraints)
- Kapsamlı denetim (audit) sistemi
- Çoklu kiracı (multi-tenant) yapı
- Hiyerarşik kategori sistemi
