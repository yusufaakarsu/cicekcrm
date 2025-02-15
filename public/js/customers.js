document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadCustomers();
});

let customerModal, detailsModal, editModal;
let currentCustomerId = null;
let orderDetailModal, editOrderModal;

async function loadCustomers() {
    try {
        const response = await fetch(`${API_URL}/customers`);
        if (!response.ok) throw new Error('API Hatası');
        const customers = await response.json();

        const tbody = document.querySelector('#customersTable tbody');
        
        if (customers.length > 0) {
            tbody.innerHTML = customers.map(customer => `
                <tr>
                    <td>${customer.name}</td>
                    <td>${customer.phone}</td>
                    <td>${customer.email || '-'}</td>
                    <td>${customer.address}</td>
                    <td>${customer.last_order ? formatDate(customer.last_order) : 'Sipariş yok'}</td>
                    <td>${customer.total_orders || 0}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="showCustomerDetails('${customer.id}')">
                            <i class="bi bi-person-lines-fill"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning me-1" onclick="editCustomer('${customer.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="newOrder('${customer.id}')">
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

function showAddCustomerModal() {
    customerModal = new bootstrap.Modal(document.getElementById('addCustomerModal'));
    document.getElementById('addCustomerForm').reset();
    customerModal.show();
}

async function saveCustomer() {
    const form = document.getElementById('addCustomerForm');
    const formData = new FormData(form);
    
    try {
        const response = await fetch(`${API_URL}/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(Object.fromEntries(formData))
        });

        if (!response.ok) throw new Error('API Hatası');

        customerModal.hide();
        loadCustomers();
        showSuccess('Müşteri başarıyla eklendi!');
    } catch (error) {
        console.error('Müşteri eklenirken hata:', error);
        showError('Müşteri eklenemedi!');
    }
}

async function showCustomerDetails(customerId) {
    currentCustomerId = customerId;
    detailsModal = new bootstrap.Modal(document.getElementById('customerDetailsModal'));
    
    try {
        const [customerResponse, ordersResponse] = await Promise.all([
            fetch(`${API_URL}/customers/${customerId}`),
            fetch(`${API_URL}/customers/${customerId}/orders`)
        ]);

        if (!customerResponse.ok || !ordersResponse.ok) throw new Error('API Hatası');
        
        const customer = await customerResponse.json();
        const orders = await ordersResponse.json();

        // Müşteri detaylarını doldur
        document.getElementById('detail-name').textContent = customer.name;
        document.getElementById('detail-phone').textContent = customer.phone;
        document.getElementById('detail-email').textContent = customer.email || '-';
        document.getElementById('detail-address').textContent = customer.address;
        document.getElementById('detail-total-orders').textContent = customer.total_orders || 0;
        document.getElementById('detail-last-order').textContent = customer.last_order ? formatDate(customer.last_order) : '-';
        document.getElementById('detail-total-spent').textContent = formatCurrency(customer.total_spent || 0);

        // Siparişleri listele
        const tbody = document.getElementById('customerOrdersTable');
        if (orders && orders.length > 0) {
            tbody.innerHTML = orders.map(order => `
                <tr>
                    <td>${formatDate(order.created_at)}</td>
                    <td>${order.items || '-'}</td>
                    <td>${formatCurrency(order.total_amount)}</td>
                    <td>${getStatusBadge(order.status)}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Sipariş bulunamadı</td></tr>';
        }

        detailsModal.show();
    } catch (error) {
        console.error('Müşteri detayları yüklenirken hata:', error);
        showError('Müşteri detayları yüklenemedi!');
    }
}

async function editCustomer(customerId) {
    currentCustomerId = customerId;
    editModal = new bootstrap.Modal(document.getElementById('editCustomerModal'));
    
    try {
        const response = await fetch(`${API_URL}/customers/${customerId}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const customer = await response.json();
        const form = document.getElementById('editCustomerForm');
        
        form.elements['id'].value = customer.id;
        form.elements['name'].value = customer.name;
        form.elements['phone'].value = customer.phone;
        form.elements['email'].value = customer.email || '';
        form.elements['address'].value = customer.address;

        editModal.show();
    } catch (error) {
        console.error('Müşteri bilgileri yüklenirken hata:', error);
        showError('Müşteri bilgileri yüklenemedi!');
    }
}

async function updateCustomer() {
    const form = document.getElementById('editCustomerForm');
    const formData = new FormData(form);
    const customerId = formData.get('id');
    
    try {
        const response = await fetch(`${API_URL}/customers/${customerId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(Object.fromEntries(formData))
        });

        if (!response.ok) throw new Error('API Hatası');

        editModal.hide();
        loadCustomers();
        showSuccess('Müşteri başarıyla güncellendi!');
    } catch (error) {
        console.error('Müşteri güncellenirken hata:', error);
        showError('Müşteri güncellenemedi!');
    }
}

async function showOrderDetails(orderId) {
    orderDetailModal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
    
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`);
        if (!response.ok) throw new Error('API Hatası');
        const order = await response.json();
        
        document.getElementById('order-detail-id').textContent = order.id;
        document.getElementById('order-detail-customer').textContent = order.customer_name;
        document.getElementById('order-detail-delivery').textContent = formatDate(order.delivery_date);
        document.getElementById('order-detail-address').textContent = order.delivery_address;
        document.getElementById('order-detail-amount').textContent = formatCurrency(order.total_amount);
        document.getElementById('order-detail-status').innerHTML = getStatusBadge(order.status);
        document.getElementById('order-detail-items').innerHTML = order.items
            .map(item => `${item.quantity}x ${item.name} (${formatCurrency(item.price)})`).join('<br>');

        orderDetailModal.show();
    } catch (error) {
        console.error('Sipariş detayları yüklenirken hata:', error);
        showError('Sipariş detayları yüklenemedi!');
    }
}

async function editOrder(orderId) {
    editOrderModal = new bootstrap.Modal(document.getElementById('editOrderModal'));
    
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`);
        if (!response.ok) throw new Error('API Hatası');
        const order = await response.json();
        
        const form = document.getElementById('editOrderForm');
        form.elements['id'].value = order.id;
        form.elements['delivery_date'].value = order.delivery_date.slice(0, 16);
        form.elements['delivery_address'].value = order.delivery_address;
        form.elements['status'].value = order.status;

        editOrderModal.show();
    } catch (error) {
        console.error('Sipariş bilgileri yüklenirken hata:', error);
        showError('Sipariş bilgileri yüklenemedi!');
    }
}

async function updateOrder() {
    const form = document.getElementById('editOrderForm');
    const formData = new FormData(form);
    const orderId = formData.get('id');
    
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(Object.fromEntries(formData))
        });

        if (!response.ok) throw new Error('API Hatası');

        editOrderModal.hide();
        await loadCustomers(); // Listeyi yenile
        showSuccess('Sipariş başarıyla güncellendi!');
    } catch (error) {
        console.error('Sipariş güncellenirken hata:', error);
        showError('Sipariş güncellenemedi!');
    }
}

// Toast bildirimleri için daha şık bir görünüm
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

function newOrder(customerId) {
    // Yeni sipariş sayfasına yönlendir - URL'i düzelt
    window.location.href = `/orders/new.html?customer=${customerId}`;
}
