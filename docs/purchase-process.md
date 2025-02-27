# Satın Alma Süreci

## 1. Veri Modeli

### Tablolar ve İlişkiler
- **purchase_orders**: Ana sipariş bilgileri
  - total_amount: Toplam tutar
  - paid_amount: Ödenmiş tutar
  - payment_status: [pending, partial, paid, cancelled]
  - account_id: Ödeme yapılan hesap

- **purchase_order_items**: Sipariş kalemleri
  - quantity: Miktar
  - unit_price: Birim fiyat
  - material_id: Hammadde ID

- **stock_movements**: Stok hareketleri
  - material_id: Hammadde
  - movement_type: [in, out]
  - quantity: Miktar
  - source_type: [purchase, sale, waste, adjustment]

- **transactions**: Finansal işlemler
  - account_id: Hesap
  - type: [in, out]
  - amount: Tutar
  - status: İşlem durumu

- **accounts**: Kasa/Banka hesapları
  - balance_calculated: Güncel bakiye
  - type: [cash, pos, bank, online]

## 2. İş Akışı

### 2.1 Satın Alma Siparişi Oluşturma
1. Tedarikçi seçimi
2. Hammadde seçimi ve miktar girişi
3. Birim fiyat belirleme
4. Toplam tutar hesaplama
5. Sipariş kaydı

### 2.2 Stok Girişi (Otomatik)
1. Sipariş kaydedildiğinde trigger çalışır
2. Her kalem için stok hareketi oluşturulur
   - movement_type: 'in'
   - source_type: 'purchase'

### 2.3 Ödeme İşlemi
1. Ödeme modalı açılır
2. Sipariş özeti görüntülenir:
   - Toplam tutar
   - Ödenmiş tutar
   - Kalan tutar
3. Ödeme bilgileri girilir:
   - Ödeme tutarı
   - Ödeme yöntemi
   - Hesap seçimi
4. Ödeme kaydedilir

### 2.4 Finansal İşlemler (Otomatik)
1. Ödeme yapıldığında trigger çalışır
2. Transactions tablosuna kayıt atılır:
   - type: 'out'
   - related_type: 'purchase'
3. Hesap bakiyesi güncellenir:
   - balance_calculated azaltılır

## 3. Durum Kontrolleri

### 3.1 Ödeme Durumu (payment_status)
- **pending**: Hiç ödeme yapılmamış
- **partial**: Kısmi ödeme yapılmış
  - paid_amount < total_amount
- **paid**: Tamamen ödenmiş
  - paid_amount = total_amount
- **cancelled**: İptal edilmiş

### 3.2 Validasyonlar
1. Sipariş Oluşturma:
   - Tedarikçi zorunlu
   - En az bir kalem olmalı
   - Miktar > 0
   - Birim fiyat >= 0

2. Ödeme:
   - Tutar > 0
   - Tutar <= kalan_tutar
   - Hesap seçimi zorunlu
   - Ödeme yöntemi zorunlu

## 4. Güvenlik Kontrolleri
1. Ödeme tutarı toplam tutarı geçemez
2. Negatif ödeme yapılamaz
3. İptal edilmiş siparişe ödeme yapılamaz
4. Hesap bakiyesi negatife düşemez

## 5. Raporlama
1. Sipariş listesi:
   - Tedarikçi
   - Toplam tutar
   - Ödeme durumu
   - Kalem sayısı

2. Ödeme geçmişi:
   - Tarih
   - Tutar
   - Ödeme yöntemi
   - Hesap
