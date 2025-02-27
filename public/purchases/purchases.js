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

function addItemRow() {
    const tbody = document.querySelector('#itemsTable tbody');
    const rowId = Date.now(); // Unique ID için timestamp
    
    const row = `
        <tr id="row-${rowId}">
            <td>
                <select class="form-select form-select-sm" onchange="updateUnit(this, ${rowId})">
                    <option value="">Seçiniz...</option>
                    ${materials.map(m => `
                        <option value="${m.id}" 
                                data-unit="${m.unit_code}"
                                data-price="0">
                            ${m.name}
                        </option>
                    `).join('')}
                </select>
            </td>
            <td>
                <input type="number" class="form-control form-control-sm" 
                       onchange="calculateRowTotal(${rowId})" 
                       value="1" min="0.01" step="0.01">
            </td>
            <td>
                <span class="unit-code">-</span>
            </td>
            <td>
                <input type="number" class="form-control form-control-sm" 
                       onchange="calculateRowTotal(${rowId})" 
                       value="0" min="0" step="0.01">
            </td>
            <td>
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
    const quantity = parseFloat(row.querySelector('input[type="number"]:first-of-type').value) || 0;
    const price = parseFloat(row.querySelector('input[type="number"]:last-of-type').value) || 0;
    
    const total = quantity * price;
    row.querySelector('.row-total').textContent = total.toFixed(2);
    
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
        const quantity = row.querySelector('input:first-of-type').value;
        const price = row.querySelector('input:last-of-type').value;
        
        return {
            material_id: parseInt(material),
            quantity: parseFloat(quantity),
            unit_price: parseFloat(price)
        };
    }).filter(item => item.material_id && item.quantity && item.unit_price);

    if (items.length === 0) {
        showError('En az bir ürün eklemelisiniz!');
        return;
    }

    const data = {
        supplier_id: parseInt(form.elements['supplier_id'].value),
        order_date: form.elements['order_date'].value,
        notes: form.elements['notes'].value,
        items: items,
        total_amount: parseFloat(document.getElementById('totalAmount').textContent)
    };

    try {
        const response = await fetch(`${API_URL}/purchase/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        createModal.hide();
        await loadPurchases();
        showSuccess('Sipariş başarıyla oluşturuldu');
        form.reset();
        document.querySelector('#itemsTable tbody').innerHTML = '';
        calculateTotal();
    } catch (error) {
        console.error('Sipariş oluşturma hatası:', error);
        showError('Sipariş oluşturulamadı!');
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
