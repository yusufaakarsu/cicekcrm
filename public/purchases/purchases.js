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
        const data = await response.json();
        suppliers = data.suppliers || [];
        
        // Supplier filtresini doldur (eğer element varsa)
        const supplierFilter = document.getElementById('supplierFilter');
        if (supplierFilter) {
            supplierFilter.innerHTML = `
                <option value="">Tüm Tedarikçiler</option>
                ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
            `;
        }
    } catch (error) {
        console.error('Suppliers loading error:', error);
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
        const data = await response.json();
        categories = data.categories || [];
        
        // Kategori filtresini doldur (eğer element varsa)
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.innerHTML = `
                <option value="">Tüm Kategoriler</option>
                ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            `;
        }
    } catch (error) {
        console.error('Categories loading error:', error);
    }
}

// Ham maddeleri filtrele
function filterMaterials() {
    const categoryId = document.getElementById('categoryFilter').value;
    const searchText = document.getElementById('materialSearch').value.toLowerCase();
    
    filteredMaterials = materials.filter(m => {
        const categoryMatch = !categoryId || m.category_id == categoryId;
        const searchMatch = !searchText || m.name.toLowerCase().includes(searchText);
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
    
    container.innerHTML = filteredMaterials.map(m => `
        <div class="col-md-3 mb-2">
            <button type="button" 
                    class="btn btn-outline-primary w-100 text-start" 
                    onclick="addMaterialToOrder(${m.id})">
                <div class="fw-bold">${m.name}</div>
                <small class="text-muted d-block">${m.unit_name}</small>
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
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Kayıt bulunamadı</td></tr>';
        return;
    }
    
    // Tarihe göre sırala (yeniden eskiye)
    orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
    
    tbody.innerHTML = orders.map(order => `
        <tr class="order-row" data-order-id="${order.id}">
            <td class="text-center">#${order.id}</td>
            <td>${order.supplier_name}</td>
            <td class="text-center">${formatDate(order.order_date)}</td>
            <td class="text-end fw-bold">${formatCurrency(order.total_amount)}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-primary" 
                        onclick="toggleOrderDetails(${order.id}, this)">
                    <i class="bi bi-chevron-down"></i>
                </button>
            </td>
        </tr>
        <tr id="details-${order.id}" class="d-none">
            <td colspan="5" class="p-0">
                <div class="details-content p-3 bg-light border-top"></div>
            </td>
        </tr>
    `).join('');
}

// Sipariş detaylarını göster/gizle
async function toggleOrderDetails(orderId, button) {
    const detailsRow = document.getElementById(`details-${orderId}`);
    const detailsContent = detailsRow.querySelector('.details-content');
    const icon = button.querySelector('i');

    if (detailsRow.classList.contains('d-none')) {
        try {
            // Detayları yükle
            const response = await fetch(`${API_URL}/purchase/orders/${orderId}`);
            if (!response.ok) throw new Error('API Hatası');
            
            const data = await response.json();
            
            // Detay içeriğini oluştur
            detailsContent.innerHTML = `
                <div class="table-responsive">
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
                            ${data.items.map(item => `
                                <tr>
                                    <td>${item.material_name}</td>
                                    <td class="text-end">${item.quantity} ${item.unit_name}</td>
                                    <td class="text-end">${formatCurrency(item.unit_price)}</td>
                                    <td class="text-end">${formatCurrency(item.quantity * item.unit_price)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            // Görünürlüğü değiştir
            detailsRow.classList.remove('d-none');
            icon.classList.replace('bi-chevron-down', 'bi-chevron-up');
        } catch (error) {
            showError('Sipariş detayları yüklenemedi');
        }
    } else {
        // Detayları gizle
        detailsRow.classList.add('d-none');
        icon.classList.replace('bi-chevron-up', 'bi-chevron-down');
    }
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
                       onchange="calculateTotal(this.closest('tr'))">
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
                       onchange="calculateTotal(this.closest('tr'))">
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
    calculateTotal(row); // İlk hesaplama
}

// Satır toplamını hesapla
function calculateTotal(row) {
    const quantity = parseFloat(row.querySelector('input[name$="[quantity]"]').value) || 0;
    const price = parseFloat(row.querySelector('input[name$="[unit_price]"]').value) || 0;
    const total = quantity * price;
    
    row.querySelector('.row-total').textContent = formatCurrency(total);
    
    // Genel toplam hesapla
    let grandTotal = 0;
    document.querySelectorAll('.row-total').forEach(span => {
        grandTotal += parseCurrency(span.textContent);
    });
    document.getElementById('totalAmount').textContent = formatCurrency(grandTotal);
}

// Satın alma siparişini kaydet
async function savePurchase() {
    try {
        const form = document.getElementById('purchaseForm');
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const supplier_id = parseInt(form.querySelector('[name="supplier_id"]').value);
        const order_date = form.querySelector('[name="order_date"]').value;
        
        if (!supplier_id || !order_date) {
            throw new Error('Lütfen tedarikçi ve sipariş tarihini seçin');
        }

        // Kalem verilerini topla
        const items = [];
        document.querySelectorAll('#itemsTableBody tr').forEach(row => {
            const material_id = parseInt(row.querySelector('[name$="[material_id]"]').value);
            const quantity = parseFloat(row.querySelector('[name$="[quantity]"]').value);
            const unit_price = parseFloat(row.querySelector('[name$="[unit_price]"]').value);
            
            if (!material_id || !quantity || !unit_price) return;

            items.push({ material_id, quantity, unit_price });
        });

        if (items.length === 0) {
            throw new Error('Lütfen en az bir kalem ekleyin');
        }

        console.log('Sending data:', { supplier_id, order_date, items });

        const response = await fetch(`${API_URL}/purchase/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ supplier_id, order_date, items })
        });

        if (!response.ok) throw new Error('API Hatası');
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'API Hatası');
        }

        showSuccess('Satın alma siparişi oluşturuldu');
        document.getElementById('purchaseModal').querySelector('.btn-close').click();
        await loadPurchases();

    } catch (error) {
        console.error('Purchase save error:', error);
        showError('Satın alma siparişi oluşturulamadı: ' + error.message);
    }
}

// Filtreleri uygula
async function applyFilters() {
    try {
        const supplier_id = document.getElementById('supplierFilter').value;
        const date = document.getElementById('dateFilter').value;
        
        let url = `${API_URL}/purchase/orders`;
        const params = new URLSearchParams();
        
        if (supplier_id) params.append('supplier_id', supplier_id);
        if (date) params.append('date', date);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        renderPurchaseTable(data.orders);
    } catch (error) {
        console.error('Filter error:', error);
        showError('Filtreleme yapılamadı: ' + error.message);
    }
}

let materialSelectorModal;

// Modal göster
function showMaterialSelector() {
    materialSelectorModal = new bootstrap.Modal(document.getElementById('materialSelectorModal'));
    filterMaterials(); // İlk yükleme
    materialSelectorModal.show();
}

// Yeni satın alma modalını göster
function showNewPurchaseModal() {
    // Mevcut modal varsa kaldır
    const oldModal = document.querySelector('.modal.show');
    if (oldModal) {
        const bsModal = bootstrap.Modal.getInstance(oldModal);
        if (bsModal) bsModal.hide();
    }
    
    // Yeni modalı oluştur ve göster
    purchaseModal = new bootstrap.Modal(document.getElementById('purchaseModal'), {
        backdrop: 'static',
        keyboard: false
    });
    
    // Form ve tabloyu temizle
    document.getElementById('purchaseForm').reset();
    document.getElementById('itemsTableBody').innerHTML = '';
    document.getElementById('totalAmount').textContent = '0,00 ₺';
    
    // Ham madde listesini hazırla
    filterMaterials();
    purchaseModal.show();
}
