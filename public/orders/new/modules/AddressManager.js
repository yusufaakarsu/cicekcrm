class AddressManager {
    constructor(formInstance) {
        this.form = formInstance;
        this.container = document.getElementById('addressSelectContainer');
        this.searchInput = document.getElementById('addressSearchInput');
        this.searchBtn = document.getElementById('addressSearchBtn');
        this.setupListeners();
    }

    setupListeners() {
        if (this.searchInput && this.searchBtn) {
            this.searchInput.addEventListener('input', e => this.handleSearch(e));
            this.searchBtn.addEventListener('click', () => this.searchAddress());
        }
    }

    async loadCustomerAddresses(customerId) {
        try {
            const response = await fetch(`${API_URL}/customers/${customerId}/addresses`);
            const addresses = await response.json();
            this.renderAddresses(addresses);
        } catch (error) {
            showError('Adresler yüklenemedi');
        }
    }
}
