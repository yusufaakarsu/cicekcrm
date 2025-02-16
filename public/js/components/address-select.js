class AddressSelect {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = options;
        this.apiKey = options.apiKey;
        this.init();
    }

    async init() {
        this.render();
        this.setupEventListeners();
        await this.loadSavedAddresses();
    }

    render() {
        this.container.innerHTML = `
            <div class="mb-3">
                <div class="input-group mb-3">
                    <input type="text" 
                           class="form-control" 
                           placeholder="Adres aramak için yazın..." 
                           id="address-search-input">
                    <button class="btn btn-outline-secondary" 
                            type="button"
                            id="address-search-button">
                        <i class="bi bi-search"></i> Ara
                    </button>
                </div>
                
                <!-- Arama Sonuçları -->
                <div id="address-search-results" 
                     class="list-group shadow-sm" 
                     style="display:none">
                </div>

                <!-- Seçilen Adres -->
                <div id="selected-address" 
                     class="alert alert-info mt-2" 
                     style="display:none">
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const deliveryType = this.container.querySelector('[name="delivery_type"]');
        const searchInput = this.container.querySelector('#address-search-input');
        const searchButton = this.container.querySelector('#address-search-button');
        const savedAddressesContainer = this.container.querySelector('#saved-addresses-container');
        const newAddressContainer = this.container.querySelector('#new-address-container');

        // Adres tipi değişince
        deliveryType.addEventListener('change', (e) => {
            const isNew = e.target.value === 'new';
            savedAddressesContainer.style.display = isNew ? 'none' : 'block';
            newAddressContainer.style.display = isNew ? 'block' : 'none';
        });

        // Arama input için debounce
        let timeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            const query = e.target.value;
            
            if (query.length >= 3) {
                timeout = setTimeout(() => this.searchAddress(query), 500);
            }
        });

        // Arama butonu
        searchButton.addEventListener('click', () => {
            const query = searchInput.value;
            if (query.length >= 3) {
                this.searchAddress(query);
            }
        });
    }

    async loadSavedAddresses() {
        try {
            const response = await fetch(`${API_URL}/addresses`);
            const addresses = await response.json();
            
            const select = this.container.querySelector('[name="saved_address_id"]');
            select.innerHTML = addresses.map(addr => `
                <option value="${addr.id}">
                    ${addr.label} (${addr.district})
                </option>
            `).join('');

        } catch (error) {
            console.error('Kayıtlı adresler yüklenemedi:', error);
        }
    }

    async searchAddress(query) {
        if (query.length < 3) return;
        
        try {
            // API KEY'i düzelt ve parametre formatını güncelle
            const params = new URLSearchParams({
                apiKey: '8ga3iUSKvwTytKYkk8PbpnnH5iCFlNDsvFoSyCghhjI',
                q: query + ', İstanbul, Turkey',  // Şehir bilgisini query'e ekle
                limit: '5',
                lang: 'tr'
            });

            // Debug için
            console.log('Search query:', query);
            console.log('API URL:', `https://geocode.search.hereapi.com/v1/geocode?${params}`);

            const response = await fetch(`https://geocode.search.hereapi.com/v1/geocode?${params}`);
            
            if (!response.ok) {
                const error = await response.text();
                console.error('HERE API error:', error);
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('HERE API response:', data); // Debug için

            // Sonuçları göster
            this.showResults(data.items || []);

        } catch (error) {
            console.error('Adres arama hatası:', error);
            // Kullanıcıya hata mesajı göster
            this.showResults([]);
        }
    }

    showResults(items) {
        const resultsContainer = this.container.querySelector('#address-search-results');
        resultsContainer.style.display = 'block';

        if (items.length === 0) {
            resultsContainer.innerHTML = '<div class="list-group-item">Sonuç bulunamadı</div>';
            return;
        }

        resultsContainer.innerHTML = items.map(item => {
            // Adres bilgilerini daha detaylı göster
            const address = item.address;
            const addressLine = [
                address.street,
                address.houseNumber,
                address.district,
                'İstanbul'
            ].filter(Boolean).join(', ');

            return `
                <div class="list-group-item">
                    <strong>${item.title}</strong>
                    <br>
                    <small class="text-muted">${addressLine}</small>
                    <button class="btn btn-sm btn-primary mt-2 w-100" 
                            onclick='addressSelect.selectAddress(${JSON.stringify(item)})'>
                        Seç
                    </button>
                </div>
            `;
        }).join('');
    }

    selectAddress(item) { // item parametresi düzeltildi
        try {
            // HERE API'den gelen veriyi düzgün şekilde kullan
            const addressData = {
                label: item.title, // title kullan
                city: 'İstanbul',
                district: item.address.district || '',
                street: item.address.street || '',
                postal_code: item.address.postalCode || '',
                position: {
                    lat: item.position.lat,
                    lng: item.position.lng
                },
                source: 'here_api',
                here_place_id: item.id
            };

            console.log('Seçilen adres:', addressData); // Debug için

            // Seçilen adresi göster
            const selectedAddressDiv = this.container.querySelector('#selected-address');
            selectedAddressDiv.style.display = 'block';
            selectedAddressDiv.innerHTML = `
                <strong>${addressData.label}</strong><br>
                <small>${[addressData.street, addressData.district, 'İstanbul'].filter(Boolean).join(', ')}</small>
                <input type="hidden" name="delivery_address" value='${JSON.stringify(addressData)}'>
            `;

            // Arama sonuçlarını gizle
            this.container.querySelector('#address-search-results').style.display = 'none';
            
            // Input'u temizle
            this.container.querySelector('#address-search-input').value = '';

            return addressData;
        } catch (error) {
            console.error('Adres seçim hatası:', error);
            showError('Adres seçilemedi, lütfen tekrar deneyin');
        }
    }

    async saveAddress(addressData) {
        try {
            const response = await fetch(`${API_URL}/addresses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addressData)
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Adres kaydedilemedi');
            }

            // Kayıtlı adresleri yeniden yükle
            await this.loadSavedAddresses();
            
            return result;
        } catch (error) {
            console.error('Adres kayıt hatası:', error);
            throw error;
        }
    }
}

// Global instance - API KEY'i common.js'den al
window.addressSelect = new AddressSelect('addressSelect', {
    apiKey: CONFIG.HERE_API_KEY
});
