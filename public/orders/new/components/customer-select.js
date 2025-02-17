class CustomerSelect {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.selectedCustomer = null;
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="row g-3">
                <!-- Telefon ile Müşteri Arama -->
                <div class="col-md-6">
                    <div class="input-group">
                        <input type="tel" class="form-control" id="customerPhone" 
                               placeholder="Müşteri telefonu" maxlength="11">
                        <button class="btn btn-primary" type="button" id="searchCustomer">
                            <i class="bi bi-search"></i> Ara
                        </button>
                    </div>
                </div>
                
                <!-- Yeni Müşteri Butonu -->
                <div class="col-md-6">
                    <button class="btn btn-outline-primary" type="button" id="newCustomerBtn">
                        <i class="bi bi-person-plus"></i> Yeni Müşteri
                    </button>
                </div>

                <!-- Seçili Müşteri Bilgileri -->
                <div class="col-12">
                    <div id="selectedCustomerInfo" style="display:none" class="alert alert-success">
                        <!-- Müşteri bilgileri buraya gelecek -->
                    </div>
                </div>
            </div>

            <!-- Yeni Müşteri Modal -->
            <div class="modal fade" id="newCustomerModal" tabindex="-1">
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
                                    <select class="form-control" name="customer_type" onchange="toggleCompanyFields(this.value)">
                                        <option value="retail">Bireysel</option>
                                        <option value="corporate">Kurumsal</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Ad Soyad *</label>
                                    <input type="text" class="form-control" name="name" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Telefon *</label>
                                    <input type="tel" class="form-control" name="phone" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" name="email">
                                </div>
                                <div id="companyFields" style="display:none">
                                    <div class="mb-3">
                                        <label class="form-label">Firma Adı</label>
                                        <input type="text" class="form-control" name="company_name">
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Vergi No</label>
                                        <input type="text" class="form-control" name="tax_number">
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                            <button type="button" class="btn btn-primary" onclick="saveNewCustomer()">Kaydet</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Modal ve form elementlerini sakla
        this.modal = new bootstrap.Modal(document.getElementById('newCustomerModal'));
        this.form = document.getElementById('newCustomerForm');
    }

    setupEventListeners() {
        // Telefon ile arama
        const searchBtn = document.getElementById('searchCustomer');
        const phoneInput = document.getElementById('customerPhone');

        searchBtn.addEventListener('click', () => this.searchCustomer(phoneInput.value));
        
        phoneInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.searchCustomer(e.target.value);
            }
        });

        // Yeni müşteri modal
        document.getElementById('newCustomerBtn').addEventListener('click', () => {
            this.form.reset();
            this.modal.show();
        });
    }

    async searchCustomer(phone) {
        if (!phone) {
            showError('Lütfen telefon numarası girin');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/customers/search/phone/${phone}`);
            if (!response.ok) throw new Error('API Hatası');
            
            const data = await response.json();
            
            if (data.found === false) {
                // Müşteri bulunamadı - yeni müşteri formunu aç
                this.form.elements['phone'].value = phone;
                this.modal.show();
                return;
            }

            this.selectCustomer(data);

        } catch (error) {
            console.error('Müşteri arama hatası:', error);
            showError('Müşteri araması başarısız!');
        }
    }

    selectCustomer(customer) {
        this.selectedCustomer = customer;
        
        // Müşteri bilgilerini göster
        const infoDiv = document.getElementById('selectedCustomerInfo');
        infoDiv.style.display = 'block';
        infoDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${customer.name}</strong><br>
                    <small>${formatPhoneNumber(customer.phone)}</small>
                    ${customer.email ? `<br><small>${customer.email}</small>` : ''}
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="customerSelect.clearSelection()">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;

        // Event'i tetikle
        document.dispatchEvent(new CustomEvent('customerSelected', {
            detail: customer
        }));
    }

    clearSelection() {
        this.selectedCustomer = null;
        document.getElementById('selectedCustomerInfo').style.display = 'none';
        document.getElementById('customerPhone').value = '';
        
        // Event'i tetikle
        document.dispatchEvent(new CustomEvent('customerSelected', {
            detail: null
        }));
    }

    async saveNewCustomer() {
        if (!this.form.checkValidity()) {
            this.form.reportValidity();
            return;
        }

        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData);

        try {
            const response = await fetch(`${API_URL}/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('API Hatası');

            const result = await response.json();
            
            // Yeni müşteri bilgilerini al ve seç
            const customerResponse = await fetch(`${API_URL}/customers/${result.id}`);
            const customer = await customerResponse.json();
            
            this.modal.hide();
            this.selectCustomer(customer);
            showSuccess('Müşteri başarıyla eklendi');

        } catch (error) {
            console.error('Müşteri kayıt hatası:', error);
            showError('Müşteri kaydedilemedi!');
        }
    }
}

// Global instance
window.customerSelect = new CustomerSelect('customerSelectContainer');
