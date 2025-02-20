let customerModal, detailsModal, editModal;
let currentCustomerId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadCustomers();
});

async function loadCustomers() {
    const response = await fetch(`${API_URL}/customers`);
    try {
        if (!response.ok) throw new Error('API Hatası');
        const customers = await response.json();

        const tbody = document.querySelector('#customersTable tbody');
        
        if (customers.length > 0) {
            tbody.innerHTML = customers.map(customer => `
                <tr>
                    <td>${customer.name}</td>
                    <td>${formatPhoneNumber(customer.phone)}</td>
                    <td>${customer.email || '-'}</td>
                    <td>${customer.address}</td>
                    <td>${customer.last_order ? formatDate(customer.last_order) : 'Sipariş yok'}</td>
                    <td>${customer.total_orders || 0}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="showCustomerDetails(${customer.id})">
                            <i class="bi bi-person-lines-fill"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning me-1" onclick="editCustomer(${customer.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="window.location.href='/orders/new?customer=${customer.id}'">
                            <i class="bi bi-plus-lg"></i> Sipariş
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Müşteri bulunamadı</td></tr>';
        }
    } catch (error) {
        console.error('Müşteriler yüklenirken hata:', error);
        showError('Müşteriler yüklenemedi!');
    }
}

async function searchCustomer() {
    const response = await fetch(`${API_URL}/customers/phone/${phone}`);
    try {
        if (!response.ok) throw new Error('API Hatası');
        const customer = await response.json();
        // ...existing code...
    } catch (error) {
        console.error('Müşteri aranırken hata:', error);
        showError('Müşteri bulunamadı!');
    }
}

function toggleCompanyFields(customerType) {
    const companyFields = document.getElementById('companyFields');
    companyFields.style.display = customerType === 'corporate' ? 'block' : 'none';
    
    // Kurumsal seçildiğinde firma alanlarını zorunlu yap
    const companyName = document.querySelector('input[name="company_name"]');
    const taxNumber = document.querySelector('input[name="tax_number"]');
    
    if (customerType === 'corporate') {
        companyName.setAttribute('required', '');
        taxNumber.setAttribute('required', '');
    } else {
        companyName.removeAttribute('required');
        taxNumber.removeAttribute('required');
    }
}

async function saveCustomer() {
    const form = document.getElementById('addCustomerForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Boş alanları temizle
    Object.keys(data).forEach(key => {
        if (!data[key]) delete data[key];
    });

    try {
        const response = await fetch(`${API_URL}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Müşteri kaydedilemedi');
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
        modal.hide();
        await loadCustomers();
        showSuccess('Müşteri başarıyla eklendi');
        form.reset();
    } catch (error) {
        console.error('Kayıt hatası:', error);
        showError(error.message);
    }
}

async function showCustomerDetails(customerId) {
    try {
        detailsModal = new bootstrap.Modal(document.getElementById('customerDetailsModal'));
        
        // Paralel API çağrıları
        const [customerResponse, ordersResponse] = await Promise.all([
            fetch(`${API_URL}/customers/${customerId}`),
            fetch(`${API_URL}/customers/${customerId}/orders`)
        ]);

        if (!customerResponse.ok || !ordersResponse.ok) {
            throw new Error('API Hatası');
        }

        const customer = await customerResponse.json();
        const ordersData = await ordersResponse.json();
        
        // API yanıtı yapısını kontrol et ve orders dizisini al
        const orders = ordersData.orders || []; // API'den gelen orders array'i

        // Müşteri detaylarını doldur
        document.getElementById('detail-name').textContent = customer.name;
        document.getElementById('detail-phone').textContent = formatPhoneNumber(customer.phone);
        document.getElementById('detail-email').textContent = customer.email || '-';
        document.getElementById('detail-address').textContent = customer.address || '-';
        document.getElementById('detail-total-orders').textContent = customer.total_orders || 0;
        document.getElementById('detail-last-order').textContent = 
            customer.last_order ? formatDate(customer.last_order) : '-';
        document.getElementById('detail-total-spent').textContent = 
            formatCurrency(customer.total_spent || 0);

        // Sipariş listesini doldur
        const ordersTable = document.getElementById('customerOrdersTable');
        if (orders && orders.length > 0) {
            ordersTable.innerHTML = orders.map(order => `
                <tr>
                    <td>${formatDate(order.created_at)}</td>
                    <td>${order.items || '-'}</td>
                    <td>${formatCurrency(order.total_amount)}</td>
                    <td>${getStatusBadge(order.status)}</td>
                </tr>
            `).join('');
        } else {
            ordersTable.innerHTML = '<tr><td colspan="4" class="text-center">Sipariş bulunamadı</td></tr>';
        }

        detailsModal.show();
    } catch (error) {
        console.error('Müşteri detayları yüklenirken hata:', error);
        showError('Müşteri detayları yüklenemedi!');
    }
}

function toggleEditCompanyFields(customerType) {
    const companyFields = document.getElementById('editCompanyFields');
    companyFields.style.display = customerType === 'corporate' ? 'block' : 'none';
    
    const companyName = document.querySelector('#editCustomerForm input[name="company_name"]');
    const taxNumber = document.querySelector('#editCustomerForm input[name="tax_number"]');
    
    if (customerType === 'corporate') {
        companyName.setAttribute('required', '');
        taxNumber.setAttribute('required', '');
    } else {
        companyName.removeAttribute('required');
        taxNumber.removeAttribute('required');
    }
}

async function editCustomer(customerId) {
    try {
        editModal = new bootstrap.Modal(document.getElementById('editCustomerModal'));
        
        const response = await fetch(`${API_URL}/customers/${customerId}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const customer = await response.json();
        const form = document.getElementById('editCustomerForm');
        
        // Form alanlarını doldur
        form.elements['id'].value = customer.id;
        form.elements['customer_type'].value = customer.customer_type || 'retail';
        form.elements['name'].value = customer.name;
        form.elements['phone'].value = customer.phone;
        form.elements['email'].value = customer.email || '';
        form.elements['address'].value = customer.address || '';
        form.elements['city'].value = customer.city || '';
        form.elements['district'].value = customer.district || '';
        form.elements['company_name'].value = customer.company_name || '';
        form.elements['tax_number'].value = customer.tax_number || '';
        form.elements['special_dates'].value = customer.special_dates || '';
        form.elements['notes'].value = customer.notes || '';

        // Kurumsal alanları göster/gizle
        toggleEditCompanyFields(customer.customer_type);
        
        editModal.show();
    } catch (error) {
        console.error('Müşteri bilgileri yüklenirken hata:', error);
        showError('Müşteri bilgileri yüklenemedi!');
    }
}

async function updateCustomer() {
    const form = document.getElementById('editCustomerForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const customerId = formData.get('id');
    const data = Object.fromEntries(formData);
    
    // Boş alanları temizle
    Object.keys(data).forEach(key => {
        if (!data[key]) delete data[key];
    });

    try {
        const response = await fetch(`${API_URL}/customers/${customerId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');

        editModal.hide();
        await loadCustomers();
        showSuccess('Müşteri başarıyla güncellendi!');
    } catch (error) {
        console.error('Müşteri güncellenirken hata:', error);
        showError('Müşteri güncellenemedi!');
    }
}

function showAddCustomerModal() {
    const modal = new bootstrap.Modal(document.getElementById('addCustomerModal'));
    document.getElementById('addCustomerForm').reset();
    modal.show();
}

// Helper fonksiyonlar
function showError(message) {
    const toast = `
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div class="toast align-items-center text-bg-danger border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-x-circle"></i> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toast);
    const toastEl = document.querySelector('.toast');
    const bsToast = new bootstrap.Toast(toastEl);
    bsToast.show();
}

function showSuccess(message) {
    const toast = `
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div class="toast align-items-center text-bg-success border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-check-circle"></i> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toast);
    const toastEl = document.querySelector('.toast');
    const bsToast = new bootstrap.Toast(toastEl);
    bsToast.show();
}
