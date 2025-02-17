class OrderForm {
    constructor() {
        this.customerId = null;
        this.selectedAddress = null;
        this.items = [];
        this.init();
    }

    async init() {
        await loadHeader(); // Header yüklenmesini bekle
        
        // Form elementlerini header yüklendikten sonra seç
        this.form = document.getElementById('orderForm');
        this.customerForm = document.getElementById('customerForm');
        this.customerDetails = document.getElementById('customerDetails');
        this.searchInput = document.querySelector('input[name="phone"]');
        this.searchBtn = document.getElementById('searchCustomer');
        this.productTable = document.querySelector('#productTable tbody');
        this.addProductBtn = document.getElementById('addProductBtn');

        if (!this.form) {
            console.error('Form elementi bulunamadı');
            return;
        }

        this.setupEventListeners();
        this.initTodayAsMinDate();
    }

    initTodayAsMinDate() {
        const today = new Date().toISOString().split('T')[0];
        document.querySelector('input[name="delivery_date"]').min = today;
    }

    setupEventListeners() {
        // Formun kendisini dinle
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Müşteri arama
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.searchCustomer());
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.searchCustomer();
                }
            });
        }

        // Ürün ekleme
        if (this.addProductBtn) {
            this.addProductBtn.addEventListener('click', () => this.showProductModal());
        }

        // Müşteri tipi değişimi
        const customerTypeSelect = document.querySelector('select[name="customer_type"]');
        if (customerTypeSelect) {
            customerTypeSelect.addEventListener('change', (e) => this.toggleCompanyFields(e.target.value));
        }
    }

    async searchCustomer() {
        const phone = this.cleanPhoneNumber(this.searchInput.value);
        if (!phone) {
            showError('Geçerli bir telefon numarası girin');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/customers/phone/${phone}`);
            const data = await response.json();

            if (data.success && data.customer) {
                this.customerId = data.customer.id;
                this.showCustomerDetails(data.customer);
                await this.loadCustomerAddresses(data.customer.id);
            } else {
                this.showNewCustomerForm(phone);
            }
        } catch (error) {
            console.error('Müşteri arama hatası:', error);
            showError('Müşteri araması başarısız');
        }
    }

    cleanPhoneNumber(phone) {
        return phone.replace(/\D/g, '').replace(/^0+/, '');
    }

    showCustomerDetails(customer) {
        this.customerDetails.style.display = 'block';
        this.customerForm.style.display = 'none';

        this.customerDetails.innerHTML = `
            <div class="alert alert-success mb-0">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong class="d-block mb-1">${customer.name}</strong>
                        <small class="text-muted d-block">${formatPhoneNumber(customer.phone)}</small>
                        ${customer.email ? `<small class="text-muted d-block">${customer.email}</small>` : ''}
                        ${customer.customer_type === 'corporate' ? `
                            <small class="d-block mt-1">
                                <span class="badge bg-info">Kurumsal</span>
                                ${customer.company_name}
                            </small>
                        ` : ''}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-success" 
                            onclick="window.orderForm.editCustomer(${customer.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
            </div>
        `;
    }

    showNewCustomerForm(phone = '') {
        if (!this.customerDetails || !this.customerForm) {
            console.error('Müşteri form elementleri bulunamadı');
            return;
        }

        this.customerDetails.style.display = 'none';
        this.customerForm.style.display = 'block';

        // Form elementlerini temizle
        const inputs = this.customerForm.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.value = '';
        });

        // Telefon numarasını set et
        const phoneInput = this.customerForm.querySelector('input[name="phone"]');
        if (phoneInput && phone) {
            phoneInput.value = phone;
        }
    }

    toggleCompanyFields(type) {
        const companyFields = document.getElementById('companyFields');
        if (companyFields) {
            companyFields.style.display = type === 'corporate' ? 'block' : 'none';
        }
    }

    async saveCustomer() {
        if (!this.customerForm.checkValidity()) {
            this.customerForm.reportValidity();
            return;
        }

        const formData = new FormData(this.customerForm);
        const customerData = Object.fromEntries(formData);

        try {
            const response = await fetch(`${API_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customerData)
            });

            if (!response.ok) throw new Error('Müşteri kaydedilemedi');

            const result = await response.json();
            this.customerId = result.id;
            
            showSuccess('Müşteri kaydedildi');
            this.showCustomerDetails(result);

        } catch (error) {
            console.error('Müşteri kayıt hatası:', error);
            showError('Müşteri kaydedilemedi');
        }
    }

    async loadCustomerAddresses(customerId) {
        try {
            const response = await fetch(`${API_URL}/customers/${customerId}/addresses`);
            const addresses = await response.json();
            
            const container = document.getElementById('addressSelectContainer');
            
            if (addresses && addresses.length > 0) {
                container.innerHTML = addresses.map(addr => `
                    <div class="form-check mb-2">
                        <input type="radio" class="form-check-input" name="delivery_address_id" 
                               value="${addr.id}" id="addr_${addr.id}" required>
                        <label class="form-check-label" for="addr_${addr.id}">
                            <strong>${addr.label}</strong><br>
                            <small class="text-muted">
                                ${[addr.street, addr.district, addr.city].filter(Boolean).join(', ')}
                            </small>
                        </label>
                    </div>
                `).join('') + `
                    <button type="button" class="btn btn-sm btn-outline-primary mt-2" 
                            onclick="window.orderForm.showAddressForm()">
                        <i class="bi bi-plus-lg"></i> Yeni Adres
                    </button>
                `;
            } else {
                container.innerHTML = `
                    <div class="alert alert-info mb-2">Kayıtlı adres bulunamadı</div>
                    <button type="button" class="btn btn-sm btn-primary" 
                            onclick="window.orderForm.showAddressForm()">
                        <i class="bi bi-plus-lg"></i> Adres Ekle
                    </button>
                `;
            }
        } catch (error) {
            console.error('Adres yükleme hatası:', error);
            showError('Adresler yüklenemedi');
        }
    }

    showAddressForm() {
        if (!this.customerId) {
            showError('Önce müşteri seçmelisiniz');
            return;
        }

        const container = document.getElementById('addressSelectContainer');
        const existingForm = document.getElementById('newAddressForm');
        
        // Eğer form zaten açıksa tekrar açma
        if (existingForm) return;

        const formHtml = `
            <div class="card mt-3" id="newAddressCard">
                <div class="card-body">
                    <form id="newAddressForm" class="row g-2">
                        <div class="col-12">
                            <label class="small mb-1">Adres Başlığı *</label>
                            <input type="text" class="form-control form-control-sm" name="label" required>
                        </div>
                        <div class="col-12">
                            <label class="small mb-1">Sokak/Cadde *</label>
                            <input type="text" class="form-control form-control-sm" name="street" required>
                        </div>
                        <div class="col-md-6">
                            <label class="small mb-1">İlçe *</label>
                            <input type="text" class="form-control form-control-sm" name="district" required>
                        </div>
                        <div class="col-12 mt-3">
                            <button type="submit" class="btn btn-primary btn-sm">Kaydet</button>
                            <button type="button" class="btn btn-secondary btn-sm" 
                                    onclick="document.getElementById('newAddressCard').remove()">
                                İptal
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Formu ekle
        container.insertAdjacentHTML('beforeend', formHtml);

        // Form submit event listener'ı ekle
        document.getElementById('newAddressForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveAddress(new FormData(e.target));
        });
    }

    async saveAddress(formData) {
        try {
            const addressData = {
                ...Object.fromEntries(formData),
                customer_id: this.customerId,
                city: 'İstanbul',
                country_code: 'TUR',
                country_name: 'Türkiye'
            };

            const response = await fetch(`${API_URL}/customers/${this.customerId}/addresses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addressData)
            });

            if (!response.ok) throw new Error('Adres kaydedilemedi');

            showSuccess('Adres başarıyla kaydedildi');
            
            // Form container'ı kaldır
            document.getElementById('newAddressCard')?.remove();
            
            // Adresleri yeniden yükle
            await this.loadCustomerAddresses(this.customerId);

        } catch (error) {
            console.error('Adres kayıt hatası:', error);
            showError('Adres kaydedilemedi');
        }
    }

    async showProductModal() {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <select class="form-select form-select-sm" required>
                    <option value="">Ürün Seçin</option>
                    <option value="1" data-price="199.90">Kırmızı Güller</option>
                    <option value="2" data-price="299.90">Beyaz Orkide</option>
                    <option value="3" data-price="149.90">Renkli Papatya</option>
                </select>
            </td>
            <td><input type="number" class="form-control form-control-sm" value="1" min="1"></td>
            <td class="text-end">₺0,00</td>
            <td class="text-end">₺0,00</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-danger">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;

        // Event listeners
        const select = row.querySelector('select');
        const qtyInput = row.querySelector('input');
        const deleteBtn = row.querySelector('button');

        select.addEventListener('change', () => this.updateRowPrices(row));
        qtyInput.addEventListener('change', () => this.updateRowPrices(row));
        deleteBtn.addEventListener('click', () => {
            row.remove();
            this.updateTotals();
        });

        this.productTable.appendChild(row);
    }

    updateRowPrices(row) {
        const select = row.querySelector('select');
        const qty = parseInt(row.querySelector('input').value);
        const option = select.selectedOptions[0];
        
        if (option && option.dataset.price) {
            const price = parseFloat(option.dataset.price);
            const total = price * qty;
            
            row.cells[2].textContent = formatCurrency(price);
            row.cells[3].textContent = formatCurrency(total);
            
            this.updateTotals();
        }
    }

    updateTotals() {
        let subtotal = 0;
        const deliveryFee = 50.00;

        this.productTable.querySelectorAll('tr').forEach(row => {
            const totalCell = row.cells[3]?.textContent;
            if (totalCell) {
                subtotal += parseFloat(totalCell.replace(/[^\d,]/g, '').replace(',', '.'));
            }
        });

        document.getElementById('subtotal').textContent = formatCurrency(subtotal);
        document.getElementById('deliveryFee').textContent = formatCurrency(deliveryFee);
        document.getElementById('total').textContent = formatCurrency(subtotal + deliveryFee);
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        const formData = new FormData(this.form);
        const orderData = {
            customer_id: this.customerId,
            delivery_address_id: formData.get('delivery_address_id'),
            recipient_name: formData.get('recipient_name'),
            recipient_phone: formData.get('recipient_phone'),
            delivery_date: formData.get('delivery_date'),
            delivery_time_slot: formData.get('delivery_time_slot'),
            card_message: formData.get('card_message'),
            payment_method: formData.get('payment_method'),
            items: this.getOrderItems()
        };

        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) throw new Error('Sipariş oluşturulamadı');

            const result = await response.json();
            showSuccess('Sipariş başarıyla oluşturuldu');

            setTimeout(() => {
                window.location.href = '/orders/list.html';
            }, 2000);

        } catch (error) {
            console.error('Sipariş oluşturma hatası:', error);
            showError('Sipariş oluşturulamadı');
        }
    }

    validateForm() {
        // Required fields validation
        const requiredFields = {
            'customer': this.customerId,
            'delivery_address_id': 'Teslimat adresi',
            'recipient_name': 'Alıcı adı',
            'recipient_phone': 'Alıcı telefonu',
            'delivery_date': 'Teslimat tarihi',
            'delivery_time_slot': 'Teslimat saati',
            'payment_method': 'Ödeme yöntemi'
        };

        for (const [field, label] of Object.entries(requiredFields)) {
            if (field === 'customer' && !this.customerId) {
                showError('Lütfen müşteri seçin veya ekleyin');
                return false;
            }

            const input = this.form.querySelector(`[name="${field}"]`);
            if (!input?.value) {
                showError(`Lütfen ${label} alanını doldurun`);
                input?.focus();
                return false;
            }
        }

        // Products validation
        if (this.productTable.children.length === 0) {
            showError('Lütfen en az bir ürün ekleyin');
            return false;
        }

        return true;
    }

    getOrderItems() {
        const items = [];
        this.productTable.querySelectorAll('tr').forEach(row => {
            const select = row.querySelector('select');
            const qty = row.querySelector('input').value;
            if (select.value && qty) {
                items.push({
                    product_id: parseInt(select.value),
                    quantity: parseInt(qty),
                    unit_price: parseFloat(row.cells[2].textContent.replace(/[^\d,]/g, '').replace(',', '.'))
                });
            }
        });
        return items;
    }

    // Adres arama fonksiyonu
    setupAddressSearch() {
        const searchInput = document.getElementById('addressSearchInput');
        const searchBtn = document.getElementById('addressSearchBtn');
        const resultsDiv = document.getElementById('addressSearchResults');

        if (searchInput && searchBtn) {
            let timeout;
            
            // Input değiştiğinde
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                const query = e.target.value;
                if (query.length >= 3) {
                    timeout = setTimeout(() => this.searchAddress(query), 500);
                }
            });

            // Buton tıklandığında
            searchBtn.addEventListener('click', () => {
                const query = searchInput.value;
                if (query.length >= 3) {
                    this.searchAddress(query);
                }
            });
        }
    }
}

// Global instance
document.addEventListener('DOMContentLoaded', () => {
    window.orderForm = new OrderForm();
});
