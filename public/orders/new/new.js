// Temel OrderForm sınıfı
class OrderForm {
    constructor() {
        this.form = null;
        this.customerId = null;
        this.addressId = null;
        this.items = [];

        // Managers
        this.customerManager = null;
        this.addressManager = null;
        
        this.init();
    }

    async init() {
        await loadHeader();
        this.form = document.getElementById('orderForm');
        if (!this.form) return;
        
        // Initialize managers
        this.customerManager = new CustomerManager(this);
        this.addressManager = new AddressManager(this);
        
        this.initElements();
        this.setupListeners();
    }

    initElements() {
        // Müşteri Elementleri
        this.customerSearch = document.querySelector('input[name="phone"]');
        this.customerSearchBtn = document.getElementById('searchCustomer');
        this.customerForm = document.getElementById('customerForm');
        this.customerDetails = document.getElementById('customerDetails');
        
        // Ürün Elementleri
        this.productTable = document.querySelector('#productTable tbody');
        this.addProductBtn = document.getElementById('addProductBtn');

        // Tarih sınırı
        document.querySelector('input[name="delivery_date"]').min = 
            new Date().toISOString().split('T')[0];
    }

    setupListeners() {
        // Form Submit
        this.form.addEventListener('submit', e => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Müşteri Arama
        this.customerSearchBtn?.addEventListener('click', () => this.searchCustomer());

        // Ürün Ekleme
        this.addProductBtn?.addEventListener('click', () => this.addProduct());

        // Müşteri Tipi Değişimi
        const typeSelect = document.querySelector('select[name="customer_type"]');
        typeSelect?.addEventListener('change', e => {
            document.getElementById('companyFields').style.display = 
                e.target.value === 'corporate' ? 'block' : 'none';
        });
    }

    async searchCustomer() {
        const phone = this.customerSearch.value.replace(/\D/g, '');
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
                this.showCustomerForm(phone);
            }
        } catch (error) {
            showError('Müşteri araması başarısız');
        }
    }

    setCustomer(customer) {
        this.customerId = customer.id;
        this.customerForm.style.display = 'none';
        this.customerDetails.style.display = 'block';
        this.customerDetails.innerHTML = this.getCustomerTemplate(customer);
        this.loadAddresses();
    }

    getCustomerTemplate(customer) {
        return `
            <div class="alert alert-success mb-0">
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>${customer.name}</strong>
                        <div class="small text-muted">${customer.phone}</div>
                        ${customer.email ? `<div class="small">${customer.email}</div>` : ''}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="orderForm.editCustomer()">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
            </div>
        `;
    }

    addProduct() {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <select class="form-select form-select-sm" required>
                    <option value="">Ürün Seçin</option>
                    <option value="1" data-price="199.90">Kırmızı Güller</option>
                    <option value="2" data-price="299.90">Beyaz Orkide</option>
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

        // Event Listeners
        const select = row.querySelector('select');
        const input = row.querySelector('input');
        const deleteBtn = row.querySelector('button');

        select.addEventListener('change', () => this.calculateRowTotal(row));
        input.addEventListener('change', () => this.calculateRowTotal(row));
        deleteBtn.addEventListener('click', () => {
            row.remove();
            this.calculateTotals();
        });

        this.productTable.appendChild(row);
    }

    calculateRowTotal(row) {
        const select = row.querySelector('select');
        const qty = parseInt(row.querySelector('input').value);
        const price = parseFloat(select.selectedOptions[0]?.dataset.price || 0);
        
        row.cells[2].textContent = formatCurrency(price);
        row.cells[3].textContent = formatCurrency(price * qty);
        
        this.calculateTotals();
    }

    calculateTotals() {
        let subtotal = 0;
        this.productTable.querySelectorAll('tr').forEach(row => {
            const total = row.cells[3]?.textContent;
            if (total) {
                subtotal += parseFloat(total.replace(/[^\d,]/g, '').replace(',', '.'));
            }
        });

        document.getElementById('subtotal').textContent = formatCurrency(subtotal);
        document.getElementById('total').textContent = formatCurrency(subtotal + 50);
    }

    async handleSubmit() {
        if (!this.validateForm()) return;

        const formData = new FormData(this.form);
        const orderData = {
            customer_id: this.customerId,
            items: this.getOrderItems(),
            delivery_date: formData.get('delivery_date'),
            delivery_time_slot: formData.get('delivery_time_slot'),
            recipient_name: formData.get('recipient_name'),
            recipient_phone: formData.get('recipient_phone'),
            card_message: formData.get('card_message'),
            payment_method: formData.get('payment_method')
        };

        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) throw new Error();

            showSuccess('Sipariş oluşturuldu');
            setTimeout(() => location.href = '/orders/list.html', 1500);
        } catch {
            showError('Sipariş oluşturulamadı');
        }
    }

    validateForm() {
        if (!this.customerId) {
            showError('Müşteri seçilmedi');
            return false;
        }

        if (!this.productTable.children.length) {
            showError('Ürün eklenmedi');
            return false;
        }

        return true;
    }

    getOrderItems() {
        return Array.from(this.productTable.children).map(row => ({
            product_id: row.querySelector('select').value,
            quantity: row.querySelector('input').value,
            unit_price: parseFloat(row.cells[2].textContent.replace(/[^\d,]/g, '').replace(',', '.'))
        }));
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.orderForm = new OrderForm();
});
