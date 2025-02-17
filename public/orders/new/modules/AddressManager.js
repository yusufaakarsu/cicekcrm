class AddressManager {
    constructor() {
        this.address = null;
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
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">2. Teslimat Bilgileri</h6>
                    ${this.address ? `
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="addressManager.clear()">
                            <i class="bi bi-arrow-left"></i> Değiştir
                        </button>
                    ` : ''}
                </div>
                <div class="card-body">
                    ${this.customerId ? this.renderAddressForm() : `
                        <div class="alert alert-info mb-0">
                            Önce müşteri seçin
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    renderAddressForm() {
        return `
            <div class="mb-3">
                <label class="form-label">Teslimat Adresi</label>
                <div class="input-group mb-2">
                    <input type="text" class="form-control" id="addressSearch" 
                           placeholder="Adres aramak için yazın...">
                    <button class="btn btn-outline-primary" type="button" id="searchAddressBtn">
                        <i class="bi bi-search"></i>
                    </button>
                </div>
                <div id="addressResults" class="list-group mt-2" style="display:none"></div>
                <div id="selectedAddress"></div>
            </div>

            <!-- Alıcı Bilgileri -->
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label">Alıcı Adı *</label>
                    <input type="text" class="form-control form-control-sm" id="recipientName" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Alıcı Telefon *</label>
                    <input type="tel" class="form-control form-control-sm" id="recipientPhone" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Teslimat Tarihi *</label>
                    <input type="date" class="form-control form-control-sm" id="deliveryDate" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Saat Dilimi *</label>
                    <select class="form-select form-select-sm" id="timeSlot" required>
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
