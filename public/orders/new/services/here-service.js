class HereService {
    static apiKey = CONFIG.HERE_API_KEY;

    static async searchAddress(query) {
        const params = new URLSearchParams({
            apiKey: this.apiKey,
            q: `${query}, İstanbul, Turkey`,
            limit: '5',
            lang: 'tr'
        });

        const response = await fetch(`https://geocode.search.hereapi.com/v1/geocode?${params}`);
        if (!response.ok) throw new Error('HERE API Error');
        
        const data = await response.json();
        return data.items?.map(item => ({
            id: `here_${item.id}`,
            label: item.title,
            address: {
                street: item.address.street,
                district: item.address.district,
                city: 'İstanbul'
            },
            position: item.position,
            type: 'here'
        })) || [];
    }
}
