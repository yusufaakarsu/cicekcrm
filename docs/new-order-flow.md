# Yeni Sipariş Akışı (Güncellenmiş)

## 1. Müşteri Seçimi/Arama
### 1.1 Telefon ile Müşteri Arama
```typescript
interface CustomerSearchFlow {
  1. Telefon numarası girişi
  2. Müşteri kontrolü:
     if (müşteri_varsa) {
       - Müşteri bilgilerini göster
       - Kayıtlı adresleri yükle
     } else {
       - Otomatik yeni müşteri modalı aç
       - Telefon numarasını doldur
     }
}
```

### 1.2 Yeni Müşteri Kaydı
```typescript
interface NewCustomerData {
    name: string;          // Zorunlu
    phone: string;         // Zorunlu
    email?: string;        // Opsiyonel
    district: string;      // Zorunlu - İlçe seçimi
    customer_type: 'retail' | 'corporate';
    company_details?: {    // Kurumsal ise
        company_name: string;
        tax_number: string;
    }
}
```

## 2. Teslimat Bilgileri
### 2.1 Teslimat Planlama
```typescript
interface DeliveryPlanning {
    date: Date;           // Zorunlu
    time_slot: 'morning' | 'afternoon' | 'evening';
    recipient: {
        name: string;     // Zorunlu (Müşteri adı otomatik DOLDURULMAYACAK)
        phone: string;    // Zorunlu
    }
}
```

### 2.2 Adres Seçimi
```typescript
interface AddressSelection {
    sources: [
        'saved_addresses',    // Müşterinin kayıtlı adresleri
        'here_maps_search'    // HERE API arama sonuçları
    ];
    
    display: {
        saved: "Tek listede kayıtlı adresler",
        search_results: "Aynı listede HERE sonuçları"
    };

    selected_address: {
        id?: number;          // Kayıtlı adres için
        label: string;        // Adres başlığı
        full_address: string; // Tam adres
        coordinates: {        // HERE API'den
            lat: number;
            lng: number;
        }
    }
}
```

## 3. Sipariş Detayları
### 3.1 Ürün Seçimi/Sepet
```typescript
interface CartManagement {
    products: {
        search: string;      // Anlık arama
        display: [           // Liste görünümü
            name: string,
            price: number,
            stock: number
        ];
    };
    
    cart: {
        items: [{
            id: number;
            name: string;
            quantity: number;
            price: number;
        }];
        totals: {
            subtotal: number;
            delivery_fee: number;
            total: number;
        }
    }
}
```

## 4. Backend API Yapısı
### 4.1 Sipariş Kaydetme Transaction
```sql
BEGIN TRANSACTION;

-- 1. Yeni müşteri ise önce müşteriyi kaydet
INSERT INTO customers (...) VALUES (...);

-- 2. Yeni adres ise adresi kaydet
INSERT INTO addresses (...) VALUES (...);

-- 3. Siparişi kaydet
INSERT INTO orders (...) VALUES (...);

-- 4. Sipariş detaylarını kaydet
INSERT INTO order_items (...) VALUES (...);

-- 5. Stok güncelle
UPDATE products SET stock = stock - :quantity 
WHERE id = :product_id;

COMMIT;
```

## 5. Validasyon Kuralları
### 5.1 Zorunlu Alanlar
- Müşteri bilgileri (ad, telefon, ilçe)
- Alıcı bilgileri (ad, telefon)
- Teslimat tarihi ve saati
- Teslimat adresi (koordinatlar zorunlu)
- En az 1 ürün

### 5.2 İş Kuralları
1. Yeni Müşteri:
   - Telefon numarası unique
   - İlçe seçimi zorunlu

2. Teslimat:
   - İstanbul dışı teslimat yok
   - HERE API ile adres doğrulama
   - Alıcı bilgileri müşteriden bağımsız

3. Sipariş:
   - Minimum sipariş tutarı kontrolü
   - Stok kontrolü
   - Teslimat ücreti hesaplama
