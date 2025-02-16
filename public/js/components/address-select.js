class AddressSelect {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = options;
        this.init();
    }

    async init() {
        this.renderForm();
        await this.loadSavedAddresses();
        this.setupEventListeners();
    }

    renderForm() {
        this.container.innerHTML = `
            <div class="mb-3">
                <div class="d-flex gap-2 mb-2">
                    <select class="form-select" name="delivery_type">
                        <option value="saved">Kayıtlı Adres</option>
                        <option value="new">Yeni Adres</option>
                    </select>
                    <button type="button" class="btn btn-outline-primary" id="searchAddress">
                        <i class="bi bi-search"></i>
                    </button>
                </div>

                <div id="savedAddressesContainer">
                    <select class="form-select" name="delivery_address_id">
                        <option value="">Adres Seçin</option>
                    </select>
                </div>

                <div id="newAddressContainer" style="display:none">
                    <div class="input-group">
                        <input type="text" class="form-control" placeholder="Adres ara..." id="addressSearchInput">
                        <button class="btn btn-outline-secondary" type="button" id="searchAddressBtn">
                            <i class="bi bi-search"></i>
                        </button>
                    </div>
                    <div id="addressSearchResults" class="list-group mt-2"></div>
                </div>
            </div>
        `;
    }

    async loadSavedAddresses() {
        try {
            const response = await fetch(`${API_URL}/addresses`);
            const addresses = await response.json();
            
            const select = this.container.querySelector('[name="delivery_address_id"]');
            select.innerHTML = `
                <option value="">Adres Seçin</option>
                ${addresses.map(addr => `
                    <option value="${addr.id}">${addr.label}</option>
                `).join('')}
            `;
        } catch (error) {
            console.error('Adresler yüklenemedi:', error);
        }
    }

    setupEventListeners() {
        // Adres tipi değiştiğinde
        this.container.querySelector('[name="delivery_type"]').addEventListener('change', (e) => {
            const isNew = e.target.value === 'new';
            this.container.querySelector('#savedAddressesContainer').style.display = isNew ? 'none' : 'block';
            this.container.querySelector('#newAddressContainer').style.display = isNew ? 'block' : 'none';
        });

        // Adres arama
        let timeout;
        const searchInput = this.container.querySelector('#addressSearchInput');
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => this.searchAddress(searchInput.value), 500);
        });
    }

    async searchAddress(query) {
        if (query.length < 3) return;

        try {
            const response = await fetch(
                `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(query)}&apiKey=${this.options.apiKey}`
            );
            const data = await response.json();
            
            const resultsContainer = this.container.querySelector('#addressSearchResults');
            resultsContainer.innerHTML = data.items.map(item => `
                <button type="button" class="list-group-item list-group-item-action" onclick='${this.saveAddress(item)}'>
                    ${item.address.label}
                    <small class="d-block text-muted">
                        ${item.address.city}, ${item.address.district || ''} ${item.address.postalCode || ''}
                    </small>
                </button>
            `).join('');
        } catch (error) {
            console.error('Adres arama hatası:', error);
        }
    }

    async saveAddress(item) {
        try {
            const addressData = {
                label: item.address.label,
                city: item.address.city,
                district: item.address.district || '',
                postal_code: item.address.postalCode,
                street: item.address.street,
                position: item.position,
                source: 'here_api',
                here_place_id: item.id
            };

            const response = await fetch(`${API_URL}/addresses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addressData)
            });

            const result = await response.json();
            if (result.success) {
                await this.loadSavedAddresses();
                this.container.querySelector('[name="delivery_type"]').value = 'saved';
                this.container.querySelector('[name="delivery_address_id"]').value = result.id;
                
                if (this.options.onSelect) {
                    this.options.onSelect(result.data);
                }
            }
        } catch (error) {
            console.error('Adres kayıt hatası:', error);
        }
    }
}
