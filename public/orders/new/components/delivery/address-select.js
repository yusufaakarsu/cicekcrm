class AddressSelect extends BaseComponent {
    constructor(container, manager) {
        super(container, manager);
        this.savedAddresses = [];
        this.init();
    }

    render() {
        this.container.innerHTML = `
            <div class="address-select">
                <div class="input-group mb-3">
                    <input type="text" class="form-control" id="addressSearchInput" 
                           placeholder="Adres aramak için yazın...">
                    <button class="btn btn-outline-primary" type="button" id="addressSearchBtn">
                        <i class="bi bi-search"></i>
                    </button>
                </div>
                <div id="addressList" class="list-group mb-3"></div>
                <div id="selectedAddress" class="alert alert-success" style="display:none"></div>
            </div>
        `;

        this.searchInput = this.container.querySelector('#addressSearchInput');
        this.searchBtn = this.container.querySelector('#addressSearchBtn');
        this.addressList = this.container.querySelector('#addressList');
        this.selectedAddressDiv = this.container.querySelector('#selectedAddress');
    }

    setupEventListeners() {
        // ... existing event listener code ...
    }

    async searchAddress(query) {
        try {
            const results = await HereService.searchAddress(query);
            this.showResults([...this.savedAddresses, ...results]);
        } catch (error) {
            this.showError('Adres araması başarısız');
        }
    }

    // ... rest of the methods ...
}
