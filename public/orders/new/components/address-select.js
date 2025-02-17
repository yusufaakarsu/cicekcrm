class AddressSelect {
    constructor(container) {
        this.container = typeof container === 'string' ? 
            document.getElementById(container) : container;
            
        if (!this.container) {
            console.error('Address container not found:', container);
            return;
        }

        this.selectedAddress = null;
        this.init();
    }

    render() {
        this.container.innerHTML = `
            <div class="address-select">
                <!-- Adres Arama -->
                <div class="input-group mb-3">
                    <input type="text" class="form-control" id="addressSearchInput" 
                           placeholder="Adres aramak için yazın...">
                    <button class="btn btn-outline-primary" type="button" id="addressSearchBtn">
                        <i class="bi bi-search"></i>
                    </button>
                </div>

                <!-- Adresler (Kayıtlı + Arama Sonuçları) -->
                <div class="address-results">
                    <div id="addressList" class="list-group mb-3"></div>
                    <div id="selectedAddress" class="alert alert-success" style="display:none"></div>
                </div>
            </div>
        `;

        // Elementlere kolay erişim için referansları sakla
        this.searchInput = this.container.querySelector('#addressSearchInput');
        this.searchBtn = this.container.querySelector('#addressSearchBtn');
        this.addressList = this.container.querySelector('#addressList');
        this.selectedAddressDiv = this.container.querySelector('#selectedAddress');
    }

    async searchAddress(query) {
        try {
            const params = new URLSearchParams({
                apiKey: CONFIG.HERE_API_KEY,
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
        if (!items.length) {
            this.addressList.innerHTML = '<div class="list-group-item">Sonuç bulunamadı</div>';
            return;
        }

        const combinedAddresses = [...(this.savedAddresses || []), ...items.map(item => ({
            id: `here_${item.id}`,
            label: item.title,
            address: {
                street: item.address.street,
                district: item.address.district,
                city: 'İstanbul'
            },
            position: item.position,
            type: 'here'
        }))];

        this.addressList.innerHTML = combinedAddresses.map(addr => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${addr.label}</strong><br>
                        <small class="text-muted">
                            ${[addr.address.street, addr.address.district, addr.address.city]
                                .filter(Boolean).join(', ')}
                        </small>
                    </div>
                    <button class="btn btn-sm btn-primary select-address" 
                            data-address='${JSON.stringify(addr)}'>
                        Seç
                    </button>
                </div>
            </div>
        `).join('');

        // Event listener'ları ekle
        this.addressList.querySelectorAll('.select-address').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const address = JSON.parse(e.target.dataset.address);
                this.selectAddress(address);
            });
        });

        this.addressList.style.display = 'block';
    }

    selectAddress(address) {
        this.selectedAddress = address;
        
        // UI Güncelle
        this.selectedAddressDiv.style.display = 'block';
        this.selectedAddressDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${address.label}</strong><br>
                    <small>${[address.address.street, address.address.district, address.address.city]
                        .filter(Boolean).join(', ')}</small>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger clear-address">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;

        // Clear button event listener
        this.selectedAddressDiv.querySelector('.clear-address')
            .addEventListener('click', () => this.clearAddress());

        // Temizlik
        this.searchInput.value = '';
        this.addressList.style.display = 'none';

        // Event tetikle
        document.dispatchEvent(new CustomEvent('addressSelected', {
            detail: address
        }));
    }

    clearAddress() {
        this.selectedAddress = null;
        this.selectedAddressDiv.style.display = 'none';
        document.dispatchEvent(new CustomEvent('addressSelected', { detail: null }));
    }

    async loadSavedAddresses(customerId) {
        if (!customerId) {
            this.savedAddresses = [];
            return;
        }

        try {
            const response = await fetch(`${API_URL}/customers/${customerId}/addresses`);
            if (!response.ok) throw new Error('API Hatası');
            
            this.savedAddresses = await response.json();
            
            // Kayıtlı adresleri göster
            if (this.savedAddresses.length > 0) {
                this.showResults(this.savedAddresses);
            }
        } catch (error) {
            console.error('Kayıtlı adresler yüklenemedi:', error);
            this.savedAddresses = [];
        }
    }

    // ... diğer metodlar aynı kalacak ...
}
