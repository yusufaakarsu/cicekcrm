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
                
                // Step 2'deki müşteri özeti ve adres listesi
                const customerSummary = document.getElementById('customerSummary');
                customerSummary.innerHTML = `
                    <div class="mb-2">
                        <strong>${data.customer.name}</strong><br>
                        <small class="text-muted">${formatPhoneNumber(data.customer.phone)}</small>
                    </div>
                `;

                // Adresleri yükle
                await this.loadCustomerAddresses(data.customer.id);
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
        // Önceki adımı gizle
        document.querySelectorAll('.step-content').forEach(el => {
            el.style.display = 'none';
        });

        // Yeni adımı göster
        const currentStepEl = document.querySelector(`.step-content[data-step="${step}"]`);
        if (currentStepEl) {
            currentStepEl.style.display = 'block';

            // Step 2'de data-step="2" olan tüm içeriği göster
            if (step === 2) {
                document.getElementById('step2').style.display = 'block';
            }
            
            // Progress bar güncelle
            const progress = ((step - 1) / (this.totalSteps - 1)) * 100;
            document.querySelector('.progress-bar').style.width = `${progress}%`;
            
            // Badge'leri güncelle
            document.querySelectorAll('.badge').forEach((badge, index) => {
                badge.className = `badge ${index + 1 === step ? 'bg-primary' : 
                                 index + 1 < step ? 'bg-success' : 'bg-secondary'}`;
            });
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

async function proceedToStep2() {
    const phone = document.getElementById('customerPhone').value;
    if (!phone) {
        showError('Lütfen telefon numarası girin');
        return;
    }

    try {
        // Müşteri kontrolü
        const customerResponse = await fetch(`${API_URL}/customers/search/phone/${phone}`);
        if (!customerResponse.ok) throw new Error('Müşteri arama hatası');
        
        const customerData = await customerResponse.json();
        
        // Müşteri bulunduysa
        if (customerData && customerData.id) {
            currentCustomer = customerData;
            
            // Müşteri özeti
            document.getElementById('customerSummary').innerHTML = `
                <div class="mb-2">
                    <strong>${customerData.name}</strong><br>
                    <small class="text-muted">${formatPhoneNumber(customerData.phone)}</small>
                </div>
            `;

            // Kayıtlı adresleri getir
            const addressesResponse = await fetch(`${API_URL}/customers/${customerData.id}/addresses`);
            if (!addressesResponse.ok) throw new Error('Adres getirme hatası');
            
            const addresses = await addressesResponse.json();
            
            // Adresleri listele
            const addressesContainer = document.getElementById('savedAddresses');
            if (addresses && addresses.length > 0) {
                addressesContainer.innerHTML = addresses.map(address => `
                    <div class="list-group-item list-group-item-action" role="button" 
                         onclick="selectSavedAddress(${address.id}, '${address.label}', '${address.district}, ${address.city}')">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">${address.label}</h6>
                            ${address.is_default ? '<span class="badge bg-primary">Varsayılan</span>' : ''}
                        </div>
                        <p class="mb-1">${address.street}</p>
                        <small class="text-muted">${address.district}, ${address.city}</small>
                    </div>
                `).join('');
            } else {
                addressesContainer.innerHTML = '<div class="text-muted">Kayıtlı adres bulunamadı</div>';
            }
        }

        // Step 2'ye geç
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';

    } catch (error) {
        console.error('Hata:', error);
        showError('İşlem sırasında bir hata oluştu');
    }
}

// Kayıtlı adres seçme fonksiyonu
function selectSavedAddress(addressId, label, location) {
    // Seçilen adresi forma doldur
    currentDeliveryAddress = {
        id: addressId,
        label: label,
        location: location
    };
    
    // Adres özeti göster
    document.getElementById('selectedAddressPreview').innerHTML = `
        <div class="mb-2">
            <strong>${label}</strong><br>
            <small class="text-muted">${location}</small>
        </div>
        <button type="button" class="btn btn-sm btn-outline-primary" onclick="changeAddress()">
            <i class="bi bi-pencil"></i> Değiştir
        </button>
    `;
    
    // Adres seçim alanını gizle
    document.getElementById('addressSelectionArea').style.display = 'none';
}

// Yeni fonksiyon: Müşteri adreslerini yükle
async function loadCustomerAddresses(customerId) {
    try {
        const response = await fetch(`${API_URL}/customers/${customerId}/addresses`);
        if (!response.ok) throw new Error('Adres getirme hatası');
        
        const addresses = await response.json();
        const addressesContainer = document.getElementById('savedAddresses');
        
        if (addresses && addresses.length > 0) {
            addressesContainer.innerHTML = addresses.map(address => `
                <div class="list-group-item list-group-item-action" role="button" 
                     onclick="selectSavedAddress(${address.id}, '${address.label}', '${address.district}, ${address.city}')">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${address.label}</h6>
                        ${address.is_default ? '<span class="badge bg-primary">Varsayılan</span>' : ''}
                    </div>
                    <p class="mb-1">${address.street || ''}</p>
                    <small class="text-muted">${address.district}, ${address.city}</small>
                </div>
            `).join('');
        } else {
            addressesContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> Kayıtlı adres bulunamadı
                </div>
            `;
        }
    } catch (error) {
        console.error('Adres yükleme hatası:', error);
        showError('Adresler yüklenemedi');
    }
}
