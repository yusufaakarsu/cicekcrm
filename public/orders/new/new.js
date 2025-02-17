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

        try {
            const response = await fetch(`${API_URL}/customers/phone/${cleanPhone}`);
            const data = await response.json();
            
            if (data && data.customer) {
                this.customerId = data.customer.id;
                this.showCustomerDetails(data.customer);
                
                // Adresleri yükle - AddressSelect instance'ı varsa çağır
                if (window.addressSelect) {
                    await window.addressSelect.loadSavedAddresses(data.customer.id);
                }
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

    async loadProducts() {
        try {
            // API çalışana kadar test data kullan
            const testProducts = [
                {id: 1, name: 'Kırmızı Güller', stock: 50, retail_price: 199.90},
                {id: 2, name: 'Beyaz Orkide', stock: 25, retail_price: 299.90},
                {id: 3, name: 'Renkli Papatya', stock: 75, retail_price: 149.90}
            ];

            const productList = document.getElementById('productList');
            productList.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Ürün</th>
                                <th>Stok</th>
                                <th>Fiyat</th>
                                <th>Adet</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${testProducts.map(product => `
                                <tr>
                                    <td>${product.name}</td>
                                    <td>${product.stock}</td>
                                    <td>${formatCurrency(product.retail_price)}</td>
                                    <td style="width: 100px">
                                        <input type="number" class="form-control form-control-sm"
                                               min="1" max="${product.stock}" value="1"
                                               id="qty_${product.id}">
                                    </td>
                                    <td>
                                        <button type="button" class="btn btn-sm btn-primary"
                                                onclick="window.newOrderForm.addToCart(${product.id})">
                                            <i class="bi bi-plus"></i> Ekle
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            console.error('Ürünler yüklenemedi:', error);
            showError('Ürünler yüklenemedi');
        }
    }

    async showStep(step) {
        // Progress bar ve badge'leri güncelle
        const progress = ((step - 1) / (this.totalSteps - 1)) * 100;
        this.progressBar.style.width = `${progress}%`;
        
        // Badge'leri güncelle
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

        // Tüm adımları gizle
        document.querySelectorAll('.step-content').forEach(content => {
            content.style.display = 'none';
        });

        // Aktif adımı göster
        const activeStep = document.querySelector(`.step-content[data-step="${step}"]`);
        if (activeStep) {
            activeStep.style.display = 'block';
            console.log(`Adım ${step} gösteriliyor`); // Debug için
        } else {
            console.warn(`Adım ${step} bulunamadı`); // Debug için
        }

        // Ürün adımında ürünleri yükle
        if (step === 3) {
            await this.loadProducts();
        }
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
                if (this.customerId) return true; // Mevcut müşteri varsa geç
                
                const customerForm = document.getElementById('customerForm');
                if (customerForm.style.display === 'none') return true;
                
                return document.querySelector('[name="customer_name"]')?.value &&
                       document.querySelector('[name="phone"]')?.value;

            case 2: // Teslimat bilgileri
                const selectedAddress = window.addressSelect?.getSelectedAddress();
                if (!selectedAddress) {
                    showError('Lütfen teslimat adresi seçin');
                    return false;
                }

                const recipientName = document.querySelector('[name="recipient_name"]')?.value;
                const recipientPhone = document.querySelector('[name="recipient_phone"]')?.value;
                const deliveryDate = document.querySelector('[name="delivery_date"]')?.value;
                const timeSlot = document.querySelector('[name="delivery_time_slot"]')?.value;

                if (!recipientName || !recipientPhone || !deliveryDate || !timeSlot) {
                    showError('Lütfen tüm zorunlu alanları doldurun');
                    return false;
                }

                return true;

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

// Global instance
document.addEventListener('DOMContentLoaded', () => {
    window.newOrderForm = new NewOrderForm();
});
