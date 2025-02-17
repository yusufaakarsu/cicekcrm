class AddressManager {
    constructor() {
        this.selectedAddress = null;
        this.customerId = null;
        this.step = document.getElementById('step2Status');
        this.container = document.createElement('div');
        this.container.className = 'mb-4';
        document.getElementById('orderForm').appendChild(this.container);
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0">2. Teslimat Bilgileri</h6>
                </div>
                <div class="card-body">
                    ${this.customerId ? this.renderDeliveryForm() : `
                        <div class="alert alert-info mb-0">
                            <i class="bi bi-info-circle"></i> Önce müşteri seçin
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    renderDeliveryForm() {
        return `
            <div class="row g-3">
                <!-- Adres Seçimi -->
                <div class="col-12">
                    <label class="form-label small">Teslimat Adresi *</label>
                    <div id="savedAddresses" class="mb-3">
                        <!-- Kayıtlı adresler buraya gelecek -->
                        <div class="text-center p-3">
                            <div class="spinner-border spinner-border-sm"></div>
                        </div>
                    </div>
                    
                    <!-- Tek bir "Yeni Adres Ekle" butonu -->
                    <button type="button" class="btn btn-outline-primary btn-sm" onclick="addressManager.showAddressForm()">
                        <i class="bi bi-plus-lg"></i> Yeni Adres Ekle
                    </button>
                </div>

                <!-- Adres form container -->
                <div id="newAddressFormContainer" class="col-12" style="display:none">
                    <!-- Form buraya eklenecek -->
                </div>

                <!-- Alıcı Bilgileri -->
                <div class="col-md-6">
                    <label class="form-label small">Alıcı Adı *</label>
                    <input type="text" class="form-control form-control-sm" name="recipient_name" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label small">Alıcı Telefon *</label>
                    <input type="tel" class="form-control form-control-sm" name="recipient_phone" required>
                </div>

                <!-- Teslimat Zamanı -->
                <div class="col-md-6">
                    <label class="form-label small">Teslimat Tarihi *</label>
                    <input type="date" class="form-control form-control-sm" name="delivery_date" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label small">Saat Dilimi *</label>
                    <select class="form-select form-select-sm" name="delivery_time_slot" required>
                        <option value="">Seçiniz</option>
                        <option value="morning">09:00-12:00</option>
                        <option value="afternoon">12:00-17:00</option>
                        <option value="evening">17:00-21:00</option>
                    </select>
                </div>
            </div>
        `;
    }

    enable(customerId) {
        this.customerId = customerId;
        this.render();
        this.setupAddressSearch();
        this.loadCustomerAddresses(customerId);
    }

    disable() {
        this.customerId = null;
        this.address = null;
        this.render();
    }

    setupAddressSearch() {
        const input = document.getElementById('addressSearch');
        const btn = document.getElementById('searchAddressBtn');
        if (!input || !btn) return;

        let timeout;
        input.addEventListener('input', e => {
            clearTimeout(timeout);
            const query = e.target.value;
            if (query.length >= 3) {
                timeout = setTimeout(() => this.searchAddress(query), 500);
            }
        });

        btn.addEventListener('click', () => {
            const query = input.value;
            if (query.length >= 3) {
                this.searchAddress(query);
            }
        });
    }

    async searchAddress(query) {
        if (!window.customerManager.customerId) {
            showError('Önce müşteri seçin');
            return;
        }

        try {
            const params = new URLSearchParams({
                apiKey: CONFIG.HERE_API_KEY,
                q: `${query}, İstanbul, Turkey`,
                limit: 5
            });

            const response = await fetch(`https://geocode.search.hereapi.com/v1/geocode?${params}`);
            const data = await response.json();
            
            this.showResults(data.items || []);
        } catch (error) {
            showError('Adres araması başarısız');
        }
    }

    async loadCustomerAddresses(customerId) {
        try {
            const response = await fetch(`${API_URL}/customers/${customerId}/addresses`);
            const addresses = await response.json();
            
            const container = document.getElementById('savedAddresses');
            if (!container) return;

            if (addresses && addresses.length > 0) {
                container.innerHTML = addresses.map(addr => `
                    <div class="form-check mb-2">
                        <input type="radio" class="form-check-input" name="delivery_address_id" 
                               value="${addr.id}" id="addr_${addr.id}" required>
                        <label class="form-check-label" for="addr_${addr.id}">
                            <strong>${addr.label || 'Adres'}</strong>
                            <small class="text-muted d-block">
                                ${[addr.street, addr.district, addr.city].filter(Boolean).join(', ')}
                            </small>
                        </label>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle"></i> Kayıtlı adres bulunamadı
                    </div>
                `;
            }

        } catch (error) {
            console.error('Adres yükleme hatası:', error);
            document.getElementById('savedAddresses').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-circle"></i> Adresler yüklenemedi
                </div>
            `;
        }
    }

    showAddressForm() {
        const container = document.getElementById('newAddressFormContainer');
        if (!container) return;

        // Form zaten açıksa gizle
        if (container.style.display !== 'none') {
            container.style.display = 'none';
            return;
        }

        // Yeni form göster
        container.style.display = 'block';
        container.innerHTML = `
            <div class="card mt-3">
                <div class="card-body">
                    <form id="newAddressForm" class="row g-2">
                        <div class="col-12">
                            <label class="form-label small">Adres Başlığı *</label>
                            <input type="text" class="form-control form-control-sm" name="label" required>
                        </div>
                        <div class="col-12">
                            <label class="form-label small">Adres *</label>
                            <textarea class="form-control form-control-sm" name="street" rows="2" required></textarea>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small">İlçe *</label>
                            <input type="text" class="form-control form-control-sm" name="district" required>
                        </div>
                        <div class="col-12 mt-3">
                            <button type="submit" class="btn btn-primary btn-sm">
                                <i class="bi bi-check-lg"></i> Kaydet
                            </button>
                            <button type="button" class="btn btn-outline-secondary btn-sm" 
                                    onclick="addressManager.hideAddressForm()">
                                İptal
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Form submit listener ekle
        document.getElementById('newAddressForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveAddress(e.target);
        });
    }

    hideAddressForm() {
        const container = document.getElementById('newAddressFormContainer');
        if (container) {
            container.style.display = 'none';
        }
    }

    async saveAddress(form) {
        try {
            const formData = new FormData(form);
            const addressData = {
                ...Object.fromEntries(formData),
                customer_id: this.customerId,
                city: 'İstanbul',
                country_code: 'TUR',
                country_name: 'Türkiye'
            };

            const response = await fetch(`${API_URL}/customers/${this.customerId}/addresses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addressData)
            });

            if (!response.ok) throw new Error('Adres kaydedilemedi');

            showSuccess('Adres kaydedildi');
            
            // Form container'ı kaldır
            document.getElementById('newAddressCard')?.remove();
            
            // Adresleri yeniden yükle
            await this.loadCustomerAddresses(this.customerId);

        } catch (error) {
            console.error('Adres kayıt hatası:', error);
            showError('Adres kaydedilemedi');
        }
    }

    // Diğer metodlar...
}

window.addressManager = new AddressManager();
