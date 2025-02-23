let purchaseModal;
let materials = []; // Ham maddelerin listesi
let suppliers = []; // Tedarikçilerin listesi
let categories = []; // Ham madde kategorileri
let filteredMaterials = []; // Filtrelenmiş ham maddeler

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    loadSuppliers();
    loadMaterials();
    loadPurchases();
    loadCategories();
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

// Kategorileri yükle
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/materials/categories`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        categories = data.categories || [];
        
        // Kategori filtresini doldur
        const categoryFilter = document.getElementById('categoryFilter');
        categoryFilter.innerHTML = `
            <option value="">Tüm Kategoriler</option>
            ${categories.map(c => `
                <option value="${c.id}">${c.name}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Categories loading error:', error);
        showError('Kategoriler yüklenemedi');
    }
}

// Ham maddeleri filtrele
function filterMaterials() {
    const categoryId = document.getElementById('categoryFilter').value;
    const searchText = document.getElementById('materialSearch').value.toLowerCase();
    
    filteredMaterials = materials.filter(m => {
        const categoryMatch = !categoryId || m.category_id == categoryId;
        const searchMatch = !searchText || 
            m.name.toLowerCase().includes(searchText) ||
            m.description?.toLowerCase().includes(searchText);
        
        return categoryMatch && searchMatch;
    });
    
    renderMaterialList();
}

// Ham madde listesini render et
function renderMaterialList() {
    const list = document.getElementById('materialList');
    list.innerHTML = filteredMaterials.map(m => `
        <div class="col-md-6 mb-2">
            <div class="card h-100">
                <div class="card-body">
                    <h6 class="card-title">${m.name}</h6>
                    <p class="card-text small text-muted mb-2">
                        ${m.category_name} - ${m.unit_name}
                    </p>
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="addMaterialToOrder(${m.id})">
                        <i class="bi bi-plus"></i> Ekle
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Ham maddeyi siparişe ekle
function addMaterialToOrder(materialId) {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;
    
    const tbody = document.getElementById('itemsTableBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <input type="hidden" name="material_id" value="${material.id}">
            ${material.name}
        </td>
        <td>${material.category_name}</td>
        <td>
            <input type="number" class="form-control form-control-sm quantity" 
                   required min="0.01" step="0.01" onchange="calculateRowTotal(this)">
        </td>
        <td>${material.unit_name}</td>
        <td>
            <input type="number" class="form-control form-control-sm price" 
                   required min="0.01" step="0.01" onchange="calculateRowTotal(this)">
        </td>
        <td class="text-end">
            <span class="row-total">0,00 TL</span>
        </td>
        <td>
            <button type="button" class="btn btn-sm btn-outline-danger"
                    onclick="this.closest('tr').remove(); calculateTotalAmount();">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    tbody.appendChild(row);
}

// Satın alma listesini yükle
async function loadPurchases() {
    try {
        const response = await fetch(`${API_URL}/stock/purchases`);
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
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="7" class="text-center">Kayıt bulunamadı</td></tr>
        `;
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.supplier_name}</td>
            <td>${formatDate(order.order_date)}</td>
            <td>${order.expected_date ? formatDate(order.expected_date) : '-'}</td>
            <td>${formatCurrency(order.total_amount)}</td>
            <td>${getPurchaseStatusBadge(order.status)}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary me-1" 
                            onclick="showPurchaseDetails(${order.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" 
                            onclick="showReceiveModal(${order.id})">
                        <i class="bi bi-box-arrow-in-down"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Satın alma durumu badge'i
function getPurchaseStatusBadge(status) {
    const badges = {
        'draft': '<span class="badge bg-secondary">Taslak</span>',
        'ordered': '<span class="badge bg-primary">Sipariş Verildi</span>',
        'partial': '<span class="badge bg-warning">Kısmi Teslimat</span>',
        'received': '<span class="badge bg-success">Tamamlandı</span>',
        'cancelled': '<span class="badge bg-danger">İptal</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

// Yeni satın alma modalını göster
function showNewPurchaseModal() {
    purchaseModal = new bootstrap.Modal(document.getElementById('purchaseModal'));
    document.getElementById('purchaseForm').reset();
    document.getElementById('itemsTableBody').innerHTML = '';
    addNewRow(); // İlk satırı ekle
    purchaseModal.show();
}

// Yeni ürün satırı ekle
function addNewRow() {
    const tbody = document.getElementById('itemsTableBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <select class="form-select" required onchange="updateUnitAndPrice(this)">
                <option value="">Seçiniz</option>
                ${materials.map(m => `
                    <option value="${m.id}" 
                            data-unit="${m.unit_name}"
                            data-code="${m.unit_code}">
                        ${m.name}
                    </option>
                `).join('')}
            </select>
        </td>
        <td>
            <input type="number" class="form-control" required
                   min="0.01" step="0.01" onchange="calculateRowTotal(this)">
        </td>
        <td>
            <span class="unit-text">-</span>
        </td>
        <td>
            <input type="number" class="form-control" required
                   min="0.01" step="0.01" onchange="calculateRowTotal(this)">
        </td>
        <td>
            <span class="row-total">0,00 TL</span>
        </td>
        <td>
            <button type="button" class="btn btn-sm btn-outline-danger"
                    onclick="this.closest('tr').remove(); calculateTotalAmount();">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    tbody.appendChild(row);
}

// Birim güncelle
function updateUnitAndPrice(select) {
    const row = select.closest('tr');
    const option = select.selectedOptions[0];
    const unitText = row.querySelector('.unit-text');
    
    if (option) {
        unitText.textContent = option.dataset.unit;
    } else {
        unitText.textContent = '-';
    }
}

// Satır toplamını hesapla
function calculateRowTotal(input) {
    const row = input.closest('tr');
    const quantity = parseFloat(row.querySelector('input[type="number"]:first-of-type').value) || 0;
    const price = parseFloat(row.querySelector('input[type="number"]:last-of-type').value) || 0;
    const total = quantity * price;
    
    row.querySelector('.row-total').textContent = formatCurrency(total);
    calculateTotalAmount();
}

// Genel toplamı hesapla
function calculateTotalAmount() {
    let total = 0;
    document.querySelectorAll('.row-total').forEach(span => {
        total += parseCurrency(span.textContent);
    });
    document.getElementById('totalAmount').textContent = formatCurrency(total);
}

// Satın alma siparişini kaydet
async function savePurchase() {
    const form = document.getElementById('purchaseForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Form verilerini topla
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Kalem verilerini ekle
    data.items = Array.from(document.querySelectorAll('#itemsTableBody tr')).map(row => ({
        material_id: row.querySelector('select').value,
        quantity: parseFloat(row.querySelector('input[type="number"]:first-of-type').value),
        unit_price: parseFloat(row.querySelector('input[type="number"]:last-of-type').value)
    })).filter(item => item.material_id && item.quantity && item.unit_price);

    try {
        const response = await fetch(`${API_URL}/stock/purchases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');

        purchaseModal.hide();
        await loadPurchases();
        showSuccess('Satın alma siparişi başarıyla oluşturuldu');
    } catch (error) {
        console.error('Purchase save error:', error);
        showError('Satın alma siparişi oluşturulamadı');
    }
}

// Filtreleri uygula
function applyFilters() {
    loadPurchases();
}
