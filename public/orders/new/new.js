class OrderForm {
    constructor() {
        this.form = document.getElementById('orderForm');
        this.items = [];
        this.customerId = null;
        this.addressId = null;

        this.init();
    }

    init() {
        loadHeader();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Form submit
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveOrder();
        });
    }
}

// Global instance
document.addEventListener('DOMContentLoaded', () => {
    window.orderForm = new OrderForm();
});
