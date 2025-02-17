class CustomerSelect extends BaseComponent {
    constructor(containerId, manager) {
        super(containerId, manager);
        this.init();
    }

    render() {
        this.container.innerHTML = `
            <div class="input-group mb-2">
                <input type="tel" class="form-control" id="customerPhone" 
                       placeholder="Müşteri telefonu">
                <button class="btn btn-primary" type="button" id="searchCustomerBtn">
                    <i class="bi bi-search"></i> Ara
                </button>
            </div>
            <div id="customerInfo" class="alert alert-success" style="display:none"></div>
        `;

        this.renderModal();
    }

    renderModal() {
        if (!document.getElementById('customerModal')) {
            document.body.insertAdjacentHTML('beforeend', `
                <div class="modal fade" id="customerModal">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Yeni Müşteri</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="customerForm">
                                    <div class="mb-3">
                                        <label class="form-label">Ad Soyad *</label>
                                        <input type="text" class="form-control" name="name" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Telefon *</label>
                                        <input type="tel" class="form-control" name="phone" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">İlçe *</label>
                                        <select class="form-select" name="district" required>
                                            <option value="">Seçiniz</option>
                                            ${ISTANBUL_DISTRICTS.map(d => 
                                                `<option value="${d}">${d}</option>`
                                            ).join('')}
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Email</label>
                                        <input type="email" class="form-control" name="email">
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                                <button type="button" class="btn btn-primary" id="saveCustomerBtn">Kaydet</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        }

        this.modal = new bootstrap.Modal(document.getElementById('customerModal'));
        this.form = document.getElementById('customerForm');
    }

    setupEventListeners() {
        // ... existing event listener code ...
    }

    async searchCustomer(phone) {
        try {
            const customer = await ApiService.searchCustomer(phone);
            if (!customer.found) {
                this.form.elements['phone'].value = phone;
                this.modal.show();
                return;
            }
            this.selectCustomer(customer);
        } catch (error) {
            this.showError('Müşteri araması başarısız');
        }
    }

    // ... rest of the methods ...
}
