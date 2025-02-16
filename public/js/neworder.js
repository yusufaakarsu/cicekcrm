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
        phoneInput.addEventListener('input', (e) => this.formatPhoneDisplay(e.target));
        
        // Enter tuşu ile arama
        phoneInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchCustomer();
            }
        });

        // Form adımları için butonlar
        document.querySelectorAll('[data-action="next"]').forEach(btn => 
            btn.addEventListener('click', () => this.nextStep())
        );
        document.querySelectorAll('[data-action="prev"]').forEach(btn => 
            btn.addEventListener('click', () => this.prevStep())
        );

        // Form submit
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // İlk adımı göster
        this.showStep(1);
    }

    // Telefon numarasını temizle ve formatla
    cleanPhoneNumber(phone) {
        // Tüm boşlukları ve özel karakterleri kaldır
        let clean = phone.replace(/\D/g, '');
        
        // Baştaki 0'ı kaldır
        if (clean.startsWith('0')) {
            clean = clean.substring(1);
        }
        
        return clean;
    }

    // Input formatlaması (görsel amaçlı)
    formatPhoneDisplay(input) {
        let clean = this.cleanPhoneNumber(input.value);
        
        // Uzunluk kontrolü
        if (clean.length > 10) clean = clean.slice(0, 10);
        
        // XXX XXX XX XX formatı
        if (clean.length >= 3) clean = clean.slice(0,3) + ' ' + clean.slice(3);
        if (clean.length >= 7) clean = clean.slice(0,7) + ' ' + clean.slice(7);
        if (clean.length >= 9) clean = clean.slice(0,9) + ' ' + clean.slice(9);
        
        input.value = clean;
    }

    async searchCustomer() {
        // Telefon numarasını formatla
        const rawPhone = document.querySelector('input[name="phone"]').value;
        const cleanPhone = this.cleanPhoneNumber(rawPhone);
        
        if (cleanPhone.length !== 10) {
            showError('Geçerli bir telefon numarası girin');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/customers/phone/${cleanPhone}`);
            const data = await response.json();

            if (data.success) {
                // Mevcut müşteri
                this.customerId = data.customer.id;
                this.showCustomerDetails(data.customer);
                // Kayıtlı adresleri yükle
                this.loadCustomerAddresses(data.customer.id);
            } else {
                // Yeni müşteri formu
                this.showNewCustomerForm();
            }
        } catch (error) {
            console.error('Müşteri arama hatası:', error);
            this.showNewCustomerForm(); // Bulunamadıysa yeni form göster
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
            
            const container = document.getElementById('savedAddresses');
            container.innerHTML = addresses.map(addr => `
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" 
                           name="delivery_address_id" value="${addr.id}" 
                           id="addr_${addr.id}" required>
                    <label class="form-check-label" for="addr_${addr.id}">
                        ${addr.label}<br>
                        <small class="text-muted">
                            ${addr.street}, ${addr.district}/${addr.city}
                        </small>
                    </label>
                </div>
            `).join('');
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

    // ...devamı gelecek (validateStep, handleSubmit vb. metodlar)
}

// Sayfa yüklendiğinde formu başlat
document.addEventListener('DOMContentLoaded', () => {
    window.newOrderForm = new NewOrderForm();
});
