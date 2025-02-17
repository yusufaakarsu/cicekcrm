class CustomerSelect {
    constructor(containerId, manager) {
        this.container = document.getElementById(containerId);
        this.manager = manager;
        this.selectedCustomer = null;
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

        // Modal template'ini bir kere ekle
        if (!document.getElementById('customerModal')) {
            document.body.insertAdjacentHTML('beforeend', `
                <div class="modal fade" id="customerModal" tabindex="-1">
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
            
            this.modal = new bootstrap.Modal(document.getElementById('customerModal'));
            this.form = document.getElementById('customerForm');
        }
    }

    setupEventListeners() {
        const searchBtn = document.getElementById('searchCustomerBtn');
        const phoneInput = document.getElementById('customerPhone');
        const saveBtn = document.getElementById('saveCustomerBtn');

        // Enter ile arama
        phoneInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchCustomer(phoneInput.value);
            }
        });

        // Butona tıklayarak arama
        searchBtn?.addEventListener('click', () => {
            this.searchCustomer(phoneInput.value);
        });

        // Müşteri kaydetme
        saveBtn?.addEventListener('click', () => {
            this.saveCustomer();
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
                // Müşteri bulunamadı - formu telefon ile doldur ve göster
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
        const infoDiv = document.getElementById('customerInfo');
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
        document.getElementById('customerInfo').style.display = 'none';
        document.getElementById('customerPhone').value = '';
        
        // Event'i tetikle
        document.dispatchEvent(new CustomEvent('customerSelected', {
            detail: null
        }));
    }

    async saveCustomer() {
        if (!this.form.checkValidity()) {
            this.form.reportValidity();
            return;
        }

        try {
            const formData = new FormData(this.form);
            const data = Object.fromEntries(formData);

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
