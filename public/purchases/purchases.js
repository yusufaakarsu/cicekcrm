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
            m.name.toLowerCase().includes(searchText);
        
        return categoryMatch && searchMatch;
    });
    
    renderMaterialButtons();
}

// Ham madde butonlarını render et
function renderMaterialButtons() {
    const container = document.getElementById('materialButtonsContainer');
    
    if (!filteredMaterials.length) {
        container.innerHTML = '<div class="col-12"><div class="alert alert-info">Ham madde bulunamadı</div></div>';
        return;
    }
    
    // Kategorilere göre grupla
    const groupedMaterials = {};
    filteredMaterials.forEach(m => {
        if (!groupedMaterials[m.category_name]) {
            groupedMaterials[m.category_name] = [];
        }
        groupedMaterials[m.category_name].push(m);
    });

    // Her kategori için ayrı bir bölüm oluştur
    container.innerHTML = Object.entries(groupedMaterials).map(([category, items]) => `
        <div class="col-12 mb-3">
            <h6 class="border-bottom pb-2">${category || 'Kategorisiz'}</h6>
            <div class="row g-2">
                ${items.map(m => `
                    <div class="col-md-3">
                        <button type="button" 
                                class="btn btn-outline-primary w-100 text-start" 
                                onclick="addMaterialToOrder(${m.id})">
                            <div class="fw-bold">${m.name}</div>
                            <small class="text-muted d-block">${m.unit_name}</small>
                        </button>
                    </div>
                `).join('')}
            </div>
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
            <input type="hidden" name="items[][material_id]" value="${material.id}">
            ${material.name}
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
                       onchange="calculateRowTotal(this)">
                <span class="input-group-text">${material.unit_name}</span>
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
                       onchange="calculateRowTotal(this)">
            </div>
        </td>
        <td class="text-end">
            <span class="row-total">0,00 ₺</span>
        </td>
        <td>
            <button type="button" class="btn btn-sm btn-outline-danger"
                    onclick="removeRow(this)">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
    calculateRowTotal(row.querySelector('input[name$="[quantity]"]')); // İlk hesaplama
}

// Satır sil
function removeRow(button) {
    button.closest('tr').remove();
    calculateTotalAmount();
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
    purchaseModal.show();
    filterMaterials(); // Ham madde listesini hazırla
}

// Kaldırılan fonksiyonlar:
// - addNewRow
// - updateUnitAndPrice
// Artık sadece addMaterialToOrder kullanılacak

// Satır toplamını hesapla
function calculateRowTotal(input) {
    const row = input.closest('tr');
    const quantity = parseFloat(row.querySelector('input[name$="[quantity]"]').value) || 0;
    const price = parseFloat(row.querySelector('input[name$="[unit_price]"]').value) || 0;
    const total = quantity * price;
    
    row.querySelector('.row-total').textContent = formatCurrency(total);
    calculateTotalAmount();
}

// Genel toplamı hesapla
function calculateTotalAmount() {
    let total = 0;
    document.querySelectorAll('.row-total').forEach(span => {
        const text = span.textContent;
        total += parseCurrency(text);
    });
    document.getElementById('totalAmount').textContent = formatCurrency(total);
}

// Satın alma siparişini kaydet
async function savePurchase() {
    const form = document.getElementById('purchaseForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    // Form verilerini kontrol et
    const supplier_id = form.querySelector('[name="supplier_id"]').value;
    const order_date = form.querySelector('[name="order_date"]').value;
    
    if (!supplier_id || !order_date) {
        showError('Lütfen tedarikçi ve sipariş tarihini seçin');
        return;
    }

    // Kalem kontrolü
    const items = [];
    let hasError = false;
    
    document.querySelectorAll('#itemsTableBody tr').forEach(row => {
        const material_id = row.querySelector('[name$="[material_id]"]').value;
        const quantity = parseFloat(row.querySelector('[name$="[quantity]"]').value);
        const unit_price = parseFloat(row.querySelector('[name$="[unit_price]"]').value);
        
        if (!material_id || !quantity || !unit_price) {
            hasError = true;
            return;
        }
        
        items.push({ material_id, quantity, unit_price });
    });

    if (hasError || items.length === 0) {
        showError('Lütfen en az bir kalem ekleyin ve tüm alanları doldurun');
        return;
    }

    // API isteği gönder
    try {
        const response = await fetch(`${API_URL}/purchase/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                supplier_id: supplier_id,
                order_date: order_date,
                notes: form.querySelector('[name="notes"]').value,
                items: items
            })
        });

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'API Hatası');
        }

        showSuccess('Satın alma siparişi oluşturuldu');
        purchaseModal.hide();
        loadPurchases();
    } catch (error) {
        console.error('Purchase save error:', error);
        showError('Satın alma siparişi oluşturulamadı: ' + error.message);
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
