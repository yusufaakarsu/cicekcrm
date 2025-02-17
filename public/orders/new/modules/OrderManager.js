class OrderManager {
    constructor() {
        this.form = document.getElementById('orderForm');
        this.setupListeners();
    }

    setupListeners() {
        this.form.addEventListener('submit', e => this.handleSubmit(e));
    }

    async handleSubmit(e) {
        e.preventDefault();

        // 1. Müşteri kontrolü
        const customer = window.customerManager.getCustomer();
        if (!customer) {
            showError('Lütfen müşteri seçin');
            return;
        }

        // 2. Adres kontrolü
        const address = window.addressManager.getSelectedAddress();
        if (!address) {
            showError('Lütfen teslimat adresi seçin');
            return;
        }

        // 3. Ürün kontrolü
        const items = window.productManager.getItems();
        if (!items.length) {
            showError('Lütfen en az bir ürün ekleyin');
            return;
        }

        // Form verilerini topla
        const orderData = {
            customer_id: customer.id,
            delivery_address_id: address.id,
            recipient_name: document.getElementById('recipientName').value,
            recipient_phone: document.getElementById('recipientPhone').value,
            delivery_date: document.getElementById('deliveryDate').value,
            delivery_time_slot: document.getElementById('timeSlot').value,
            card_message: document.getElementById('cardMessage').value,
            notes: document.getElementById('orderNotes').value,
            payment_method: document.getElementById('paymentMethod').value,
            items: items
        };

        try {
            // Loading göster
            const submitBtn = this.form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Kaydediliyor...';
            submitBtn.disabled = true;

            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) throw new Error('Sipariş oluşturulamadı');

            showSuccess('Sipariş başarıyla oluşturuldu');
            
            // Temizle ve yönlendir
            setTimeout(() => {
                window.location.href = '/orders/list.html';
            }, 1500);

        } catch (error) {
            console.error('Sipariş hatası:', error);
            showError('Sipariş oluşturulamadı');
            
            // Button'u eski haline getir
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }

        window.wizardManager.setStepCompleted(3, true);
    }

    validateForm() {
        const requiredFields = {
            'recipientName': 'Alıcı adı',
            'recipientPhone': 'Alıcı telefonu',
            'deliveryDate': 'Teslimat tarihi',
            'timeSlot': 'Teslimat saati',
            'paymentMethod': 'Ödeme yöntemi'
        };

        for (const [id, label] of Object.entries(requiredFields)) {
            const input = document.getElementById(id);
            if (!input?.value) {
                showError(`Lütfen ${label} alanını doldurun`);
                input?.focus();
                return false;
            }
        }

        return true;
    }
}

window.orderManager = new OrderManager();
