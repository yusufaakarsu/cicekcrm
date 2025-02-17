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
                    
                    <!-- Yeni Adres Ekleme -->
                    <div class="mb-3">
                        <button type="button" class="btn btn-outline-primary btn-sm" id="addAddressBtn">
                            <i class="bi bi-plus-lg"></i> Yeni Adres Ekle
                        </button>
                    </div>

                    <div id="newAddressForm" class="card d-none">
                        <div class="card-body">
                            <div class="row g-2">
                                <div class="col-12">
                                    <label class="form-label small">Adres Başlığı *</label>
                                    <input type="text" class="form-control form-control-sm" id="addressLabel" required>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small">Adres *</label>
                                    <textarea class="form-control form-control-sm" id="addressText" rows="2" required></textarea>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small">İlçe *</label>
                                    <input type="text" class="form-control form-control-sm" id="addressDistrict" required>
                                </div>
                                <div class="col-12">
                                    <button type="button" class="btn btn-primary btn-sm" onclick="addressManager.saveNewAddress()">
                                        Adresi Kaydet
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm" onclick="addressManager.cancelNewAddress()">
                                        İptal
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
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

    // Diğer metodlar...
}

window.addressManager = new AddressManager();
