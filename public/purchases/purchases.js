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
        currentOrder = null; // Reset current order
        
        const response = await fetch(`${API_URL}/purchase/orders/${id}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        
        currentOrder = data.order;
        
        // Temel bilgileri doldur
        document.getElementById('detail-order-id').textContent = currentOrder.id;
        document.getElementById('detail-supplier-name').textContent = currentOrder.supplier_name;
        document.getElementById('detail-total-amount').textContent = formatPrice(currentOrder.total_amount);
        document.getElementById('detail-paid-amount').textContent = formatPrice(currentOrder.paid_amount || 0);

        // Kalan tutarı hesapla
        const remainingAmount = currentOrder.total_amount - (currentOrder.paid_amount || 0);
        document.getElementById('detail-remaining').textContent = formatPrice(remainingAmount);

        // Status badge'ini güncelle
        const statusBadge = document.getElementById('detail-status');
        statusBadge.className = `badge ${getStatusBadge(currentOrder.payment_status)}`;
        statusBadge.textContent = getStatusText(currentOrder.payment_status);

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
                            <td class="text-end">${item.quantity} ${item.unit_code}</td>
                            <td class="text-end">${formatPrice(item.unit_price)}</td>
                            <td class="text-end">${formatPrice(item.quantity * item.unit_price)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // İptal/Ödeme butonlarını ve formu duruma göre göster/gizle
        const cancelButton = document.getElementById('cancelButton');
        const paymentButton = document.getElementById('paymentButton');
        const paymentForm = document.getElementById('paymentForm');

        // Form elementlerini kontrol et ve varsa güncelle
        const amountInput = paymentForm?.querySelector('[name="amount"]');
        if (amountInput && remainingAmount > 0) {
            amountInput.value = remainingAmount;
            amountInput.max = remainingAmount;
        }

        // Durum kontrolü
        if (currentOrder.payment_status === 'cancelled' || currentOrder.payment_status === 'paid') {
            if (cancelButton) cancelButton.style.display = 'none';
            if (paymentButton) paymentButton.style.display = 'none';
            if (paymentForm) paymentForm.style.display = 'none';
        } else {
            if (cancelButton) cancelButton.style.display = 'block';
            if (paymentButton) paymentButton.style.display = 'block';
            if (paymentForm) paymentForm.style.display = 'block';
        }

        // Modalı göster
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

// Para formatlamak için helper fonksiyonlar
function formatPrice(price) {
    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price) + ' ₺';
}

function parsePrice(priceString) {
    return parseFloat(priceString.replace(/[^0-9,.-]/g, '').replace(',', '.')) || 0;
}

// Sipariş kaydetme fonksiyonu
async function savePurchase() {
    const form = document.getElementById('purchaseForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    try {
        const formData = new FormData(form);
        const items = [];
        let total_amount = 0;

        // Kalem verilerini topla ve toplam tutarı hesapla
        document.querySelectorAll('#itemsTable tbody tr').forEach(row => {
            const material_id = parseInt(row.querySelector('[name$="[material_id]"]').value);
            const quantity = parseFloat(row.querySelector('[name$="[quantity]"]').value);
            const unit_price = parseFloat(row.querySelector('[name$="[unit_price]"]').value);
            
            if (material_id && quantity && unit_price) {
                const item_total = quantity * unit_price;
                total_amount += item_total;
                
                items.push({ 
                    material_id, 
                    quantity, 
                    unit_price,
                    total: item_total 
                });
            }
        });

        if (!items.length) {
            throw new Error('En az bir kalem eklemelisiniz');
        }

        const data = {
            supplier_id: parseInt(formData.get('supplier_id')),
            order_date: formData.get('order_date'),
            notes: formData.get('notes'),
            total_amount: total_amount,
            items: items
        };

        const response = await fetch(`${API_URL}/purchase/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Kayıt başarısız');
        }

        createModal.hide();
        await loadPurchases();
        showSuccess('Sipariş başarıyla oluşturuldu');
        form.reset();

    } catch (error) {
        console.error('Sipariş kaydedilirken hata:', error);
        showError(error.message || 'Sipariş kaydedilemedi');
    }
}

// Tarih filtresini kontrol et
document.getElementById('dateFilter').addEventListener('change', function(e) {
    const customDateDiv = document.getElementById('customDateRange');
    customDateDiv.style.display = e.target.value === 'custom' ? 'flex' : 'none';
});

// Filtreleri uygula
async function applyFilters() {
    try {
        const filters = {
            supplier_id: document.getElementById('supplierFilter').value,
            payment_status: document.getElementById('paymentStatusFilter').value,
            date_filter: document.getElementById('dateFilter').value,
            min_amount: document.getElementById('minAmount').value,
            max_amount: document.getElementById('maxAmount').value
        };

        // Özel tarih seçilmişse ekle
        if (filters.date_filter === 'custom') {
            filters.start_date = document.getElementById('startDate').value;
            filters.end_date = document.getElementById('endDate').value;
        }

        // URL parametrelerini oluştur
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });

        const response = await fetch(`${API_URL}/purchase/orders?${params}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        renderPurchaseTable(data.orders);

    } catch (error) {
        console.error('Filtreleme hatası:', error);
        showError('Filtreleme yapılamadı');
    }
}

// İptal fonksiyonunu ekle
async function cancelPurchase() {
    if (!confirm('Siparişi iptal etmek istediğinize emin misiniz?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/purchase/orders/${currentPurchaseId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status: 'cancelled',
                payment_status: 'cancelled' // Bu parametre eklendi
            })
        });

        if (!response.ok) throw new Error('API Hatası');
        const result = await response.json();

        if (result.success) {
            detailModal.hide();
            await loadPurchases();
            showSuccess('Sipariş başarıyla iptal edildi');
        } else {
            throw new Error(result.error || 'İptal işlemi başarısız');
        }
    } catch (error) {
        console.error('Sipariş iptal hatası:', error);
        showError(error.message || 'Sipariş iptal edilemedi');
    }
}
