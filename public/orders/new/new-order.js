// Global state yönetimi
const orderState = {
    customer: null,
    delivery: {
        date: null,
        timeSlot: null,
        address: null,
        type: 'recipient' // 'recipient' veya 'customer'
    },
    recipient: {
        name: '',
        phone: '',
        note: '',
        cardMessage: ''
    },
    items: [], // {productId, quantity, price}
    payment: {
        method: 'cash',
        status: 'pending'
    },
    totals: {
        subtotal: 0,
        deliveryFee: 0,
        discount: 0,
        total: 0
    }
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    initializeComponents();
    setupEventListeners();
});

// Bileşenleri başlat
function initializeComponents() {
    // Müşteri seçim bileşeni
    const customerSelect = new CustomerSelect('customerSelectContainer');
    
    // Teslimat formu
    const deliveryForm = new DeliveryForm('deliveryFormContainer');
    
    // Ürün seçim bileşeni
    const productSelect = new ProductSelect('productSelectContainer');
    
    // Ödeme formu
    const paymentForm = new PaymentForm('paymentFormContainer');
}

// Event listener'ları ayarla
function setupEventListeners() {
    // Müşteri seçildiğinde
    document.addEventListener('customerSelected', (e) => {
        orderState.customer = e.detail;
        updateDeliveryOptions();
    });

    // Teslimat bilgileri güncellendiğinde
    document.addEventListener('deliveryUpdated', (e) => {
        orderState.delivery = {...orderState.delivery, ...e.detail};
        updateTotals();
    });

    // Ürün eklendiğinde/çıkarıldığında
    document.addEventListener('cartUpdated', (e) => {
        orderState.items = e.detail;
        updateTotals();
    });

    // Ödeme yöntemi değiştiğinde
    document.addEventListener('paymentMethodChanged', (e) => {
        orderState.payment.method = e.detail;
        updateTotals();
    });
}

// Toplam tutarları güncelle
function updateTotals() {
    // Ara toplam hesapla
    orderState.totals.subtotal = orderState.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
    );

    // Teslimat ücreti hesapla
    orderState.totals.deliveryFee = calculateDeliveryFee(
        orderState.delivery.address,
        orderState.delivery.timeSlot
    );

    // Toplam tutar
    orderState.totals.total = 
        orderState.totals.subtotal + 
        orderState.totals.deliveryFee - 
        orderState.totals.discount;

    // UI güncelle
    document.getElementById('orderTotal').textContent = 
        formatCurrency(orderState.totals.total);
}

// Siparişi kaydet
async function saveOrder() {
    if (!validateOrder()) return;

    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customer_id: orderState.customer.id,
                delivery_date: orderState.delivery.date,
                delivery_time_slot: orderState.delivery.timeSlot,
                delivery_address_id: orderState.delivery.address.id,
                delivery_type: orderState.delivery.type,
                recipient_name: orderState.recipient.name,
                recipient_phone: orderState.recipient.phone,
                recipient_note: orderState.recipient.note,
                card_message: orderState.recipient.cardMessage,
                items: orderState.items,
                payment_method: orderState.payment.method,
                total_amount: orderState.totals.total,
                delivery_fee: orderState.totals.deliveryFee,
                subtotal: orderState.totals.subtotal,
                discount_amount: orderState.totals.discount
            })
        });

        if (!response.ok) throw new Error('API Hatası');

        const result = await response.json();
        
        showSuccess('Sipariş başarıyla oluşturuldu!');
        setTimeout(() => {
            window.location.href = `/orders/orders.html`;
        }, 1500);

    } catch (error) {
        console.error('Sipariş kaydedilirken hata:', error);
        showError('Sipariş kaydedilemedi!');
    }
}

// Sipariş validasyonu
function validateOrder() {
    // Müşteri kontrolü
    if (!orderState.customer) {
        showError('Lütfen müşteri seçin');
        return false;
    }

    // Teslimat bilgileri kontrolü
    if (!orderState.delivery.date || !orderState.delivery.timeSlot || !orderState.delivery.address) {
        showError('Lütfen teslimat bilgilerini eksiksiz doldurun');
        return false;
    }

    // Alıcı bilgileri kontrolü
    if (!orderState.recipient.name || !orderState.recipient.phone) {
        showError('Lütfen alıcı bilgilerini eksiksiz doldurun');
        return false;
    }

    // Ürün kontrolü
    if (orderState.items.length === 0) {
        showError('Lütfen en az bir ürün ekleyin');
        return false;
    }

    return true;
}

// Teslimat ücreti hesaplama
function calculateDeliveryFee(address, timeSlot) {
    // Temel ücret
    let fee = 50;

    // Mesafeye göre ek ücret (TODO: HERE Maps ile mesafe hesaplama)
    // ...

    // Zaman dilimine göre ek ücret
    if (timeSlot === 'morning') fee += 20;
    if (timeSlot === 'evening') fee += 30;

    return fee;
}
