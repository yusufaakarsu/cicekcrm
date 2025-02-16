class OrderForm {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.customerId = null;
        this.items = [];
        this.form = document.getElementById('orderForm');
        this.progressBar = document.querySelector('.progress-bar');
        
        this.init();
    }

    init() {
        // Müşteri arama
        document.getElementById('searchCustomer').addEventListener('click', () => this.searchCustomer());
        
        // Adres seçici
        const addressSelect = new AddressSelect('addressSelect', {
            apiKey: CONFIG.HERE_API_KEY,
            onSelect: (address) => this.handleAddressSelect(address)
        });

        // Form gönderimi
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Next/Prev butonları
        document.querySelectorAll('[onclick="nextStep()"]').forEach(btn => 
            btn.addEventListener('click', () => this.nextStep())
        );
        document.querySelectorAll('[onclick="prevStep()"]').forEach(btn => 
            btn.addEventListener('click', () => this.prevStep())
        );

        // Telefon inputu formatlama
        const phoneInputs = document.querySelectorAll('input[type="tel"]');
        phoneInputs.forEach(input => {
            input.addEventListener('input', (e) => this.formatPhoneNumber(e.target));
        });

        // İlk adımı göster
        this.showStep(1);
    }

    async searchCustomer() {
        const phone = document.querySelector('input[name="phone"]').value;
        if (!phone) return;

        try {
            const response = await fetch(`${API_URL}/customers/search/phone/${phone}`);
            const data = await response.json();

            if (data.found) {
                // Mevcut müşteri bulundu
                this.showCustomerDetails(data);
                this.customerId = data.id;
            } else {
                // Yeni müşteri formu göster
                document.getElementById('customerForm').style.display = 'block';
                document.getElementById('customerDetails').style.display = 'none';
            }
        } catch (error) {
            console.error('Müşteri arama hatası:', error);
            showError('Müşteri aranamadı');
        }
    }

    showCustomerDetails(customer) {
        const details = document.getElementById('customerDetails');
        const info = document.getElementById('customerInfo');
        
        info.innerHTML = `
            <strong>${customer.name}</strong><br>
            ${customer.phone}<br>
            <small>${customer.email || ''}</small>
        `;
        
        details.style.display = 'block';
        document.getElementById('customerForm').style.display = 'none';
    }

    handleAddressSelect(address) {
        console.log('Seçilen adres:', address);
        // Adres seçimi sonrası işlemler
    }

    showStep(step) {
        // Önceki adımı gizle
        document.querySelectorAll(`[id^="step"]`).forEach(el => 
            el.style.display = 'none'
        );
        
        // Yeni adımı göster
        document.getElementById(`step${step}`).style.display = 'block';
        
        // Progress bar güncelle
        const progress = ((step - 1) / (this.totalSteps - 1)) * 100;
        this.progressBar.style.width = `${progress}%`;
        
        // Badge'leri güncelle
        document.querySelectorAll('.badge').forEach((badge, index) => {
            if (index + 1 === step) {
                badge.classList.remove('bg-secondary');
                badge.classList.add('bg-primary');
            } else if (index + 1 < step) {
                badge.classList.remove('bg-secondary');
                badge.classList.add('bg-success');
            } else {
                badge.classList.remove('bg-primary', 'bg-success');
                badge.classList.add('bg-secondary');
            }
        });
    }

    validateStep(step) {
        switch(step) {
            case 1:
                return this.customerId || (
                    document.querySelector('[name="customer_name"]').value &&
                    document.querySelector('[name="phone"]').value
                );
            case 2:
                return document.querySelector('[name="delivery_address_id"]').value &&
                       document.querySelector('[name="recipient_name"]').value &&
                       document.querySelector('[name="recipient_phone"]').value &&
                       document.querySelector('[name="delivery_date"]').value &&
                       document.querySelector('[name="delivery_time_slot"]').value;
            case 3:
                return this.items.length > 0;
            case 4:
                return document.querySelector('[name="payment_method"]').value;
            default:
                return true;
        }
    }

    nextStep() {
        if (!this.validateStep(this.currentStep)) {
            showError('Lütfen tüm zorunlu alanları doldurun');
            return;
        }
        
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.showStep(this.currentStep);
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 10) value = value.slice(0, 10);
        input.value = value;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateStep(this.currentStep)) {
            showError('Lütfen tüm zorunlu alanları doldurun');
            return;
        }

        try {
            const formData = new FormData(this.form);
            const orderData = {
                customer_id: this.customerId,
                customer_name: formData.get('customer_name'),
                phone: formData.get('phone'),
                delivery_address_id: formData.get('delivery_address_id'),
                recipient_name: formData.get('recipient_name'),
                recipient_phone: formData.get('recipient_phone'),
                delivery_date: formData.get('delivery_date'),
                delivery_time_slot: formData.get('delivery_time_slot'),
                card_message: formData.get('card_message'),
                items: this.items,
                payment_method: formData.get('payment_method'),
                total_amount: this.calculateTotal()
            };

            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) throw new Error('Sipariş kaydedilemedi');

            const result = await response.json();
            window.location.href = `/orders/detail.html?id=${result.id}`;

        } catch (error) {
            console.error('Sipariş hatası:', error);
            showError('Sipariş kaydedilemedi');
        }
    }

    calculateTotal() {
        const subtotal = this.items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0
        );
        const deliveryFee = 50; // Sabit teslimat ücreti
        return subtotal + deliveryFee;
    }
}

// Sayfa yüklendiğinde form initialize edilir
document.addEventListener('DOMContentLoaded', () => {
    window.orderForm = new OrderForm();
});
