class CustomerSelect {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
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

        // Modal'ı bir kere oluştur
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

    async searchCustomer(phone) {
        try {
            const response = await fetch(`${API_URL}/customers/search/phone/${phone}`);
            const data = await response.json();
            
            if (!data.found) {
                this.form.elements['phone'].value = phone;
                this.modal.show();
                return;
            }

            this.selectCustomer(data.customer);
        } catch (error) {
            showError('Müşteri araması başarısız');
        }
    }

    async saveCustomer() {
        try {
            const formData = new FormData(this.form);
            const response = await fetch(`${API_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            const result = await response.json();
            this.modal.hide();
            this.selectCustomer(result);
            showSuccess('Müşteri kaydedildi');
        } catch (error) {
            showError('Müşteri kaydedilemedi');
        }
    }

    selectCustomer(customer) {
        document.getElementById('customerInfo').innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${customer.name}</strong><br>
                    <small>${formatPhoneNumber(customer.phone)}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="customerSelect.clearCustomer()">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;
        document.getElementById('customerInfo').style.display = 'block';

        // Event tetikle
        document.dispatchEvent(new CustomEvent('customerSelected', {
            detail: customer
        }));
    }

    clearCustomer() {
        document.getElementById('customerInfo').style.display = 'none';
        document.getElementById('customerPhone').value = '';
        document.dispatchEvent(new CustomEvent('customerSelected', { detail: null }));
    }

    setupEventListeners() {
        document.getElementById('searchCustomerBtn').addEventListener('click', () => {
            const phone = document.getElementById('customerPhone').value;
            if (phone) this.searchCustomer(phone);
        });

        document.getElementById('saveCustomerBtn').addEventListener('click', () => {
            if (this.form.checkValidity()) {
                this.saveCustomer();
            } else {
                this.form.reportValidity();
            }
        });
    }
}

// Global instance
window.customerSelect = new CustomerSelect('customerSelectContainer');
