// Global değişkenler
let createModal, detailModal;
let currentPurchaseId = null;
let currentOrder = null;
let materials = [];
let suppliers = [];

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    loadSuppliers();
    loadMaterials();
    loadPurchases();
});

// Tedarikçileri yükle
async function loadSuppliers() {
    try {
        const response = await fetch(`${API_URL}/suppliers`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        suppliers = data.suppliers || [];
        
        // Supplier filtresini doldur
        const supplierFilter = document.getElementById('supplierFilter');
        const supplierSelect = document.querySelector('select[name="supplier_id"]');
        
        const options = `
            <option value="">Seçiniz</option>
            ${suppliers.map(s => `
                <option value="${s.id}">${s.name}</option>
            `).join('')}
        `;
        
        supplierFilter.innerHTML = options;
        supplierSelect.innerHTML = options;
        
    } catch (error) {
        console.error('Suppliers loading error:', error);
        showError('Tedarikçiler yüklenemedi');
    }
}

// Ham maddeleri yükle
async function loadMaterials() {
    try {
        const response = await fetch(`${API_URL}/stock/materials`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        materials = data.materials || [];
    } catch (error) {
        console.error('Materials loading error:', error);
        showError('Ham maddeler yüklenemedi');
    }
}

// Siparişleri yükle
async function loadPurchases() {
    try {
        const response = await fetch(`${API_URL}/purchase/orders`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        renderPurchaseTable(data.orders);
    } catch (error) {
        console.error('Purchases loading error:', error);
        showError('Satın alma listesi yüklenemedi');
    }
}

// Tabloyu render et
function renderPurchaseTable(orders) {
    const tbody = document.getElementById('purchaseTable');
    
    if (!orders?.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Kayıt bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.supplier_name}</td>
            <td>${formatDate(order.order_date)}</td>
            <td>
                <span class="badge ${getStatusBadge(order.payment_status)}">
                    ${getStatusText(order.payment_status)}
                </span>
            </td>
            <td class="text-end">
                <strong>${formatPrice(order.total_amount)}</strong>
                ${order.paid_amount ? `<br><small class="text-success">Ödenen: ${formatPrice(order.paid_amount)}</small>` : ''}
            </td>
            <td class="text-end">
                <button class="btn btn-sm btn-primary" onclick="showPurchaseDetail(${order.id})">
                    <i class="bi bi-eye"></i> Detay
                </button>
            </td>
        </tr>
    `).join('');
}

// Status helpers
function getStatusBadge(status) {
    const badges = {
        pending: 'bg-warning',
        partial: 'bg-info', 
        paid: 'bg-success',
        cancelled: 'bg-danger'
    };
    return badges[status] || 'bg-secondary';
}

function getStatusText(status) {
    const texts = {
        pending: 'Bekliyor',
        partial: 'Kısmi Ödeme',
        paid: 'Ödendi',
        cancelled: 'İptal'
    };
    return texts[status] || status;
}

// Yeni sipariş modalı
function showCreatePurchaseModal() {
    createModal = new bootstrap.Modal(document.getElementById('createPurchaseModal'));
    document.getElementById('purchaseForm').reset();
    createModal.show();
}

// Sipariş detayı
async function showPurchaseDetail(id) {
    try {
        currentPurchaseId = id;
        const response = await fetch(`${API_URL}/purchase/orders/${id}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        currentOrder = data.order;
        
        // Detay alanlarını doldur
        document.getElementById('detail-order-id').textContent = currentOrder.id;
        document.getElementById('detail-supplier-name').textContent = currentOrder.supplier_name;
        document.getElementById('detail-total-amount').textContent = formatPrice(currentOrder.total_amount);
        document.getElementById('detail-paid-amount').textContent = formatPrice(currentOrder.paid_amount || 0);
        
        const remainingAmount = currentOrder.total_amount - (currentOrder.paid_amount || 0);
        document.getElementById('detail-remaining').textContent = formatPrice(remainingAmount);
        document.getElementById('detail-status').innerHTML = getStatusBadge(currentOrder.payment_status);

        // Ürün listesini doldur 
        document.getElementById('detail-items-table').innerHTML = `
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Ham Madde</th>
                        <th class="text-end">Miktar</th>
                        <th class="text-end">Birim Fiyat</th>
                        <th class="text-end">Toplam</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentOrder.items.map(item => `
                        <tr>
                            <td>${item.material_name}</td>
                            <td class="text-end">${item.quantity} ${item.unit_name}</td>
                            <td class="text-end">${formatPrice(item.unit_price)}</td>
                            <td class="text-end">${formatPrice(item.quantity * item.unit_price)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Ödeme formu için max tutar
        document.querySelector('[name="amount"]').value = remainingAmount;
        document.querySelector('[name="amount"]').max = remainingAmount;

        // Modal göster
        detailModal = new bootstrap.Modal(document.getElementById('detailModal'));
        detailModal.show();

    } catch (error) {
        console.error('Sipariş detayı yüklenirken hata:', error);
        showError('Sipariş detayları yüklenemedi!');
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
            account_id: parseInt(formData.get('account_id'))
        };

        const response = await fetch(`${API_URL}/purchase/orders/${currentPurchaseId}/payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        // Başarılı ödeme sonrası:
        detailModal.hide();      
        await loadPurchases();   
        showSuccess('Ödeme başarıyla kaydedildi');

    } catch (error) {
        console.error('Ödeme hatası:', error);
        showError(error.message || 'Ödeme yapılamadı');
    }
}

// Ürün satırı ekle
function addItemRow() {
    const tbody = document.querySelector('#itemsTable tbody');
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <select class="form-select form-select-sm" name="items[][material_id]" required onchange="calculateRowTotal(this.closest('tr'))">
                <option value="">Seçiniz...</option>
                ${materials.map(m => `
                    <option value="${m.id}">${m.name}</option>
                `).join('')}
            </select>
        </td>
        <td>
            <div class="input-group input-group-sm">
                <input type="number" 
                       class="form-control" 
                       name="items[][quantity]"
                       value="1"
                       min="0.01" 
                       step="0.01" 
                       required
                       onchange="calculateRowTotal(this.closest('tr'))">
            </div>
        </td>
        <td>
            <div class="input-group input-group-sm">
                <span class="input-group-text">₺</span>
                <input type="number" 
                       class="form-control" 
                       name="items[][unit_price]"
                       value="0"
                       min="0.01" 
                       step="0.01" 
                       required
                       onchange="calculateRowTotal(this.closest('tr'))">
            </div>
        </td>
        <td class="text-end">
            <span class="row-total">0,00 ₺</span>
        </td>
        <td>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeRow(this)">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
}

// Satır sil
function removeRow(button) {
    button.closest('tr').remove();
    calculateTotalAmount();
}

// Satır toplamını hesapla 
function calculateRowTotal(row) {
    const quantity = parseFloat(row.querySelector('[name$="[quantity]"]').value) || 0;
    const price = parseFloat(row.querySelector('[name$="[unit_price]"]').value) || 0;
    const total = quantity * price;
    
    row.querySelector('.row-total').textContent = formatPrice(total);
    calculateTotalAmount();
}

// Genel toplamı hesapla
function calculateTotalAmount() {
    let total = 0;
    document.querySelectorAll('.row-total').forEach(span => {
        total += parsePrice(span.textContent);
    });
    document.getElementById('totalAmount').textContent = formatPrice(total);
}
