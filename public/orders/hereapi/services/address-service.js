class AddressService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://geocode.search.hereapi.com/v1';
    }

    async searchAddress(query) {
        try {
            const response = await fetch(
                `${this.baseUrl}/geocode?q=${encodeURIComponent(query)}&apiKey=${this.apiKey}&in=countryCode:TUR&lang=tr`
            );
            
            const data = await response.json();
            
            return data.items.map(item => ({
                id: item.id,
                label: item.address.label,
                city: item.address.city,
                district: item.address.county,
                postalCode: item.address.postalCode,
                position: item.position,
                source: 'here_api'
            }));

        } catch (error) {
            console.error('Address search error:', error);
            throw error;
        }
    }

    async saveAddress(addressData) {
        try {
            const response = await fetch(`${API_URL}/addresses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(addressData)
            });
            
            return response.json();
        } catch (error) {
            console.error('Save address error:', error);
            throw error;
        }
    }
}
