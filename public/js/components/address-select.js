class AddressSelect {
    // Basit implementasyon
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <select class="form-select mb-2" name="delivery_type">
                <option value="customer">Müşteri Adresi</option>
                <option value="new">Yeni Adres</option>
            </select>
            <div id="newAddressInput" style="display:none">
                <input type="text" class="form-control" placeholder="Adres ara...">
            </div>
        `;
    }

    async searchAddress(query) {
        if (query.length < 3) return;

        try {
            // İstanbul'a özel sorgu parametreleri
            const params = new URLSearchParams({
                q: query,
                apiKey: this.options.apiKey,
                in: 'city:istanbul,countryCode:TUR', // İstanbul ve Türkiye filtresi
                lang: 'tr', // Türkçe sonuçlar
                limit: 10 // Maksimum 10 sonuç
            });

            const response = await fetch(
                `https://geocode.search.hereapi.com/v1/geocode?${params.toString()}`
            );
            const data = await response.json();
            
            // Sadece İstanbul sonuçlarını filtrele
            const istanbulResults = data.items.filter(item => 
                item.address.city?.toLowerCase() === 'istanbul'
            );
            
            const resultsContainer = this.container.querySelector('#addressSearchResults');
            if (istanbulResults.length > 0) {
                resultsContainer.innerHTML = istanbulResults.map(item => `
                    <button type="button" 
                            class="list-group-item list-group-item-action" 
                            onclick="addressSelect.selectAddress('${item.id}', ${JSON.stringify(item).replace(/"/g, '&quot;')})">
                        ${item.address.label}
                        <small class="d-block text-muted">
                            ${item.address.street || ''} ${item.address.district || ''} 
                            ${item.address.postalCode || ''}
                        </small>
                    </button>
                `).join('');
            } else {
                resultsContainer.innerHTML = '<div class="list-group-item">Sonuç bulunamadı</div>';
            }
        } catch (error) {
            console.error('Adres arama hatası:', error);
        }
    }

    selectAddress(id, item) {
        try {
            const addressData = {
                label: item.address.label,
                city: 'İstanbul',
                district: item.address.district || '',
                postal_code: item.address.postalCode,
                street: item.address.street,
                position: item.position,
                source: 'here_api',
                here_place_id: id
            };

            // Kaydı yap
            this.saveAddress(addressData);
            
            // Seçilen adresi göster
            this.container.querySelector('[name="delivery_type"]').value = 'saved';
            const addressLabel = document.createElement('div');
            addressLabel.className = 'alert alert-success mt-2';
            addressLabel.textContent = addressData.label;
            this.container.querySelector('#addressSearchResults').replaceWith(addressLabel);

            // Callback'i çağır
            if (this.options.onSelect) {
                this.options.onSelect(addressData);
            }
        } catch (error) {
            console.error('Adres seçim hatası:', error);
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
