class AddressForm {
    constructor(containerId, apiKey) {
        this.container = document.getElementById(containerId);
        this.addressService = new HereAddressService(apiKey);
        this.init();
    }

    async init() {
        this.renderForm();
        this.setupAutocomplete();
    }

    setupAutocomplete() {
        const addressInput = this.container.querySelector('[name="address"]');
        
        // Debounce için timeout
        let timeout;
        
        addressInput.addEventListener('input', async (e) => {
            clearTimeout(timeout);
            const query = e.target.value;
            
            if (query.length < 3) return;
            
            timeout = setTimeout(async () => {
                try {
                    const suggestions = await this.addressService.autocomplete(query);
                    this.showSuggestions(suggestions);
                } catch (error) {
                    console.error('Autocomplete error:', error);
                }
            }, 300);
        });
    }

    // ...diğer metodlar
}
