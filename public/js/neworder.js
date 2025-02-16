class NewOrderForm {
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
        // Header'ı yükle
        loadHeader();

        // Müşteri arama dinleyicisi
        const searchButton = document.getElementById('searchCustomer');
        const phoneInput = document.querySelector('input[name="phone"]');
        
        searchButton.addEventListener('click', () => this.searchCustomer());
        
        // Enter tuşu ile arama
        phoneInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchCustomer();
            }
        });

        // Form adımları için butonlar - data-action yerine onclick kullan
        document.querySelectorAll('[onclick="nextStep()"]').forEach(btn => 
            btn.addEventListener('click', () => this.nextStep())
        );
        document.querySelectorAll('[onclick="prevStep()"]').forEach(btn => 
            btn.addEventListener('click', () => this.prevStep())
        );

        // Form submit
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // İlk adımı göster
        this.showStep(1);
    }

    // Sadece API çağrısı öncesi temizleme yap
    cleanPhoneNumber(phone) {
        return phone.replace(/\D/g, '').replace(/^0+/, '');
    }

    async searchCustomer() {
        const rawPhone = document.querySelector('input[name="phone"]').value;
        const cleanPhone = this.cleanPhoneNumber(rawPhone);
        
        if (cleanPhone.length !== 10) {
            showError('Geçerli bir telefon numarası girin');
            return;
        }

        console.log('Aranan numara:', cleanPhone); // Debug için

        try {
            const response = await fetch(`${API_URL}/customers/phone/${cleanPhone}`);
            const data = await response.json();
            
            console.log('API yanıtı:', data); // Debug için

            if (data && data.customer) {
                this.customerId = data.customer.id;
                this.showCustomerDetails(data.customer);
                this.loadCustomerAddresses(data.customer.id);
            } else {
                this.showNewCustomerForm();
            }
        } catch (error) {
            console.error('Müşteri arama hatası:', error);
            this.showNewCustomerForm();
        }
    }

    showCustomerDetails(customer) {
        const details = document.getElementById('customerDetails');
        details.innerHTML = `
            <div class="alert alert-success mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="alert-heading mb-1">Mevcut Müşteri</h6>
                        <p class="mb-0">
                            <strong>${customer.name}</strong><br>
                            ${formatPhoneNumber(customer.phone)}<br>
                            <small>${customer.email || ''}</small>
                        </p>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-success" 
                            onclick="newOrderForm.editCustomer()">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
            </div>
        `;
        details.style.display = 'block';
        document.getElementById('customerForm').style.display = 'none';
    }

    async loadCustomerAddresses(customerId) {
        try {
            const response = await fetch(`${API_URL}/customers/${customerId}/addresses`);
            const addresses = await response.json();
            
            // Container kontrolü ekle
            const container = document.getElementById('addressesContainer'); // ID'yi HTML ile eşleştir
            if (!container) {
                console.warn('Adres container bulunamadı');
                return;
            }

            if (addresses && addresses.length > 0) {
                container.innerHTML = addresses.map(addr => `
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="radio" 
                               name="delivery_address_id" value="${addr.id}" 
                               id="addr_${addr.id}" required>
                        <label class="form-check-label" for="addr_${addr.id}">
                            ${addr.label || 'Adres'}<br>
                            <small class="text-muted">
                                ${[addr.street, addr.district, addr.city].filter(Boolean).join(', ')}
                            </small>
                        </label>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<div class="alert alert-info">Kayıtlı adres bulunamadı</div>';
            }
        } catch (error) {
            console.error('Adresler yüklenemedi:', error);
        }
    }

    showStep(step) {
        // Progress bar ve badge'leri güncelle
        const progress = ((step - 1) / (this.totalSteps - 1)) * 100;
        this.progressBar.style.width = `${progress}%`;
        
        document.querySelectorAll('.step-badge').forEach((badge, index) => {
            badge.classList.remove('bg-primary', 'bg-success', 'bg-secondary');
            if (index + 1 === step) {
                badge.classList.add('bg-primary');
            } else if (index + 1 < step) {
                badge.classList.add('bg-success');
            } else {
                badge.classList.add('bg-secondary');
            }
        });

        // Adımı göster/gizle
        document.querySelectorAll('.step-content').forEach(content => {
            content.style.display = content.dataset.step == step ? 'block' : 'none';
        });
    }

    // Yeni müşteri formu göster
    showNewCustomerForm() {
        const form = document.getElementById('customerForm');
        const details = document.getElementById('customerDetails');
        
        form.style.display = 'block';
        details.style.display = 'none';
        
        // Form alanlarını temizle
        form.querySelector('[name="customer_name"]').value = '';
        form.querySelector('[name="customer_email"]').value = '';
    }

    validateStep(step) {
        switch(step) {
            case 1: // Müşteri bilgileri
                return this.customerId || (
                    document.querySelector('[name="customer_name"]')?.value &&
                    document.querySelector('[name="phone"]')?.value
                );
            case 2: // Teslimat bilgileri
                return document.querySelector('[name="delivery_address_id"]')?.value &&
                       document.querySelector('[name="recipient_name"]')?.value &&
                       document.querySelector('[name="recipient_phone"]')?.value;
            case 3: // Ürün seçimi
                return true; // Şimdilik geç
            case 4: // Ödeme
                return document.querySelector('[name="payment_method"]')?.value;
            default:
                return true;
        }
    }

    nextStep() {
        if (!this.validateStep(this.currentStep)) {
            showError('Lütfen tüm zorunlu alanları doldurunuz');
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
}

// Sayfa yüklendiğinde formu başlat
document.addEventListener('DOMContentLoaded', () => {
    window.newOrderForm = new NewOrderForm();
});
