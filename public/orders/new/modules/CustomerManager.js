class CustomerManager {
    constructor(formInstance) {
        this.form = formInstance;
        this.search = document.querySelector('input[name="phone"]');
        this.searchBtn = document.getElementById('searchCustomer');
        this.customerForm = document.getElementById('customerForm');
        this.customerDetails = document.getElementById('customerDetails');
        this.setupListeners();
    }

    setupListeners() {
        this.searchBtn?.addEventListener('click', () => this.searchCustomer());
        this.search?.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchCustomer();
            }
        });
    }

    async searchCustomer() {
        const phone = this.search.value.replace(/\D/g, '');
        if (!phone) {
            showError('Geçerli telefon numarası girin');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/customers/search/${phone}`);
            const data = await response.json();

            if (data.customer) {
                this.setCustomer(data.customer);
            } else {
                this.showNewForm(phone);
            }
        } catch (error) {
            showError('Müşteri araması başarısız');
        }
    }
}
