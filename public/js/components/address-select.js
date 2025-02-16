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
        // Temiz ve basit bir arayüz
        this.container.innerHTML = `
            <div class="mb-4">
                <!-- Kayıtlı Adresler -->
                <div id="savedAddresses" class="mb-3"></div>

                <!-- Yeni Adres Arama -->
                <div class="mb-3">
                    <div class="input-group">
                        <input type="text" 
                               class="form-control form-control-lg" 
                               placeholder="Yeni adres aramak için yazın..." 
                               id="addressSearchInput">
                        <button class="btn btn-primary" type="button" id="addressSearchBtn">
                            <i class="bi bi-search"></i> Ara
                        </button>
                    </div>
                </div>

                <!-- Arama Sonuçları -->
                <div id="addressSearchResults" 
                     class="list-group shadow-sm rounded-3" 
                     style="display:none; max-height: 300px; overflow-y: auto;">
                </div>

                <!-- Seçili Adres -->
                <div id="selectedAddress" 
                     class="alert alert-success mt-3" 
                     style="display:none">
                </div>
            </div>
        `;

        // Here API scripti
        if (!window.H) {
            const script = document.createElement('script');
            script.src = `https://js.api.here.com/v3/3.1/mapsjs-core.js`;
            document.head.appendChild(script);
        }
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
            if (!response.ok) throw new Error('API Hatası');
            
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
            resultsDiv.innerHTML = `
                <div class="list-group-item text-center text-muted py-3">
                    <i class="bi bi-geo-alt"></i> Sonuç bulunamadı
                </div>`;
            return;
        }

        resultsDiv.innerHTML = items.map(item => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center p-2">
                    <div>
                        <h6 class="mb-1">${item.title}</h6>
                        <p class="mb-0 text-muted small">
                            ${item.address.street || ''}, ${item.address.district || ''}
                        </p>
                    </div>
                    <button class="btn btn-sm btn-primary ms-3" 
                            onclick='addressSelect.selectAddress(${JSON.stringify(item)})'>
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
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="mb-1">${this.selectedAddress.label}</h6>
                    <p class="mb-0 text-muted">
                        ${[this.selectedAddress.street, this.selectedAddress.district, 'İstanbul']
                            .filter(Boolean).join(', ')}
                    </p>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger ms-3" 
                        onclick="addressSelect.clearAddress()">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;

        searchInput.value = '';
        resultsDiv.style.display = 'none';

        // Koordinatları forma ekle
        const latInput = document.createElement('input');
        latInput.type = 'hidden';
        latInput.name = 'delivery_lat';
        latInput.value = this.selectedAddress.position.lat;
        
        const lngInput = document.createElement('input');
        lngInput.type = 'hidden';
        lngInput.name = 'delivery_lng';
        lngInput.value = this.selectedAddress.position.lng;

        selectedDiv.appendChild(latInput);
        selectedDiv.appendChild(lngInput);
    }

    clearAddress() {
        this.selectedAddress = null;
        this.container.querySelector('#selectedAddress').style.display = 'none';
    }

    getSelectedAddress() {
        return this.selectedAddress;
    }
}

// Global instance oluştur
window.addressSelect = new AddressSelect('addressesContainer');
