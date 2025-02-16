class AddressSelect {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = options;
        this.addressService = new AddressService();
        this.init();
    }

    async init() {
        // İki seçenek olacak: Müşteri Adresi veya Farklı Adres
        this.renderDeliveryTypeSelect();
        this.setupEventListeners();
    }

    renderDeliveryTypeSelect() {
        this.container.innerHTML = `
            <div class="mb-3">
                <label class="form-label">Teslimat Adresi</label>
                <select class="form-select" name="delivery_type">
                    <option value="customer">Müşteri Adresi</option>
                    <option value="recipient">Farklı Adres</option>
                </select>
            </div>
            <div id="address-details"></div>
        `;
    }
}
