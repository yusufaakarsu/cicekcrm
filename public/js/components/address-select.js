class AddressSelect {
    constructor(containerId) {
        this.searchInput = document.getElementById('addressSearchInput');
        this.searchBtn = document.getElementById('addressSearchBtn');
        this.resultsDiv = document.getElementById('addressSearchResults');
        this.selectedDiv = document.getElementById('selectedAddress');
        this.selectedAddress = null;
        
        // Kayıtlı adresler için container ekle
        this.savedAddressesDiv = document.createElement('div');
        this.savedAddressesDiv.id = 'savedAddressesContainer';
        this.savedAddressesDiv.className = 'mb-3';
        
        // Search input'tan önce ekle
        this.searchInput.parentNode.parentNode.insertBefore(
            this.savedAddressesDiv, 
            this.searchInput.parentNode
        );

        this.setupEventListeners();
    }

    setupEventListeners() {
        let timeout;
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            const query = e.target.value;
            if (query.length >= 3) {
                timeout = setTimeout(() => this.searchAddress(query), 500);
            }
        });

        this.searchBtn.addEventListener('click', () => {
            const query = this.searchInput.value;
            if (query.length >= 3) {
                this.searchAddress(query);
            }
        });
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
            const data = await response.json();
            this.showResults(data.items || []);
        } catch (error) {
            console.error('Adres arama hatası:', error);
            this.showResults([]);
        }
    }

    showResults(items) {
        this.resultsDiv.style.display = 'block';

        if (!items.length) {
            this.resultsDiv.innerHTML = '<div class="list-group-item">Sonuç bulunamadı</div>';
            return;
        }

        this.resultsDiv.innerHTML = items.map(item => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${item.title}</strong><br>
                        <small class="text-muted">${item.address.street || ''}, ${item.address.district || ''}</small>
                    </div>
                    <button class="btn btn-sm btn-primary" onclick='addressSelect.selectAddress(${JSON.stringify(item)})'>
                        Seç
                    </button>
                </div>
            </div>
        `).join('');
    }

    selectAddress(item) {
        this.selectedAddress = {
            label: item.title,
            city: 'İstanbul',
            district: item.address.district || '',
            street: item.address.street || '',
            postal_code: item.address.postalCode || '',
            position: {
                lat: item.position.lat,
                lng: item.position.lng
            }
        };

        this.selectedDiv.style.display = 'block';
        this.selectedDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${this.selectedAddress.label}</strong><br>
                    <small>${[this.selectedAddress.street, this.selectedAddress.district, 'İstanbul'].filter(Boolean).join(', ')}</small>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="addressSelect.clearAddress()">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;

        this.searchInput.value = '';
        this.resultsDiv.style.display = 'none';
    }

    clearAddress() {
        this.selectedAddress = null;
        this.selectedDiv.style.display = 'none';
    }

    getSelectedAddress() {
        return this.selectedAddress;
    }

    // Kayıtlı adresleri yükle ve göster
    async loadSavedAddresses(customerId) {
        try {
            const response = await fetch(`${API_URL}/customers/${customerId}/addresses`);
            const addresses = await response.json();
            
            if (addresses && addresses.length > 0) {
                this.savedAddressesDiv.innerHTML = `
                    <div class="mb-2"><strong>Kayıtlı Adresler</strong></div>
                    ${addresses.map(addr => `
                        <div class="form-check mb-2">
                            <input type="radio" class="form-check-input" 
                                   name="saved_address_id" value="${addr.id}"
                                   id="addr_${addr.id}">
                            <label class="form-check-label" for="addr_${addr.id}">
                                <strong>${addr.label || 'Adres'}</strong><br>
                                <small class="text-muted">
                                    ${[addr.street, addr.district, addr.city].filter(Boolean).join(', ')}
                                </small>
                            </label>
                        </div>
                    `).join('')}
                    <hr class="my-3">
                `;
            } else {
                this.savedAddressesDiv.innerHTML = '';
            }
        } catch (error) {
            console.error('Kayıtlı adresler yüklenemedi:', error);
        }
    }
}

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    window.addressSelect = new AddressSelect();
});

// NewOrderForm class'ında müşteri seçildiğinde adresleri yükle
async searchCustomer() {
    // ...existing code...
    if (data && data.customer) {
        this.customerId = data.customer.id;
        this.showCustomerDetails(data.customer);
        // Adresleri yükle
        window.addressSelect.loadSavedAddresses(data.customer.id);
    }
    // ...existing code...
}
