let customerModal;

document.addEventListener('DOMContentLoaded', () => {
    customerModal = new bootstrap.Modal(document.getElementById('customerModal'));
    loadCustomers();
});

async function loadCustomers() {
    try {
        showLoading(document.getElementById('customerList'));
        const customers = await fetchAPI('/customers');
        renderCustomers(customers);
    } catch (error) {
        console.error('Müşteriler yüklenemedi:', error);
    } finally {
        hideLoading(document.getElementById('customerList'));
    }
}

function renderCustomers(customers) {
    const tbody = document.getElementById('customerList');
    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>${customer.name}</td>
            <td>${customer.phone}</td>
            <td>${customer.email || '-'}</td>
            <td>${customer.address || '-'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editCustomer('${customer.id}')">Düzenle</button>
                <button class="btn btn-sm btn-outline-secondary" onclick="viewOrders('${customer.id}')">Siparişler</button>
            </td>
        </tr>
    `).join('');
}

async function saveCustomer() {
    const form = document.getElementById('customerForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_URL}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Müşteri kaydedilemedi');

        customerModal.hide();
        loadCustomers();
    } catch (error) {
        console.error('Kayıt hatası:', error);
    }
}
