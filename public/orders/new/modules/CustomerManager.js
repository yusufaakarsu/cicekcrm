class CustomerManager {
    constructor() {
        this.customer = null;
        this.step = document.getElementById('step1Status');
        this.container = document.createElement('div');
        this.container.className = 'mb-4';
        document.getElementById('orderForm').appendChild(this.container);
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">1. Müşteri Seçimi</h6>
                    ${this.customer ? `
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="customerManager.clear()">
                            <i class="bi bi-arrow-left"></i> Değiştir
                        </button>
                    ` : ''}
                </div>
                <div class="card-body">
                    ${this.customer ? this.renderCustomerDetails() : this.renderSearch()}
                </div>
            </div>
        `;
    }

    renderSearch() {
        return `
            <div class="input-group">
                <input type="tel" class="form-control" placeholder="Telefon numarası ile ara" 
                       id="customerPhone">
                <button type="button" class="btn btn-primary" onclick="customerManager.search()">
                    <i class="bi bi-search"></i> Ara
                </button>
            </div>
        `;
    }

    renderCustomerDetails() {
        return `
            <div class="alert alert-success mb-0">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${this.customer.name}</strong>
                        <div class="small">${this.customer.phone}</div>
                        ${this.customer.email ? `<div class="small text-muted">${this.customer.email}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    async search() {
        const phone = document.getElementById('customerPhone').value.replace(/\D/g, '');
        if (!phone) {
            showError('Geçerli bir telefon numarası girin');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/customers/search/${phone}`);
            const data = await response.json();

            if (data.success && data.customer) {
                this.setCustomer(data.customer);
            } else {
                // Yeni müşteri modalını göster
                this.showNewCustomerModal(phone);
            }
        } catch (error) {
            showError('Müşteri araması başarısız');
        }
    }

    setCustomer(customer) {
        this.customer = customer;
        this.step.innerHTML = `<i class="bi bi-check-circle text-success"></i> ${customer.name}`;
        this.render();
        // Address Manager'ı aktif et
        window.addressManager.enable(customer.id);
    }

    clear() {
        this.customer = null;
        this.step.innerHTML = 'Müşteri seçilmedi';
        this.render();
        // Address Manager'ı deaktif et
        window.addressManager.disable();
    }

    // Müşteri bilgilerini döndür
    getCustomer() {
        return this.customer;
    }

    showNewCustomerModal(phone) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Yeni Müşteri</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="newCustomerForm">
                            <div class="mb-3">
                                <label class="form-label">Müşteri Tipi</label>
                                <select class="form-select form-select-sm" name="customer_type" onchange="customerManager.toggleCompanyFields(this.value)">
                                    <option value="retail">Bireysel</option>
                                    <option value="corporate">Kurumsal</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Ad Soyad *</label>
                                <input type="text" class="form-control form-control-sm" name="name" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Telefon *</label>
                                <input type="tel" class="form-control form-control-sm" name="phone" value="${phone}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control form-control-sm" name="email">
                            </div>
                            <!-- Kurumsal alanlar -->
                            <div id="newCompanyFields" style="display:none">
                                <div class="mb-3">
                                    <label class="form-label">Firma Adı *</label>
                                    <input type="text" class="form-control form-control-sm" name="company_name">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Vergi No *</label>
                                    <input type="text" class="form-control form-control-sm" name="tax_number">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">İptal</button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="customerManager.saveNewCustomer()">
                            Kaydet
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    async saveNewCustomer() {
        const form = document.getElementById('newCustomerForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const customerData = {
            ...Object.fromEntries(formData),
            tenant_id: 1 // TODO: Tenant ID'yi dinamik al
        };

        try {
            const response = await fetch(`${API_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customerData)
            });

            if (!response.ok) throw new Error('Müşteri kaydedilemedi');

            const result = await response.json();
            this.setCustomer(result.customer);
            
            // Modal'ı kapat
            bootstrap.Modal.getInstance(form.closest('.modal')).hide();
            
            showSuccess('Müşteri kaydedildi');

        } catch (error) {
            console.error('Müşteri kayıt hatası:', error);
            showError('Müşteri kaydedilemedi');
        }
    }
}

window.customerManager = new CustomerManager();
