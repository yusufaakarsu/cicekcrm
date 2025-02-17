class AddressSelect extends BaseComponent {
    constructor(container, manager) {
        super(container, manager);
        this.savedAddresses = [];
        this.selectedAddress = null;
        this.state = {
            searchResults: [],
            savedAddresses: [],
            selectedAddress: null
        };
        this.init();
    }

    render() {
        this.container.innerHTML = `
            <div class="address-search mb-3">
                <div class="input-group">
                    <input type="text" class="form-control" id="addressSearchInput" 
                           placeholder="Adres aramak için yazın...">
                    <button class="btn btn-primary" type="button" id="searchAddressBtn">
                        <i class="bi bi-search"></i>
                    </button>
                </div>
            </div>

            <div id="allAddresses">
                <!-- Kayıtlı ve Aranan Adresler Buraya Gelecek -->
            </div>

            <div id="selectedAddressDisplay" class="alert alert-success mt-3" style="display:none">
            </div>
        `;

        this.searchInput = this.container.querySelector('#addressSearchInput');
        this.searchBtn = this.container.querySelector('#searchAddressBtn');
        this.addressesContainer = this.container.querySelector('#allAddresses');
        this.selectedDisplay = this.container.querySelector('#selectedAddressDisplay');

        this.updateAddressList();
    }

    setupEventListeners() {
        // Arama input debounce
        let timeout;
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            const query = e.target.value.trim();
            if (query.length >= 3) {
                timeout = setTimeout(() => this.searchAddress(query), 500);
            }
        });

        // Arama butonu
        this.searchBtn.addEventListener('click', () => {
            const query = this.searchInput.value.trim();
            if (query.length >= 3) {
                this.searchAddress(query);
            }
        });

        // Adres seçimleri için event delegation
        this.addressesContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('select-address')) {
                const addressData = JSON.parse(e.target.dataset.address);
                this.selectAddress(addressData);
            }
        });
    }

    async searchAddress(query) {
        try {
            const results = await HereService.searchAddress(query);
            this.setState({
                ...this.state,
                searchResults: results
            });
        } catch (error) {
            this.showError('Adres araması başarısız');
        }
    }

    async loadSavedAddresses(customerId) {
        if (!customerId) return;

        try {
            const addresses = await ApiService.getCustomerAddresses(customerId);
            this.setState({
                ...this.state,
                savedAddresses: addresses
            });
        } catch (error) {
            this.showError('Kayıtlı adresler yüklenemedi');
        }
    }

    updateAddressList() {
        const allAddresses = [...this.state.savedAddresses, ...this.state.searchResults];
        
        this.addressesContainer.innerHTML = allAddresses.length ? `
            <div class="list-group">
                ${allAddresses.map(addr => `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${addr.label || addr.title}</strong><br>
                                <small class="text-muted">
                                    ${[addr.street, addr.district, 'İstanbul'].filter(Boolean).join(', ')}
                                </small>
                            </div>
                            <button class="btn btn-sm btn-primary select-address"
                                    data-address='${JSON.stringify(addr)}'>
                                Seç
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '';
    }

    selectAddress(address) {
        this.selectedAddress = address;
        this.selectedDisplay.style.display = 'block';
        this.selectedDisplay.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${address.label || address.title}</strong><br>
                    <small>${[address.street, address.district, 'İstanbul'].filter(Boolean).join(', ')}</small>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.clearAddress()">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;

        this.searchInput.value = '';
        this.setState({
            ...this.state,
            selectedAddress: address,
            searchResults: []
        });

        this.emit('addressSelected', address);
    }

    clearAddress() {
        this.selectedAddress = null;
        this.selectedDisplay.style.display = 'none';
        this.setState({
            ...this.state,
            selectedAddress: null
        });
        this.emit('addressSelected', null);
    }

    getSelectedAddress() {
        return this.selectedAddress;
    }
}
