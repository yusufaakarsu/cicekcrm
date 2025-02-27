let createModal, detailModal;
let currentPurchaseId = null;
let materials = [];
let suppliers = [];

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    loadPurchases();
    loadSuppliers();
    loadMaterials();
    
    // Modal instances
    createModal = new bootstrap.Modal(document.getElementById('createPurchaseModal'));
    detailModal = new bootstrap.Modal(document.getElementById('purchaseDetailModal'));
});

async function loadPurchases() {
    try {
        const response = await fetch(`${API_URL}/purchase/orders`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        const tbody = document.querySelector('#purchasesTable tbody');
        
        if (data.orders?.length > 0) {
            tbody.innerHTML = data.orders.map(order => `
                <tr>
                    <td>#${order.id}</td>
                    <td>${order.supplier_name}</td>
                    <td>${formatDate(order.order_date)}</td>
                    <td>${order.item_count} kalem</td>
                    <td>${formatPrice(order.calculated_total)}</td>
                    <td>${getPaymentStatusBadge(order.payment_status)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-info" onclick="showPurchaseDetail(${order.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Satın alma siparişi bulunamadı</td></tr>';
        }
    } catch (error) {
        console.error('Siparişler yüklenirken hata:', error);
        showError('Siparişler yüklenemedi!');
    }
}

async function loadSuppliers() {
    try {
        const response = await fetch(`${API_URL}/suppliers`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        suppliers = data.suppliers || [];
        
        const select = document.querySelector('select[name="supplier_id"]');
        select.innerHTML = `
            <option value="">Seçiniz...</option>
            ${suppliers.map(s => `
                <option value="${s.id}">${s.name}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Tedarikçiler yüklenirken hata:', error);
        showError('Tedarikçiler yüklenemedi!');
    }
}

async function loadMaterials() {
    try {
        const response = await fetch(`${API_URL}/materials`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        materials = data.materials || [];
    } catch (error) {
        console.error('Hammaddeler yüklenirken hata:', error);
        showError('Hammaddeler yüklenemedi!');
    }
}

// Materyal listesini kategorilere göre grupla
function groupMaterialsByCategory() {
    const grouped = {};
    materials.forEach(m => {
        if (!grouped[m.category_name]) {
            grouped[m.category_name] = [];
        }
        grouped[m.category_name].push(m);
    });
    return grouped;
}

function addItemRow() {
    const tbody = document.querySelector('#itemsTable tbody');
    const rowId = Date.now();
    const groupedMaterials = groupMaterialsByCategory();
    
    const row = `
        <tr id="row-${rowId}">
            <td>
                <select class="form-select form-select-sm" onchange="updateUnit(this, ${rowId})">
                    <option value="">Seçiniz...</option>
                    ${Object.entries(groupedMaterials).map(([category, items]) => `
                        <optgroup label="${category}">
                            ${items.map(m => `
                                <option value="${m.id}" 
                                        data-unit="${m.unit_code}"
                                        data-price="0">
                                    ${m.name}
                                </option>
                            `).join('')}
                        </optgroup>
                    `).join('')}
                </select>
            </td>
            <td style="width: 120px;">
                <input type="number" class="form-control form-control-sm quantity" 
                       onchange="calculateRowTotal(${rowId})" 
                       value="1" min="0.01" step="0.01">
            </td>
            <td style="width: 80px;">
                <span class="unit-code">-</span>
            </td>
            <td style="width: 120px;">
                <input type="number" class="form-control form-control-sm price" 
                       onchange="calculateRowTotal(${rowId})" 
                       value="0" min="0" step="0.01">
            </td>
            <td style="width: 120px;">
                <span class="row-total">0.00</span> ₺
            </td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-danger" 
                        onclick="removeRow(${rowId})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `;
    
    tbody.insertAdjacentHTML('beforeend', row);
}

function updateUnit(select, rowId) {
    const row = document.getElementById(`row-${rowId}`);
    const option = select.options[select.selectedIndex];
    
    row.querySelector('.unit-code').textContent = option.dataset.unit || '-';
    calculateRowTotal(rowId);
}

function calculateRowTotal(rowId) {
    const row = document.getElementById(`row-${rowId}`);
    const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
    const price = parseFloat(row.querySelector('.price').value) || 0;
    
    const total = (quantity * price).toFixed(2);
    row.querySelector('.row-total').textContent = total;
    
    calculateTotal();
}

function calculateTotal() {
    const totals = Array.from(document.querySelectorAll('.row-total'))
        .map(el => parseFloat(el.textContent) || 0);
    
    const total = totals.reduce((a, b) => a + b, 0);
    document.getElementById('totalAmount').textContent = total.toFixed(2);
}

function removeRow(rowId) {
    document.getElementById(`row-${rowId}`).remove();
    calculateTotal();
}

async function savePurchase() {
    const form = document.getElementById('purchaseForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Sipariş kalemlerini topla
    const items = Array.from(document.querySelectorAll('#itemsTable tbody tr')).map(row => {
        const material = row.querySelector('select').value;
        const quantity = parseFloat(row.querySelector('.quantity').value);
        const price = parseFloat(row.querySelector('.price').value);
        
        return {
            material_id: parseInt(material),
            quantity: quantity,
            unit_price: price
        };
    }).filter(item => item.material_id && item.quantity > 0 && item.unit_price > 0);

    if (items.length === 0) {
        showError('En az bir ürün eklemelisiniz!');
        return;
    }

    const data = {
        supplier_id: parseInt(form.elements['supplier_id'].value),
        order_date: form.elements['order_date'].value,
        notes: form.elements['notes'].value || null,
        total_amount: parseFloat(document.getElementById('totalAmount').textContent),
        items: items
    };

    try {
        console.log('Saving purchase order:', data); // Debug log

        const response = await fetch(`${API_URL}/purchase/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'API Hatası');
        }

        createModal.hide();
        form.reset();
        document.querySelector('#itemsTable tbody').innerHTML = '';
        calculateTotal();
        await loadPurchases();
        
        showSuccess('Sipariş başarıyla oluşturuldu');
    } catch (error) {
        console.error('Sipariş oluşturma hatası:', error);
        showError(error.message || 'Sipariş oluşturulamadı');
    }
}

async function showPurchaseDetail(id) {
    try {
        currentPurchaseId = id;
        const response = await fetch(`${API_URL}/purchase/orders/${id}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        const order = data.order;
        
        // Detay alanlarını doldur
        document.getElementById('detail-id').textContent = order.id;
        document.getElementById('detail-supplier-name').textContent = order.supplier_name;
        document.getElementById('detail-supplier-phone').textContent = order.supplier_phone;
        document.getElementById('detail-supplier-email').textContent = order.supplier_email || '-';
        document.getElementById('detail-created-by').textContent = order.created_by_name;

        // Ürün listesi
        document.getElementById('detail-items').innerHTML = order.items.map(item => `
            <tr>
                <td>${item.material_name}</td>
                <td>${item.quantity}</td>
                <td>${item.unit_code}</td>
                <td>${formatPrice(item.unit_price)}</td>
                <td>${formatPrice(item.quantity * item.unit_price)}</td>
            </tr>
        `).join('');

        document.getElementById('detail-total').textContent = 
            `${formatPrice(order.total_amount)} ₺`;

        // Ödemeleri göster butonu ekle
        const paymentBtn = document.createElement('button');
        paymentBtn.className = 'btn btn-success';
        paymentBtn.innerHTML = '<i class="bi bi-cash"></i> Ödeme İşlemleri';
        paymentBtn.onclick = () => showPaymentModal(order);
        
        const footer = document.querySelector('#purchaseDetailModal .modal-footer');
        footer.appendChild(paymentBtn);

        detailModal.show();
    } catch (error) {
        console.error('Sipariş detayı yüklenirken hata:', error);
        showError('Sipariş detayları yüklenemedi!');
    }
}

function showCreatePurchaseModal() {
    document.getElementById('purchaseForm').reset();
    document.querySelector('#itemsTable tbody').innerHTML = '';
    calculateTotal();
    createModal.show();
}

async function updateStatus(status) {
    if (!currentPurchaseId) return;
    
    try {
        const response = await fetch(`${API_URL}/purchase/orders/${currentPurchaseId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        detailModal.hide();
        await loadPurchases();
        showSuccess('Sipariş durumu güncellendi');
    } catch (error) {
        console.error('Durum güncelleme hatası:', error);
        showError('Durum güncellenemedi!');
    }
}

// Ödeme işlemleri için yeni fonksiyonlar
async function showPaymentModal(order) {
    try {
        // Modal içeriğini doldur
        document.getElementById('payment-order-id').textContent = order.id;
        document.getElementById('payment-supplier').textContent = order.supplier_name;
        document.getElementById('payment-total').textContent = formatPrice(order.total_amount);
        document.getElementById('payment-paid').textContent = formatPrice(order.paid_amount || 0);
        
        const remainingAmount = order.total_amount - (order.paid_amount || 0);
        document.getElementById('payment-remaining').textContent = formatPrice(remainingAmount);

        // Ödeme tutarını max olarak ayarla
        const amountInput = document.querySelector('[name="amount"]');
        amountInput.max = remainingAmount;
        amountInput.value = remainingAmount;

        // Ödeme yöntemi değişince hesap otomatik seçilsin
        const paymentMethodSelect = document.querySelector('[name="payment_method"]');
        const accountIdInput = document.createElement('input');
        accountIdInput.type = 'hidden';
        accountIdInput.name = 'account_id';
        
        paymentMethodSelect.onchange = function() {
            // Ödeme yöntemine göre hesap ID'sini ayarla
            switch(this.value) {
                case 'cash':
                    accountIdInput.value = '1'; // Ana Kasa
                    break;
                case 'credit_card':
                    accountIdInput.value = '2'; // Kredi Kartı POS
                    break;
                case 'bank_transfer':
                    accountIdInput.value = '3'; // Banka Hesabı
                    break;
            }
        };

        // Default olarak nakit seç
        paymentMethodSelect.value = 'cash';
        accountIdInput.value = '1';

        // Formu güncelle
        const form = document.getElementById('paymentForm');
        form.appendChild(accountIdInput);

        const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
        paymentModal.show();
    } catch (error) {
        console.error('Ödeme modalı açılırken hata:', error);
        showError('Ödeme modalı açılamadı!');
    }
}

// Ödeme yap
async function makePayment() {
    const form = document.getElementById('paymentForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    try {
        const formData = new FormData(form);
        const data = {
            amount: parseFloat(formData.get('amount')),
            payment_method: formData.get('payment_method'),
            account_id: parseInt(formData.get('account_id')),
            notes: formData.get('notes')
        };

        const response = await fetch(`${API_URL}/purchase/orders/${currentPurchaseId}/payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
        modal.hide();

        // Listeyi güncelle
        await loadPurchases();
        showSuccess('Ödeme başarıyla kaydedildi');
    } catch (error) {
        console.error('Ödeme hatası:', error);
        showError(error.message || 'Ödeme yapılamadı');
    }
}

// Helper Functions
function getPaymentStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge bg-warning">Bekliyor</span>',
        'partial': '<span class="badge bg-info">Kısmi Ödeme</span>',
        'paid': '<span class="badge bg-success">Ödendi</span>',
        'cancelled': '<span class="badge bg-danger">İptal</span>'
    };
    return badges[status] || status;
}
