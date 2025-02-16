interface HereAddressResult {
    city: string;
    district: string;
    street: string;
    houseNumber: string;
    postalCode: string;
    label: string;
    lat: number;
    lng: number;
}

class HereAddressService implements AddressService {
    private apiKey: string;
    private baseUrl = 'https://geocode.search.hereapi.com/v1';

    constructor(env: any) {
        this.apiKey = env.HERE_API_KEY;
        this.appId = env.HERE_APP_ID;
    }

    async searchAddress(query: string): Promise<HereAddressResult[]> {
        try {
            const response = await fetch(
                `${this.baseUrl}/geocode?q=${encodeURIComponent(query)}&in=countryCode:TUR&apiKey=${this.apiKey}&lang=tr`
            );
            
            const data = await response.json();
            
            return data.items.map(item => ({
                city: item.address.city,
                district: item.address.district,
                street: item.address.street,
                houseNumber: item.address.houseNumber,
                postalCode: item.address.postalCode,
                label: item.address.label,
                lat: item.position.lat,
                lng: item.position.lng
            }));

        } catch (error) {
            console.error('HERE API Error:', error);
            throw new Error('Address search failed');
        }
    }

    async autocomplete(query: string): Promise<string[]> {
        try {
            const response = await fetch(
                `${this.baseUrl}/autocomplete?q=${encodeURIComponent(query)}&in=countryCode:TUR&apiKey=${this.apiKey}&lang=tr`
            );
            
            const data = await response.json();
            return data.items.map(item => item.address.label);

        } catch (error) {
            console.error('HERE API Error:', error);
            throw new Error('Autocomplete failed');
        }
    }
}

export default HereAddressService;
