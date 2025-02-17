// Global state management
const orderState = {
    customer: null,
    delivery: {
        date: null,
        timeSlot: null,
        address: null,
        recipient: { name: '', phone: '' }
    },
    items: [],
    totals: {
        subtotal: 0,
        deliveryFee: 70,
        discount: 0,
        total: 0
    }
};

// Müşteri İşlemleri
async function searchCustomer(phone) {
    try {
        const response = await fetch(`${API_URL}/customers/phone/${phone}`);
        const data = await response.json();
        
        if (!data.customer) {
            document.querySelector('#customerForm [name="phone"]').value = phone;
            const modal = new bootstrap.Modal(document.getElementById('customerModal'));
            modal.show();
            return;
        }
        selectCustomer(data.customer);
    } catch (error) {
        showError('Müşteri araması başarısız');
    }
}

function selectCustomer(customer) {
    orderState.customer = customer;
    document.getElementById('customerInfo').innerHTML = `
        <div class="alert alert-success">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${customer.name}</strong><br>
                    <small>${formatPhoneNumber(customer.phone)}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="clearCustomer()">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        </div>
    `;
    loadCustomerAddresses(customer.id);
}

async function saveCustomer(form) {
    try {
        const formData = new FormData(form);
        const response = await fetch(`${API_URL}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(formData))
        });

        const customer = await response.json();
        bootstrap.Modal.getInstance(document.getElementById('customerModal')).hide();
        selectCustomer(customer);
        showSuccess('Müşteri kaydedildi');
    } catch (error) {
        showError('Müşteri kaydedilemedi');
    }
}

function clearCustomer() {
    orderState.customer = null;
    document.getElementById('customerInfo').innerHTML = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('addressList').innerHTML = '';
}

// Adres İşlemleri
async function searchAddress(query) {
    if (query.length < 3) return;

    try {
        const params = new URLSearchParams({
            apiKey: CONFIG.HERE_API_KEY,
            q: `${query}, İstanbul, Turkey`,
            limit: '5'
        });

        const response = await fetch(`https://geocode.search.hereapi.com/v1/geocode?${params}`);
        const data = await response.json();
        showAddressResults(data.items || []);
    } catch (error) {
        showError('Adres araması başarısız');
    }
}

async function loadCustomerAddresses(customerId) {
    try {
        const response = await fetch(`${API_URL}/customers/${customerId}/addresses`);
        const addresses = await response.json();
        showAddressResults(addresses, true);
    } catch (error) {
        console.error('Kayıtlı adresler yüklenemedi');
    }
}

function showAddressResults(items, isSaved = false) {
    const addressList = document.getElementById('addressList');
    
    if (!items.length) {
        if (!isSaved) addressList.innerHTML = '<div class="alert alert-info">Sonuç bulunamadı</div>';
        return;
    }

    addressList.innerHTML = items.map(item => `
        <div class="list-group-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${item.title || item.label}</strong><br>
                    <small class="text-muted">${item.address?.street || item.street}, ${item.address?.district || item.district}</small>
                </div>
                <button class="btn btn-sm btn-primary" onclick='selectAddress(${JSON.stringify(item)})'>
                    Seç
                </button>
            </div>
        </div>
    `).join('');
}

function selectAddress(item) {
    const address = {
        label: item.title || item.label,
        street: item.address?.street || item.street,
        district: item.address?.district || item.district,
        city: 'İstanbul',
        position: item.position,
        id: item.id || `new_${Date.now()}`
    };

    orderState.delivery.address = address;
    
    document.getElementById('selectedAddress').innerHTML = `
        <div class="alert alert-success">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${address.label}</strong><br>
                    <small>${[address.street, address.district, 'İstanbul'].filter(Boolean).join(', ')}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="clearAddress()">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        </div>
    `;

    document.getElementById('addressSearchInput').value = '';
    document.getElementById('addressList').innerHTML = '';
    updateTotals();
}

function clearAddress() {
    orderState.delivery.address = null;
    document.getElementById('selectedAddress').innerHTML = '';
    updateTotals();
}

// Ürün İşlemleri
async function searchProducts(query) {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        
        if (!products || products.length === 0) {
            document.getElementById('productList').innerHTML = '<div class="alert alert-info">Sonuç bulunamadı</div>';
            return;
        }

        const filteredProducts = products.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase())
        );

        document.getElementById('productList').innerHTML = filteredProducts.map(product => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${product.name}</strong>
                        <div class="text-muted small">Stok: ${product.stock}</div>
                    </div>
                    <div class="text-end">
                        <div class="mb-1">${formatCurrency(product.retail_price)}</div>
                        <button class="btn btn-sm btn-primary" onclick='addToCart(${JSON.stringify(product)})'>
                            <i class="bi bi-plus"></i> Ekle
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showError('Ürün araması başarısız');
    }
}

function addToCart(product) {
    const existing = orderState.items.find(item => item.id === product.id);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        orderState.items.push({
            id: product.id,
            name: product.name,
            price: product.retail_price,
            quantity: 1
        });
    }

    updateCart();
}

function removeFromCart(productId) {
    orderState.items = orderState.items.filter(item => item.id !== productId);
    updateCart();
}

function updateCart() {
    document.getElementById('cartItems').innerHTML = orderState.items.map(item => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <div>${item.name}</div>
                <small class="text-muted">${item.quantity}x ${formatCurrency(item.price)}</small>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${item.id})">
                <i class="bi bi-x"></i>
            </button>
        </div>
    `).join('') || '<div class="text-muted">Sepet boş</div>';

    updateTotals();
}

function updateTotals() {
    const subtotal = orderState.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0);

    orderState.totals = {
        subtotal,
        deliveryFee: orderState.delivery.address ? 70 : 0,
        total: subtotal + (orderState.delivery.address ? 70 : 0)
    };

    document.getElementById('subtotal').textContent = formatCurrency(orderState.totals.subtotal);
    document.getElementById('deliveryFee').textContent = formatCurrency(orderState.totals.deliveryFee);
    document.getElementById('total').textContent = formatCurrency(orderState.totals.total);
    document.getElementById('orderTotal').textContent = formatCurrency(orderState.totals.total);
}

// Sipariş Kaydetme
async function saveOrder() {
    if (!validateOrder()) return;

    try {
        const orderData = {
            customer_id: orderState.customer.id,
            delivery_date: document.getElementById('deliveryDate').value,
            delivery_time_slot: document.getElementById('deliveryTimeSlot').value,
            delivery_address_id: orderState.delivery.address.id,
            delivery_type: 'recipient',
            recipient_name: document.getElementById('recipientName').value,
            recipient_phone: document.getElementById('recipientPhone').value,
            recipient_note: document.getElementById('deliveryNote').value,
            card_message: document.getElementById('cardMessage').value,
            status: 'new',
            payment_method: document.getElementById('paymentMethod').value,
            payment_status: 'pending',
            total_amount: orderState.totals.total,
            subtotal: orderState.totals.subtotal,
            delivery_fee: orderState.totals.deliveryFee,
            items: orderState.items.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.price
            }))
        };

        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Sipariş kaydedilemedi');

        showSuccess('Sipariş başarıyla oluşturuldu');
        setTimeout(() => window.location.href = '/orders', 1500);
    } catch (error) {
        showError(error.message || 'Sipariş kaydedilemedi');
    }
}

function validateOrder() {
    if (!orderState.customer) {
        showError('Lütfen müşteri seçin');
        return false;
    }

    if (!document.getElementById('deliveryDate').value || 
        !document.getElementById('deliveryTimeSlot').value) {
        showError('Lütfen teslimat tarih ve saatini seçin');
        return false;
    }

    if (!orderState.delivery.address) {
        showError('Lütfen teslimat adresi seçin');
        return false;
    }

    if (!document.getElementById('recipientName').value || 
        !document.getElementById('recipientPhone').value) {
        showError('Lütfen alıcı bilgilerini girin');
        return false;
    }

    if (!orderState.items.length) {
        showError('Lütfen en az bir ürün ekleyin');
        return false;
    }

    return true;
}

// Sayfa Yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Tarih alanını bugün ile sınırla
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('deliveryDate').min = today;

    // Event Listeners
    document.getElementById('customerPhone').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchCustomer(e.target.value);
    });

    document.getElementById('searchCustomerBtn').addEventListener('click', () => 
        searchCustomer(document.getElementById('customerPhone').value));

    let timeout;
    document.getElementById('addressSearchInput').addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => searchAddress(e.target.value), 500);
    });

    document.getElementById('productSearch').addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => searchProducts(e.target.value), 300);
    });
});
