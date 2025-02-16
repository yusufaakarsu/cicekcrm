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
            
                // Müşteri adreslerini getir
                const addressResponse = await fetch(`${API_URL}/customers/${data.customer.id}/addresses`);
                const addresses = await addressResponse.json();

                const container = document.getElementById('addressesContainer');
                
                // Önce kayıtlı adresleri göster
                if (addresses && addresses.length > 0) {
                    container.innerHTML = `
                        <div class="mb-3">
                            <label class="form-label fw-bold">Kayıtlı Adresler</label>
                            ${addresses.map(addr => `
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
                            `).join('')}
                        </div>
                        <hr>
                    `;
                }

                // Adres arama bölümünü ekle
                container.innerHTML += `
                    <div class="mb-3">
                        <label class="form-label fw-bold">Yeni Adres Ara</label>
                        <div class="input-group mb-2">
                            <input type="text" class="form-control" id="addressSearchInput" 
                                   placeholder="Adres aramak için yazın...">
                            <button class="btn btn-primary" type="button" id="addressSearchBtn">
                                <i class="bi bi-search"></i>
                            </button>
                        </div>
                        <div id="addressSearchResults" class="list-group mt-2" style="display:none"></div>
                    </div>
                `;

                // Adres arama işlevselliğini ekle
                const searchInput = document.getElementById('addressSearchInput');
                const searchBtn = document.getElementById('addressSearchBtn');
                const resultsDiv = document.getElementById('addressSearchResults');

                // Adres arama
                const searchAddress = async (query) => {
                    try {
                        const params = new URLSearchParams({
                            apiKey: CONFIG.HERE_API_KEY,
                            q: `${query}, İstanbul, Turkey`,
                            limit: '5',
                            lang: 'tr'
                        });

                        const response = await fetch(`https://geocode.search.hereapi.com/v1/geocode?${params}`);
                        const data = await response.json();
                        
                        resultsDiv.style.display = 'block';
                        
                        if (!data.items?.length) {
                            resultsDiv.innerHTML = '<div class="list-group-item">Sonuç bulunamadı</div>';
                            return;
                        }

                        resultsDiv.innerHTML = data.items.map(item => `
                            <div class="list-group-item">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>${item.title}</strong><br>
                                        <small class="text-muted">${item.address.street || ''}, ${item.address.district || ''}</small>
                                    </div>
                                    <button class="btn btn-sm btn-primary select-address" 
                                            data-address='${JSON.stringify(item)}'>
                                        Seç
                                    </button>
                                </div>
                            </div>
                        `).join('');

                        // Adres seçme olayını ekle
                        resultsDiv.querySelectorAll('.select-address').forEach(btn => {
                            btn.onclick = (e) => {
                                const item = JSON.parse(e.target.dataset.address);
                                document.querySelector('[name="delivery_address"]').value = JSON.stringify({
                                    label: item.title,
                                    city: 'İstanbul',
                                    district: item.address.district || '',
                                    street: item.address.street || '',
                                    postal_code: item.address.postalCode || '',
                                    position: item.position
                                });
                                resultsDiv.style.display = 'none';
                                searchInput.value = item.title;
                            };
                        });

                    } catch (error) {
                        console.error('Adres arama hatası:', error);
                        resultsDiv.innerHTML = '<div class="list-group-item text-danger">Arama sırasında hata oluştu</div>';
                    }
                };

                // Input olayını ekle
                let timeout;
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(timeout);
                    const query = e.target.value;
                    if (query.length >= 3) {
                        timeout = setTimeout(() => searchAddress(query), 500);
                    }
                });

                // Buton olayını ekle
                searchBtn.addEventListener('click', () => {
                    const query = searchInput.value;
                    if (query.length >= 3) {
                        searchAddress(query);
                    }
                });

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

    async loadProducts() {
        try {
            const response = await fetch(`${API_URL}/products`);
            const products = await response.json();
            
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
                            ${products.map(product => `
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
                return this.customerId || (
                    document.querySelector('[name="customer_name"]')?.value &&
                    document.querySelector('[name="phone"]')?.value
                );

            case 2: // Teslimat bilgileri
                const addressSelect = window.addressSelect;
                if (!addressSelect?.getSelectedAddress()) {
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

// Sayfa yüklendiğinde formu başlat
document.addEventListener('DOMContentLoaded', () => {
    window.newOrderForm = new NewOrderForm();
});
