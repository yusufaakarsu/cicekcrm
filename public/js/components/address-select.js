class AddressSelect {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.selectedAddress = null;
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="mb-3">
                <div class="input-group">
                    <input type="text" 
                           class="form-control form-control-lg" 
                           placeholder="Adres aramak için yazın..." 
                           id="addressSearchInput">
                    <button class="btn btn-primary" type="button" id="addressSearchBtn">
                        <i class="bi bi-search"></i> Ara
                    </button>
                </div>

                <div id="addressSearchResults" class="list-group shadow-sm mt-2" style="display:none"></div>
                <div id="selectedAddress" class="alert alert-success mt-3" style="display:none"></div>
            </div>
        `;
    }

    setupEventListeners() {
        const searchInput = this.container.querySelector('#addressSearchInput');
        const searchBtn = this.container.querySelector('#addressSearchBtn');

        let timeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            const query = e.target.value;
            if (query.length >= 3) {
                timeout = setTimeout(() => this.searchAddress(query), 500);
            }
        });

        searchBtn.addEventListener('click', () => {
            const query = searchInput.value;
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
        const resultsDiv = this.container.querySelector('#addressSearchResults');
        resultsDiv.style.display = 'block';

        if (items.length === 0) {
            resultsDiv.innerHTML = '<div class="list-group-item">Sonuç bulunamadı</div>';
            return;
        }

        resultsDiv.innerHTML = items.map(item => `
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
        const selectedDiv = this.container.querySelector('#selectedAddress');
        const resultsDiv = this.container.querySelector('#addressSearchResults');
        const searchInput = this.container.querySelector('#addressSearchInput');

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

        selectedDiv.style.display = 'block';
        selectedDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${this.selectedAddress.label}</strong><br>
                    <small>${[this.selectedAddress.street, this.selectedAddress.district, 'İstanbul'].filter(Boolean).join(', ')}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="addressSelect.clearAddress()">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;

        searchInput.value = '';
        resultsDiv.style.display = 'none';
    }

    clearAddress() {
        this.selectedAddress = null;
        this.container.querySelector('#selectedAddress').style.display = 'none';
    }

    getSelectedAddress() {
        return this.selectedAddress;
    }
}

window.addressSelect = new AddressSelect('addressesContainer');
