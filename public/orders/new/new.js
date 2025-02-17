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

    // Telefon numarasını temizleme
    cleanPhoneNumber(phone) {
        if (!phone) return '';
        // Tüm boşlukları ve özel karakterleri kaldır
        let cleaned = phone.replace(/\D/g, '');
        // Başındaki 0'ı kaldır
        cleaned = cleaned.replace(/^0+/, '');
        // 10 haneden uzunsa kes, kısaysa başına 0 ekle
        if (cleaned.length > 10) {
            cleaned = cleaned.substring(cleaned.length - 10);
        }
        return cleaned;
    }

    async searchCustomer() {
        const rawPhone = document.querySelector('input[name="phone"]').value;
        const cleanPhone = this.cleanPhoneNumber(rawPhone);
        
        console.log('Temizlenmiş numara:', cleanPhone); // Debug için

        try {
            const response = await fetch(`${API_URL}/customers/phone/${cleanPhone}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            console.log('API Yanıtı:', data); // Debug için
            
            if (data && data.customer) {
                this.customerId = data.customer.id;
                this.showCustomerDetails(data.customer);
                
                // Müşteri özeti
                const customerSummary = document.getElementById('customerSummary');
                if (customerSummary) {
                    customerSummary.innerHTML = `
                        <div class="mb-2">
                            <strong>${data.customer.name}</strong><br>
                            <small class="text-muted">${formatPhoneNumber(data.customer.phone)}</small>
                        </div>
                    `;
                }

                // Adresleri yükle
                await this.loadCustomerAddresses(data.customer.id);
                
                // Step 2'ye geç
                this.nextStep();
            } else {
                this.showNewCustomerForm();
            }
        } catch (error) {
            console.error('Müşteri arama hatası:', error);
            showError('Müşteri bulunamadı veya bir hata oluştu');
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
                // Seçilen adres kontrolü - addressSelectContainer'dan kontrol et
                const addressContainer = document.getElementById('addressSelectContainer');
                const selectedAddressPreview = document.getElementById('selectedAddressPreview');
                
                // Eğer adres seçilmediyse veya gizliyse
                if (!selectedAddressPreview || selectedAddressPreview.style.display === 'none') {
                    showError('Lütfen teslimat adresi seçin');
                    return false;
                }

                // Alıcı bilgileri kontrolü
                const recipientName = document.querySelector('[name="recipient_name"]');
                const recipientPhone = document.querySelector('[name="recipient_phone"]');
                const deliveryDate = document.querySelector('[name="delivery_date"]');
                const timeSlot = document.querySelector('[name="delivery_time_slot"]');

                // Her alan için ayrı kontrol ve hata mesajı
                if (!recipientName?.value) {
                    showError('Lütfen alıcı adını girin');
                    recipientName?.focus();
                    return false;
                }

                if (!recipientPhone?.value) {
                    showError('Lütfen alıcı telefon numarasını girin');
                    recipientPhone?.focus();
                    return false;
                }

                if (!deliveryDate?.value) {
                    showError('Lütfen teslimat tarihi seçin');
                    deliveryDate?.focus();
                    return false;
                }

                if (!timeSlot?.value) {
                    showError('Lütfen teslimat saati seçin');
                    timeSlot?.focus();
                    return false;
                }

                return true;

            case 3: // Ürün seçimi güncellendi
                if (this.items.length === 0) {
                    showError('Lütfen en az bir ürün seçin');
                    return false;
                }
                return true;

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

    // Müşteri adreslerini yükleme metodunu class içine taşıyalım
    async loadCustomerAddresses(customerId) {
        try {
            const response = await fetch(`${API_URL}/customers/${customerId}/addresses`);
            if (!response.ok) throw new Error('Adres getirme hatası');
            
            const addresses = await response.json();
            const addressesContainer = document.getElementById('savedAddresses');
            
            if (!addressesContainer) return;
            
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

    // Ürün ekleme fonksiyonu güncellendi
    addToCart(productId) {
        const qtyInput = document.getElementById(`qty_${productId}`);
        const quantity = parseInt(qtyInput.value);
        
        if (isNaN(quantity) || quantity < 1) {
            showError('Lütfen geçerli bir miktar girin');
            return;
        }

        // Ürünü bul
        const productElement = qtyInput.closest('tr');
        const productName = productElement.querySelector('td:first-child').textContent;
        const productPrice = parseFloat(productElement.querySelector('td:nth-child(3)').textContent.replace(/[^0-9,]/g, '').replace(',', '.'));

        // Sepete ekle
        this.items.push({
            id: productId,
            name: productName,
            quantity: quantity,
            price: productPrice,
            total: quantity * productPrice
        });

        // Sepeti güncelle
        this.updateCart();
        
        // Input'u sıfırla
        qtyInput.value = "1";
        
        // Başarılı mesajı göster
        showSuccess(`${productName} sepete eklendi`);
    }

    // Sepet güncelleme fonksiyonu
    updateCart() {
        const cartContainer = document.getElementById('selectedProducts');
        if (!cartContainer) return;

        if (this.items.length === 0) {
            cartContainer.innerHTML = '<div class="alert alert-info">Henüz ürün seçilmedi</div>';
            return;
        }

        cartContainer.innerHTML = `
            <div class="list-group">
                ${this.items.map(item => `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0">${item.name}</h6>
                            <small class="text-muted">${item.quantity} adet x ${formatCurrency(item.price)}</small>
                        </div>
                        <div class="d-flex align-items-center">
                            <strong>${formatCurrency(item.total)}</strong>
                            <button type="button" class="btn btn-sm btn-outline-danger ms-2" 
                                    onclick="window.newOrderForm.removeFromCart(${item.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="text-end mt-3">
                <strong>Toplam: ${formatCurrency(this.getTotalAmount())}</strong>
            </div>
        `;
    }

    // Sepetten ürün çıkarma
    removeFromCart(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.updateCart();
    }

    // Toplam tutarı hesapla
    getTotalAmount() {
        return this.items.reduce((total, item) => total + item.total, 0);
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
    const previewElement = document.getElementById('selectedAddressPreview');
    if (previewElement) {
        previewElement.innerHTML = `
            <div class="alert alert-success mb-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${label}</strong><br>
                        <small class="text-muted">${location}</small>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-success" onclick="changeAddress()">
                        <i class="bi bi-pencil"></i> Değiştir
                    </button>
                </div>
            </div>
        `;
        previewElement.style.display = 'block';
    }
    
    // Adres seçim alanını gizle
    const selectArea = document.getElementById('addressSelectionArea');
    if (selectArea) {
        selectArea.style.display = 'none';
    }
}
