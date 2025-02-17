class AddressSelect {
    constructor(container) {
        // Container doğrudan element veya ID olarak alınabilir
        this.container = typeof container === 'string' ? 
            document.getElementById(container) : container;
            
        if (!this.container) {
            console.error('Address container not found:', container);
            return;
        }

        this.selectedAddress = null;
        this.savedAddressesDiv = null;
        this.apiKey = CONFIG.HERE_API_KEY;
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners(); 
    }

    render() {
        this.container.innerHTML = `
            <div class="row">
                <!-- Adres Arama -->
                <div class="col-12">
                    <div class="input-group mb-3">
                        <input type="text" class="form-control" id="addressSearchInput" 
                               placeholder="Adres aramak için yazın...">
                        <button class="btn btn-primary" type="button" id="addressSearchBtn">
                            <i class="bi bi-search"></i>
                        </button>
                    </div>
                </div>

                <!-- Tüm Adresler Listesi -->
                <div class="col-12">
                    <!-- Kayıtlı Adresler -->
                    <div id="savedAddressesContainer" class="mb-3"></div>
                    
                    <!-- HERE API Sonuçları -->
                    <div id="addressSearchResults" class="list-group mb-3"></div>
                    
                    <!-- Seçili Adres -->
                    <div id="selectedAddress" class="alert alert-success" style="display:none"></div>
                </div>
            </div>
        `;

        // Elementleri sakla
        this.searchInput = this.container.querySelector('#addressSearchInput');
        this.searchBtn = this.container.querySelector('#addressSearchBtn');
        this.resultsDiv = this.container.querySelector('#addressSearchResults');
        this.selectedDiv = this.container.querySelector('#selectedAddress');
        this.savedAddressesDiv = this.container.querySelector('#savedAddressesContainer');
    }

    setupEventListeners() {
        // Arama input debounce
        let timeout;
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            const query = e.target.value;
            if (query.length >= 3) {
                timeout = setTimeout(() => this.searchAddress(query), 500);
            } else {
                this.resultsDiv.style.display = 'none';
            }
        });

        // Arama butonu
        this.searchBtn.addEventListener('click', () => {
            const query = this.searchInput.value;
            if (query.length >= 3) {
                this.searchAddress(query);
            }
        });

        // Dışarı tıklandığında sonuçları kapat
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#addressSearchResults') && 
                !e.target.closest('#addressSearchInput')) {
                this.resultsDiv.style.display = 'none';
            }
        });
    }

    async searchAddress(query) {
        try {
            const params = new URLSearchParams({
                apiKey: this.apiKey,
                q: `${query}, İstanbul, Turkey`,
                limit: '5',
                lang: 'tr'
            });

            const response = await fetch(`https://geocode.search.hereapi.com/v1/geocode?${params}`);
            if (!response.ok) throw new Error('API Hatası');
            
            const data = await response.json();
            this.showResults(data.items || []);
        } catch (error) {
            console.error('Adres arama hatası:', error);
            showError('Adres araması başarısız');
            this.showResults([]);
        }
    }

    showResults(items) {
        const resultsDiv = document.getElementById('addressSearchResults');
        
        if (!items.length) {
            resultsDiv.innerHTML = '<div class="list-group-item">Sonuç bulunamadı</div>';
            return;
        }

        resultsDiv.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h6 class="card-title mb-0">Bulunan Adresler</h6>
                </div>
                <div class="list-group list-group-flush">
                    ${items.map(item => `
                        <div class="list-group-item">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>${item.title}</strong><br>
                                    <small class="text-muted">${item.address.street || ''}, ${item.address.district || ''}</small>
                                </div>
                                <button class="btn btn-sm btn-primary" 
                                        onclick="this.closest('#addressSelectContainer').addressSelect.selectAddress(${JSON.stringify(item).replace(/'/g, "\\'")}))">
                                    Seç
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    selectAddress(item) {
        const address = {
            label: item.title,
            city: 'İstanbul',
            district: item.address.district || '',
            street: item.address.street || '',
            postal_code: item.address.postalCode || '',
            position: {
                lat: item.position.lat,
                lng: item.position.lng
            },
            here_place_id: item.id,
            id: `new_${Date.now()}` // Geçici unique ID
        };

        this.selectedAddress = address;
        
        // UI Güncelle
        this.selectedDiv.style.display = 'block';
        this.selectedDiv.innerHTML = this.renderSelectedAddress(address);
        
        // Temizlik
        this.searchInput.value = '';
        this.resultsDiv.style.display = 'none';

        // Event tetikle
        document.dispatchEvent(new CustomEvent('addressSelected', {
            detail: address
        }));
    }

    renderSelectedAddress(address) {
        return `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${address.label}</strong><br>
                    <small>${[address.street, address.district, 'İstanbul']
                        .filter(Boolean).join(', ')}</small>
                </div>
                <div>
                    <button type="button" class="btn btn-sm btn-outline-danger" 
                            onclick="document.querySelector('#deliveryFormContainer').deliveryForm.handleAddressAction('clearAddress')">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            </div>
        `;
    }

    clearAddress() {
        this.selectedAddress = null;
        this.selectedDiv.style.display = 'none';
        
        // Event tetikle
        document.dispatchEvent(new CustomEvent('addressSelected', {
            detail: null
        }));
    }

    getSelectedAddress() {
        return this.selectedAddress;
    }

    async loadSavedAddresses(customerId) {
        if (!customerId) return;

        try {
            const response = await fetch(`${API_URL}/customers/${customerId}/addresses`);
            if (!response.ok) throw new Error('API Hatası');
            
            const addresses = await response.json();
            
            this.savedAddressesDiv.innerHTML = addresses.length > 0 
                ? this.renderSavedAddresses(addresses)
                : '';

        } catch (error) {
            console.error('Kayıtlı adresler yüklenemedi:', error);
            showError('Kayıtlı adresler yüklenemedi');
        }
    }

    renderSavedAddresses(addresses) {
        return `
            <div class="card">
                <div class="card-body">
                    <h6 class="card-title">Kayıtlı Adresler</h6>
                    ${addresses.map(addr => `
                        <div class="form-check mb-2">
                            <input type="radio" class="form-check-input" 
                                   name="saved_address" value="${addr.id}"
                                   id="addr_${addr.id}"
                                   onchange="addressSelect.selectSavedAddress(${JSON.stringify(addr)})">
                            <label class="form-check-label" for="addr_${addr.id}">
                                <strong>${addr.label || 'Adres'}</strong><br>
                                <small class="text-muted">
                                    ${[addr.street, addr.district, addr.city]
                                        .filter(Boolean).join(', ')}
                                </small>
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    selectSavedAddress(address) {
        this.selectedAddress = address;
        this.selectedDiv.style.display = 'block';
        this.selectedDiv.innerHTML = this.renderSelectedAddress(address);
        
        document.dispatchEvent(new CustomEvent('addressSelected', {
            detail: address
        }));
    }
}
