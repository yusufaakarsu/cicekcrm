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
            <div class="mb-3">
                <div class="input-group">
                    <input type="tel" class="form-control" placeholder="Telefon numarası ile ara" 
                           id="customerPhone">
                    <button type="button" class="btn btn-primary" onclick="customerManager.search()">
                        <i class="bi bi-search"></i> Ara
                    </button>
                </div>
            </div>
            <!-- Yeni müşteri formu burada gösterilecek -->
            <div id="newCustomerFormContainer" style="display:none">
                <hr>
                <h6 class="mb-3">Yeni Müşteri</h6>
                <form id="newCustomerForm" class="row g-2">
                    <div class="col-12">
                        <label class="form-label small">Müşteri Tipi</label>
                        <select class="form-select form-select-sm" name="customer_type" onchange="customerManager.toggleCompanyFields(this.value)">
                            <option value="retail">Bireysel</option>
                            <option value="corporate">Kurumsal</option>
                        </select>
                    </div>
                    <div class="col-12">
                        <label class="form-label small">Ad Soyad *</label>
                        <input type="text" class="form-control form-control-sm" name="name" required>
                    </div>
                    <div class="col-6">
                        <label class="form-label small">Telefon *</label>
                        <input type="tel" class="form-control form-control-sm" name="phone" required readonly>
                    </div>
                    <div class="col-6">
                        <label class="form-label small">Email</label>
                        <input type="email" class="form-control form-control-sm" name="email">
                    </div>

                    <!-- Kurumsal alanlar -->
                    <div id="companyFields" class="col-12" style="display:none">
                        <div class="row g-2">
                            <div class="col-12">
                                <label class="form-label small">Firma Adı *</label>
                                <input type="text" class="form-control form-control-sm" name="company_name">
                            </div>
                            <div class="col-12">
                                <label class="form-label small">Vergi No *</label>
                                <input type="text" class="form-control form-control-sm" name="tax_number">
                            </div>
                        </div>
                    </div>

                    <div class="col-12">
                        <button type="submit" class="btn btn-primary btn-sm">
                            <i class="bi bi-check-lg"></i> Müşteriyi Kaydet
                        </button>
                    </div>
                </form>
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
            // API endpoint değişti ve response kontrolü düzeltildi
            const response = await fetch(`${API_URL}/customers/phone/${phone}`);
            const data = await response.json();

            console.log('API Response:', data); // Debug için

            // Eğer müşteri varsa success true gelecek
            if (data.success && data.customer) {
                this.setCustomer(data.customer);
            } else {
                // Form container'ı göster
                const formContainer = document.getElementById('newCustomerFormContainer');
                formContainer.style.display = 'block';
                
                // Telefon numarasını form'a set et
                const phoneInput = document.querySelector('#newCustomerForm input[name="phone"]');
                phoneInput.value = phone;

                // Form submit listener ekle
                document.getElementById('newCustomerForm').onsubmit = async (e) => {
                    e.preventDefault();
                    await this.saveNewCustomer(e.target);
                };
            }
        } catch (error) {
            console.error('Müşteri arama hatası:', error);
            showError('Müşteri araması başarısız');
        }
    }

    setCustomer(customer) {
        this.customer = customer;
        window.wizardManager.setStepCompleted(1, true);
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
            
            showSuccess('Müşteri kaydedildi');

        } catch (error) {
            console.error('Müşteri kayıt hatası:', error);
            showError('Müşteri kaydedilemedi');
        }
    }

    toggleCompanyFields(type) {
        const fields = document.getElementById('companyFields');
        if (fields) {
            fields.style.display = type === 'corporate' ? 'block' : 'none';
            
            // Zorunlu alanları toggle et
            const companyInputs = fields.querySelectorAll('input');
            companyInputs.forEach(input => {
                input.required = type === 'corporate';
            });
        }
    }
}

window.customerManager = new CustomerManager();
