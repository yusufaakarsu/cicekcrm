document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadOrders();
    
    // Modal olaylarını dinle
    const orderDetailModal = document.getElementById('orderDetailModal');
    
    // Modal açılırken
    orderDetailModal.addEventListener('show.bs.modal', () => {
        // Butonların erişilebilirliğini etkinleştir
        orderDetailModal.querySelectorAll('.status-btn').forEach(btn => {
            btn.setAttribute('tabindex', '0');
        });
    });
    
    // Modal kapanırken
    orderDetailModal.addEventListener('hide.bs.modal', () => {
        // Butonların erişilebilirliğini devre dışı bırak
        orderDetailModal.querySelectorAll('.status-btn').forEach(btn => {
            btn.setAttribute('tabindex', '-1');
        });
    });
    
    // Durum butonları için event listener
    document.addEventListener('click', (e) => {
        if (e.target.closest('.status-btn')) {
            const button = e.target.closest('.status-btn');
            const status = button.dataset.status;
            updateOrderStatus(status);
        }
    });

    // Modal açıldığında inert attribute'unu kaldır
    orderDetailModal.addEventListener('shown.bs.modal', () => {
        const buttonGroup = orderDetailModal.querySelector('.btn-group');
        if (buttonGroup.hasAttribute('inert')) {
            buttonGroup.removeAttribute('inert');
        }
    });
});

// Teslimat zaman dilimini formatlayan fonksiyon
function formatTimeSlot(slot) {
    const slots = {
        'morning': 'Sabah (09:00-12:00)',
        'afternoon': 'Öğlen (12:00-17:00)',
        'evening': 'Akşam (17:00-21:00)'
    };
    return slots[slot] || slot;
}

async function loadOrders() {
    try {
        const response = await fetch(`${API_URL}/orders`);
        if (!response.ok) throw new Error('API Hatası');
        const orders = await response.json();
        
        const tbody = document.getElementById('ordersTable');
        if (!tbody) {
            console.error('Tablo tbody elemanı bulunamadı');
            return;
        }
        
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>
                    <div>${formatDate(order.created_at)}</div>
                    <small class="text-muted">
                        Teslimat: ${formatDate(order.delivery_date)}<br>
                        ${formatDeliveryTime(order.delivery_time_slot)}
                    </small>
                </td>
                <td>
                    <div>${order.customer_name || '-'}</div>
                    <small class="text-muted">${order.customer_phone || ''}</small>
                </td>
                <td>
                    <div class="text-wrap" style="max-width: 200px;">
                        ${order.delivery_address || '-'}
                        <small class="d-block text-muted">${order.delivery_notes || ''}</small>
                    </div>
                </td>
                <td>
                    <div>${order.recipient_name || '-'}</div>
                    <small class="text-muted">${order.recipient_phone || ''}</small>
                    ${order.card_message ? `<small class="d-block text-info">"${order.card_message}"</small>` : ''}
                </td>
                <td>
                    <div class="text-wrap" style="max-width: 150px;">
                        ${order.items_list ? order.items_list.split(',').map(item => 
                            `<div>${item.trim()}</div>`
                        ).join('') : '-'}
                    </div>
                </td>
                <td>
                    <div class="mb-1">${getStatusBadge(order.status)}</div>
                    <div>${getPaymentStatusBadge(order.payment_status)}</div>
                </td>
                <td>
                    <div class="fw-bold">${formatCurrency(order.total_amount)}</div>
                    <div>${getPaymentStatusBadge(order.payment_status)}</div>
                    <small class="text-muted">${formatPaymentMethod(order.payment_method)}</small>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info" onclick="showOrderDetails('${order.id}')" title="Detay">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-primary" onclick="editOrder('${order.id}')" title="Düzenle">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Siparişler yüklenirken hata:', error);
        showToast('Siparişler yüklenemedi');
    }
}

// Toast mesajı göster
function showToast(message, type = 'error') {
    const toast = `
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div class="toast align-items-center text-bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-${type === 'error' ? 'x-circle' : 'check-circle'}"></i> ${message}
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

// Sipariş detayları modalı
async function showOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/details`);
        if (!response.ok) throw new Error('API Hatası');
        const order = await response.json();
        
        // Tüm detay alanlarını doldur
        Object.keys(order).forEach(key => {
            const element = document.getElementById(`order-detail-${key}`);
            if (element) {
                switch(key) {
                    case 'status':
                        element.innerHTML = getStatusBadge(order[key]);
                        break;
                    case 'payment_status':
                        element.innerHTML = getPaymentStatusBadge(order[key]);
                        break;
                    case 'total_amount':
                        element.textContent = formatCurrency(order[key]);
                        break;
                    case 'payment_method':
                        element.textContent = formatPaymentMethod(order[key]);
                        break;
                    case 'items_list':
                        element.innerHTML = order[key] ? order[key].split(',').map(item => 
                            `<div class="list-group-item">${item.trim()}</div>`
                        ).join('') : '-';
                        break;
                    default:
                        element.textContent = order[key] || '-';
                }
            }
        });

        // Tarih ve saat bilgisini ayrı göster
        document.getElementById('order-detail-delivery_date').textContent = 
            `${formatDate(order.delivery_date)} - ${formatTimeSlot(order.delivery_time_slot)}`;

        // Durum butonlarını aktif/pasif yap
        updateStatusButtons(order.status);

        // Modal göster
        const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
        modal.show();
    } catch (error) {
        showToast('Sipariş detayları yüklenemedi', 'error');
    }
}

// Sipariş düzenleme fonksiyonu ekle
async function editOrder(orderId) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/details`);
        if (!response.ok) throw new Error('API Hatası');
        const order = await response.json();

        // Form elemanlarını doldur
        const form = document.getElementById('editOrderForm');
        form.querySelector('[name="id"]').value = order.id;
        form.querySelector('[name="delivery_date"]').value = formatDateForInput(order.delivery_date);
        form.querySelector('[name="delivery_address"]').value = order.delivery_address;
        form.querySelector('[name="status"]').value = order.status;

        // Modalı göster
        const modal = new bootstrap.Modal(document.getElementById('editOrderModal'));
        modal.show();
    } catch (error) {
        showToast('Sipariş bilgileri yüklenemedi', 'error');
    }
}

// Form gönderme işlemi
async function updateOrder() {
    const form = document.getElementById('editOrderForm');
    const orderId = form.querySelector('[name="id"]').value;
    
    try {
        const formData = {
            delivery_date: form.querySelector('[name="delivery_date"]').value,
            delivery_address: form.querySelector('[name="delivery_address"]').value,
            status: form.querySelector('[name="status"]').value
        };

        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Güncelleme başarısız');

        // Modalı kapat
        bootstrap.Modal.getInstance(document.getElementById('editOrderModal')).hide();
        
        // Tabloyu yenile
        loadOrders();
        
        // Başarı mesajı göster
        showToast('Sipariş başarıyla güncellendi', 'success');
    } catch (error) {
        showToast('Sipariş güncellenirken hata oluştu', 'error');
    }
}

// Input için tarih formatı
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // "YYYY-MM-DDThh:mm" formatı
}

// Durum badge'leri için yardımcı fonksiyonlar
function getStatusBadge(status) {
    const statusMap = {
        new: ['Yeni', 'warning'],
        preparing: ['Hazırlanıyor', 'info'],
        ready: ['Hazır', 'info'],
        delivering: ['Yolda', 'primary'],
        delivered: ['Teslim Edildi', 'success'],
        cancelled: ['İptal', 'danger']
    };
    
    const [text, color] = statusMap[status] || ['Bilinmiyor', 'secondary'];
    return `<span class="badge bg-${color}">${text}</span>`;
}

function getPaymentStatusBadge(status) {
    const statusMap = {
        paid: ['Ödendi', 'success'],
        pending: ['Bekliyor', 'warning'],
        cancelled: ['İptal', 'danger']
    };
    
    const [text, color] = statusMap[status] || ['Bilinmiyor', 'secondary'];
    return `<span class="badge bg-${color}">${text}</span>`;
}

// Sipariş durumu güncelle
async function updateOrderStatus(status) {
    const orderId = document.getElementById('order-detail-id').textContent;
    
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) throw new Error('Güncelleme başarısız');

        // Modal ve tablo badge'lerini güncelle
        document.getElementById('order-detail-status').innerHTML = getStatusBadge(status);
        
        // Durum butonlarını güncelle
        updateStatusButtons(status);
        
        // Tabloyu yenile
        await loadOrders();
        
        showToast('Sipariş durumu güncellendi', 'success');
    } catch (error) {
        showToast('Durum güncellenirken hata oluştu', 'error');
    }
}

// Durum butonlarının aktif/pasif durumunu güncelle
function updateStatusButtons(currentStatus) {
    const statusFlow = ['new', 'preparing', 'ready', 'delivering', 'delivered'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    
    // Tüm durum butonlarını bul
    document.querySelectorAll('.status-btn').forEach(button => {
        const status = button.dataset.status;
        const statusIndex = statusFlow.indexOf(status);
        
        // Önce tüm class ve attributeleri temizle
        button.className = 'btn status-btn';
        button.removeAttribute('disabled');
        
        // Duruma göre stil uygula
        if (status === currentStatus) {
            button.classList.add('btn-' + getButtonStyle(status), 'active');
            button.setAttribute('disabled', 'true');
        } else if (statusIndex === currentIndex + 1) {
            button.classList.add('btn-outline-' + getButtonStyle(status));
        } else {
            button.classList.add('btn-outline-' + getButtonStyle(status));
            button.setAttribute('disabled', 'true');
        }
    });
}

// Buton stillerini belirle
function getButtonStyle(status) {
    const styles = {
        'preparing': 'warning',
        'ready': 'info',
        'delivering': 'primary',
        'delivered': 'success'
    };
    return styles[status] || 'secondary';
}

// Yeni sipariş modalını göster
function showNewOrderModal() {
    loadCustomers(); // Müşteri listesini yükle
    clearNewOrderForm(); // Formu temizle
    const modal = new bootstrap.Modal(document.getElementById('newOrderModal'));
    modal.show();
}

// Müşterileri yükle
async function loadCustomers() {
    try {
        const response = await fetch(`${API_URL}/customers`);
        if (!response.ok) throw new Error('API Hatası');
        const customers = await response.json();
        
        const select = document.querySelector('[name="customer_id"]');
        select.innerHTML = `
            <option value="">Müşteri Seçin</option>
            ${customers.map(customer => `
                <option value="${customer.id}">${customer.name} (${customer.phone})</option>
            `).join('')}
        `;
    } catch (error) {
        showToast('Müşteriler yüklenemedi', 'error');
    }
}

// Ürün satırı ekle
function addOrderItem() {
    const itemsContainer = document.getElementById('orderItems');
    const itemId = Date.now(); // Unique ID
    
    const itemHtml = `
        <div class="row mb-2 order-item" data-id="${itemId}">
            <div class="col-5">
                <select class="form-select form-select-sm" name="product_id" required onchange="updatePrice(${itemId})">
                    <option value="">Ürün Seçin</option>
                    <!-- Ürünler JavaScript ile doldurulacak -->
                </select>
            </div>
            <div class="col-2">
                <input type="number" class="form-control form-control-sm" name="quantity" 
                       value="1" min="1" required onchange="updatePrice(${itemId})">
            </div>
            <div class="col-3">
                <input type="text" class="form-control form-control-sm" name="price" readonly>
            </div>
            <div class="col-2">
                <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeOrderItem(${itemId})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    itemsContainer.insertAdjacentHTML('beforeend', itemHtml);
    loadProducts(itemId); // Ürünleri yükle
}

// Ürün satırını kaldır
function removeOrderItem(itemId) {
    document.querySelector(`.order-item[data-id="${itemId}"]`).remove();
    calculateTotals();
}

// Ürünleri yükle
async function loadProducts(itemId) {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('API Hatası');
        const products = await response.json();
        
        const select = document.querySelector(`.order-item[data-id="${itemId}"] [name="product_id"]`);
        select.innerHTML = `
            <option value="">Ürün Seçin</option>
            ${products.map(product => `
                <option value="${product.id}" data-price="${product.retail_price}">
                    ${product.name} - ${formatCurrency(product.retail_price)}
                </option>
            `).join('')}
        `;
    } catch (error) {
        showToast('Ürünler yüklenemedi', 'error');
    }
}

// Fiyatları güncelle
function updatePrice(itemId) {
    const item = document.querySelector(`.order-item[data-id="${itemId}"]`);
    const select = item.querySelector('[name="product_id"]');
    const quantity = parseInt(item.querySelector('[name="quantity"]').value) || 0;
    
    if (select.value) {
        const price = parseFloat(select.options[select.selectedIndex].dataset.price);
        item.querySelector('[name="price"]').value = formatCurrency(price * quantity);
    }
    
    calculateTotals();
}

// Toplamları hesapla
function calculateTotals() {
    let subtotal = 0;
    document.querySelectorAll('.order-item').forEach(item => {
        const select = item.querySelector('[name="product_id"]');
        const quantity = parseInt(item.querySelector('[name="quantity"]').value) || 0;
        
        if (select.value) {
            const price = parseFloat(select.options[select.selectedIndex].dataset.price);
            subtotal += price * quantity;
        }
    });
    
    const deliveryFee = 50; // Sabit teslimat ücreti
    const total = subtotal + deliveryFee;
    
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('deliveryFee').textContent = formatCurrency(deliveryFee);
    document.getElementById('totalAmount').textContent = formatCurrency(total);
}

// Formu temizle
function clearNewOrderForm() {
    document.getElementById('newOrderForm').reset();
    document.getElementById('orderItems').innerHTML = '';
    addOrderItem(); // İlk ürün satırını ekle
    calculateTotals();
}

// Telefon numarasına göre müşteri ara
async function searchCustomer() {
    const phoneInput = document.querySelector('[name="customer_phone"]');
    const phone = phoneInput.value.replace(/\D/g, ''); // Sadece rakamları al
    
    if (phone.length !== 10) {
        showToast('Geçerli bir telefon numarası girin', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/customers/search/phone/${phone}`);
        if (!response.ok) throw new Error('API Hatası');
        const customer = await response.json();
        
        const customerDetails = document.getElementById('customerDetails');
        customerDetails.classList.remove('d-none');
        
        if (customer.found === false) {
            // Yeni müşteri formu - tüm alanları temizle
            document.querySelector('[name="customer_id"]').value = '';
            document.querySelector('[name="customer_name"]').value = '';
            document.querySelector('[name="customer_email"]').value = '';
            document.querySelector('[name="customer_address"]').value = '';
            document.querySelector('[name="customer_city"]').value = '';
            document.querySelector('[name="customer_district"]').value = '';
            document.querySelector('[name="customer_type"]').value = 'retail';
            document.querySelector('[name="company_name"]').value = '';
            document.querySelector('[name="tax_number"]').value = '';
            document.querySelector('[name="special_dates"]').value = '';
            document.querySelector('[name="customer_notes"]').value = '';
            
            // Form alanlarını düzenlenebilir yap
            const inputs = customerDetails.querySelectorAll('input, textarea, select');
            inputs.forEach(input => input.removeAttribute('readonly'));
            
            // Kurumsal alanları gizle
            document.getElementById('companyFields').classList.add('d-none');
        } else {
            // Mevcut müşteri bilgilerini doldur
            document.querySelector('[name="customer_id"]').value = customer.id;
            document.querySelector('[name="customer_name"]').value = customer.name;
            document.querySelector('[name="customer_email"]').value = customer.email || '';
            document.querySelector('[name="customer_address"]').value = customer.address || '';
            document.querySelector('[name="customer_city"]').value = customer.city || '';
            document.querySelector('[name="customer_district"]').value = customer.district || '';
            document.querySelector('[name="customer_type"]').value = customer.customer_type;
            document.querySelector('[name="company_name"]').value = customer.company_name || '';
            document.querySelector('[name="tax_number"]').value = customer.tax_number || '';
            document.querySelector('[name="special_dates"]').value = customer.special_dates || '';
            document.querySelector('[name="customer_notes"]').value = customer.notes || '';
            
            // Form alanlarını salt okunur yap
            const inputs = customerDetails.querySelectorAll('input, textarea, select');
            inputs.forEach(input => input.setAttribute('readonly', true));
            
            // Kurumsal alanları göster/gizle
            if (customer.customer_type === 'corporate') {
                document.getElementById('companyFields').classList.remove('d-none');
            }
        }
    } catch (error) {
        showToast('Müşteri araması başarısız', 'error');
    }
}

// Siparişi kaydet
async function saveOrder() {
    const form = document.getElementById('newOrderForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    try {
        let customerId = form.querySelector('[name="customer_id"]').value;
        
        // Eğer müşteri ID yoksa önce müşteriyi kaydet
        if (!customerId) {
            const customerData = {
                name: form.querySelector('[name="customer_name"]').value,
                phone: form.querySelector('[name="customer_phone"]').value,
                email: form.querySelector('[name="customer_email"]').value,
                address: form.querySelector('[name="customer_address"]').value,
                city: form.querySelector('[name="customer_city"]').value,
                district: form.querySelector('[name="customer_district"]').value,
                customer_type: form.querySelector('[name="customer_type"]').value,
                company_name: form.querySelector('[name="company_name"]')?.value || null,
                tax_number: form.querySelector('[name="tax_number"]')?.value || null,
                special_dates: form.querySelector('[name="special_dates"]').value,
                notes: form.querySelector('[name="customer_notes"]').value
            };
            
            const customerResponse = await fetch(`${API_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customerData)
            });
            
            const customerResult = await customerResponse.json();
            
            if (customerResponse.ok) {
                customerId = customerResult.id;
            } else if (customerResult.id) {
                // Telefon numarası zaten kayıtlı
                customerId = customerResult.id;
            } else {
                throw new Error('Müşteri kaydedilemedi');
            }
        }

        // Sipariş verilerini hazırla
        const orderData = {
            customer_id: customerId,
            recipient_name: form.querySelector('[name="recipient_name"]').value,
            recipient_phone: form.querySelector('[name="recipient_phone"]').value,
            delivery_address: form.querySelector('[name="delivery_address"]').value,
            recipient_note: form.querySelector('[name="recipient_note"]').value,
            delivery_date: form.querySelector('[name="delivery_date"]').value,
            delivery_time_slot: form.querySelector('[name="delivery_time_slot"]').value,
            card_message: form.querySelector('[name="card_message"]').value,
            payment_method: form.querySelector('[name="payment_method"]').value,
            items: Array.from(document.querySelectorAll('.order-item')).map(item => ({
                product_id: item.querySelector('[name="product_id"]').value,
                quantity: parseInt(item.querySelector('[name="quantity"]').value)
            })).filter(item => item.product_id && item.quantity)
        };

        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) throw new Error('Kayıt başarısız');

        // Modal kapatma yerine yönlendirme yap
        window.location.href = '/orders/index.html';
        showToast('Sipariş başarıyla oluşturuldu', 'success');
    } catch (error) {
        showToast('Sipariş oluşturulurken hata oluştu', 'error');
    }
}

// Kurumsal alanları göster/gizle
function toggleCompanyFields() {
    const customerType = document.querySelector('[name="customer_type"]').value;
    const companyFields = document.getElementById('companyFields');
    
    if (customerType === 'corporate') {
        companyFields.classList.remove('d-none');
    } else {
        companyFields.classList.add('d-none');
    }
}

// Telefon ile müşteri ara ve form alanlarını ayarla
async function searchCustomer() {
    const phoneInput = document.querySelector('[name="customer_phone"]');
    const phone = phoneInput.value.replace(/\D/g, '');
    
    if (phone.length !== 10) {
        showToast('Geçerli bir telefon numarası girin (5XX XXX XX XX)', 'warning');
        return;
    }
    
    const customerDetails = document.getElementById('customerDetails');
    customerDetails.classList.remove('d-none');
    
    try {
        const response = await fetch(`${API_URL}/customers/search/phone/${phone}`);
        if (!response.ok) throw new Error('API Hatası');
        const customer = await response.json();

        const fields = [
            'customer_name', 'customer_email', 'customer_address',
            'customer_city', 'customer_district', 'customer_type',
            'company_name', 'tax_number', 'special_dates', 'customer_notes'
        ];
        
        if (customer.found === false) {
            // Yeni müşteri - formu temizle ve düzenlenebilir yap
            document.querySelector('[name="customer_id"]').value = '';
            fields.forEach(field => {
                const input = document.querySelector(`[name="${field}"]`);
                if (input) {
                    input.value = '';
                    input.removeAttribute('readonly');
                }
            });
            
            // Form validasyonlarını aktif et
            document.querySelector('[name="customer_name"]').setAttribute('required', 'true');
            
        } else {
            // Mevcut müşteri - bilgileri doldur ve readonly yap
            document.querySelector('[name="customer_id"]').value = customer.id;
            
            const mappings = {
                name: 'customer_name',
                email: 'customer_email',
                address: 'customer_address',
                city: 'customer_city',
                district: 'customer_district',
                customer_type: 'customer_type',
                company_name: 'company_name',
                tax_number: 'tax_number',
                special_dates: 'special_dates',
                notes: 'customer_notes'
            };

            Object.entries(mappings).forEach(([apiField, formField]) => {
                const input = document.querySelector(`[name="${formField}"]`);
                if (input) {
                    input.value = customer[apiField] || '';
                    input.setAttribute('readonly', 'true');
                }
            });
            
            // Kurumsal/bireysel alanları ayarla
            toggleCompanyFields(customer.customer_type === 'corporate');
        }
        
    } catch (error) {
        showToast('Müşteri araması başarısız', 'error');
    }
}

// Kurumsal müşteri alanlarını göster/gizle
function toggleCompanyFields(isCorporate = null) {
    const customerType = isCorporate !== null ? 
        (isCorporate ? 'corporate' : 'retail') : 
        document.querySelector('[name="customer_type"]').value;
    
    const companyFields = document.getElementById('companyFields');
    const isRequired = customerType === 'corporate';
    
    if (customerType === 'corporate') {
        companyFields.classList.remove('d-none');
        ['company_name', 'tax_number'].forEach(field => {
            const input = document.querySelector(`[name="${field}"]`);
            if (input) input.required = true;
        });
    } else {
        companyFields.classList.add('d-none');
        ['company_name', 'tax_number'].forEach(field => {
            const input = document.querySelector(`[name="${field}"]`);
            if (input) {
                input.required = false;
                input.value = '';
            }
        });
    }
}
