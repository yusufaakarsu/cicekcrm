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
    const categoryId = document.getElementById('modalCategoryFilter').value;
    const searchText = document.getElementById('modalSearchInput').value.toLowerCase();
    
    filteredMaterials = materials.filter(m => {
        const categoryMatch = !categoryId || m.category_id == categoryId;
        const searchMatch = !searchText || 
            m.name.toLowerCase().includes(searchText) ||
            m.description?.toLowerCase().includes(searchText);
        
        return categoryMatch && searchMatch;
    });
    
    renderMaterialButtons();
}

// Ham madde butonlarını render et
function renderMaterialButtons() {
    const container = document.getElementById('materialButtonsContainer');
    
    container.innerHTML = filteredMaterials.map(m => `
        <div class="col-md-3 mb-2">
            <button type="button" 
                    class="btn btn-outline-primary w-100 text-start" 
                    onclick="addMaterialToOrder(${m.id})">
                <div class="fw-bold">${m.name}</div>
                <small class="text-muted d-block">
                    ${m.category_name} - ${m.unit_name}
                </small>
            </button>
        </div>
    `).join('');
}

// Ham maddeyi siparişe ekle
function addMaterialToOrder(materialId) {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;
    
    const tbody = document.getElementById('itemsTableBody');
    
    // Eğer bu malzeme zaten eklenmişse uyarı ver
    const existingRow = tbody.querySelector(`input[value="${material.id}"]`);
    if (existingRow) {
        showError('Bu ham madde zaten listeye eklenmiş!');
        return;
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <input type="hidden" name="material_id" value="${material.id}">
            <div class="fw-bold">${material.name}</div>
            <small class="text-muted">${material.category_name}</small>
        </td>
        <td>
            <div class="input-group input-group-sm">
                <input type="number" class="form-control quantity" 
                       required min="0.01" step="0.01" 
                       onchange="calculateRowTotal(this)">
                <span class="input-group-text">${material.unit_name}</span>
            </div>
        </td>
        <td>
            <div class="input-group input-group-sm">
                <span class="input-group-text">₺</span>
                <input type="number" class="form-control price" 
                       required min="0.01" step="0.01" 
                       onchange="calculateRowTotal(this)">
            </div>
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
    materialSelectorModal.hide();
}

// Satın alma listesini yükle
async function loadPurchases() {
    try {
        // URL düzeltildi: /stock/orders -> /purchase/orders
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
        // URL düzeltildi: /stock/purchases -> /purchase/orders
        const response = await fetch(`${API_URL}/purchase/orders`, {
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

let materialSelectorModal;

// Modal göster
function showMaterialSelector() {
    materialSelectorModal = new bootstrap.Modal(document.getElementById('materialSelectorModal'));
    filterMaterials(); // İlk yükleme
    materialSelectorModal.show();
}
