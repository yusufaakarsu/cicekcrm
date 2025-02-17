class ApiService {
    static async fetchWithAuth(endpoint, options = {}) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'API Error');
        }

        return response.json();
    }

    // Müşteri API'leri
    static async searchCustomer(phone) {
        return this.fetchWithAuth(`/customers/search/phone/${phone}`);
    }

    static async createCustomer(data) {
        return this.fetchWithAuth('/customers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Sipariş API'leri
    static async createOrder(data) {
        return this.fetchWithAuth('/orders', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Adres API'leri
    static async getCustomerAddresses(customerId) {
        return this.fetchWithAuth(`/customers/${customerId}/addresses`);
    }

    // Ürün API'leri
    static async searchProducts(query) {
        return this.fetchWithAuth(`/products/search?q=${query}`);
    }
}
