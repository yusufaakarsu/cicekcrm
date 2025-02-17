# Yeni Sipariş Ekleme Akışı

## 1. Veri Yapısı

### 1.1 Sipariş Ana Yapısı
```typescript
interface Order {
    id: number;
    tenant_id: number;
    customer_id: number;
    customer_type: 'new' | 'existing';
    delivery: DeliveryInfo;
    items: OrderItem[];
    payment: PaymentInfo;
    totals: OrderTotals;
    meta: OrderMeta;
}
```

### 1.2 Alt Yapılar
```typescript
interface DeliveryInfo {
    date: string;
    time_slot: 'morning' | 'afternoon' | 'evening';
    address_id?: number;
    address_data?: AddressData; // Yeni adres için
    recipient_name: string;
    recipient_phone: string;
    notes?: string;
    card_message?: string;
}

interface OrderItem {
    product_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface PaymentInfo {
    method: 'cash' | 'credit_card' | 'bank_transfer';
    status: 'pending' | 'paid';
    discount_code?: string;
}

interface OrderTotals {
    subtotal: number;
    delivery_fee: number;
    discount: number;
    total: number;
}
```

## 2. İş Akışı

### 2.1 Müşteri Seçimi/Ekleme
1. Telefon ile müşteri arama
2. Mevcut müşteri seçimi VEYA
3. Yeni müşteri ekleme
   - Müşteri tipi seçimi
   - Temel bilgiler
   - Adres bilgisi (opsiyonel)

### 2.2 Teslimat Bilgileri
1. Tarih ve zaman dilimi seçimi
2. Alıcı bilgileri girişi
3. Adres seçimi/ekleme
   - Kayıtlı adreslerden seçim VEYA
   - HERE Maps ile yeni adres ekleme
4. Not ve kart mesajı

### 2.3 Ürün Seçimi
1. Ürün arama ve ekleme
2. Miktar belirleme
3. Sepet yönetimi
   - Ürün ekleme/çıkarma
   - Miktar güncelleme
   - Ara toplam hesaplama

### 2.4 Ödeme Bilgileri
1. Ödeme yöntemi seçimi
2. İndirim kuponu (varsa)
3. Toplam hesaplama
   - Ara toplam
   - Teslimat ücreti
   - İndirim
   - Genel toplam

## 3. Validasyon Kuralları

### 3.1 Zorunlu Alanlar
- Müşteri bilgileri
- Teslimat tarihi ve saati
- Alıcı adı ve telefonu
- Teslimat adresi
- En az 1 ürün
- Ödeme yöntemi

### 3.2 İş Kuralları
1. Aynı gün teslimat:
   - Saat 14:00'e kadar sipariş verilebilir
   - Sadece afternoon/evening seçilebilir

2. Adres kontrolü:
   - İstanbul içi teslimat kontrolü
   - Koordinat zorunluluğu

3. Stok kontrolü:
   - Ürün stok kontrolü
   - Rezervasyon yönetimi

## 4. API Entegrasyonu

### 4.1 Sipariş Kaydetme
```typescript
POST /orders
{
    customer: CustomerData;
    delivery: DeliveryInfo;
    items: OrderItem[];
    payment: PaymentInfo;
}
```

### 4.2 Transaction Yönetimi
1. Müşteri işlemleri
2. Adres işlemleri
3. Sipariş ana kaydı
4. Sipariş detayları
5. Stok güncellemeleri

## 5. Hata Yönetimi

### 5.1 Validation Hataları
- Form validasyonları
- İş kuralı kontrolleri
- Stok kontrolleri

### 5.2 API Hataları
- Bağlantı hataları
- Sunucu hataları
- Transaction hataları

### 5.3 Kullanıcı Geri Bildirimi
- Toast mesajları
- Form hata gösterimi
- Yönlendirme mesajları

## 6. UI/UX İyileştirmeleri

### 6.1 Form Kullanılabilirliği
- Tab sıralaması
- Otomatik tamamlama
- Input maskeleme
- Klavye kısayolları

### 6.2 Progressive Enhancement
- Offline desteği
- Form state yönetimi
- Otomatik kaydetme
- Geri yükleme

## 7. Test Senaryoları

### 7.1 Pozitif Testler
- Normal akış
- Tüm alanlar dolu
- Geçerli değerler

### 7.2 Negatif Testler
- Eksik/hatalı veri
- Sınır değerleri
- API hataları
