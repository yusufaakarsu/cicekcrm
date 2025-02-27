let materialModal, categoryModal, stockDetailModal;
let currentMaterialId = null;
let categories = [];
let units = [];
let selectedCategoryId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    loadCategories();
    loadUnits();
    loadMaterials();
    
    materialModal = new bootstrap.Modal(document.getElementById('materialModal'));
    categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
    stockDetailModal = new bootstrap.Modal(document.getElementById('stockDetailModal'));
});

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/materials/categories`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        categories = data.categories || [];
        
        // Kategori listesini güncelle
        const categoryList = document.getElementById('categoryList');
        categoryList.innerHTML = `
            <a href="#" class="list-group-item list-group-item-action ${!selectedCategoryId ? 'active' : ''}"
               onclick="filterByCategory(null)">
                Tüm Kategoriler
                <span class="badge bg-secondary float-end">
                    ${categories.reduce((sum, cat) => sum + (cat.material_count || 0), 0)}
                </span>
            </a>
            ${categories.map(category => `
                <a href="#" class="list-group-item list-group-item-action ${selectedCategoryId === category.id ? 'active' : ''}"
                   onclick="filterByCategory(${category.id})">
                    ${category.name}
                    <span class="badge bg-secondary float-end">${category.material_count || 0}</span>
                </a>
            `).join('')}
        `;

        // Select kutusunu güncelle
        const categorySelect = document.querySelector('select[name="category_id"]');
        categorySelect.innerHTML = `
            <option value="">Seçiniz...</option>
            ${categories.map(category => `
                <option value="${category.id}">${category.name}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
        showError('Kategoriler yüklenemedi!');
    }
}

async function loadUnits() {
    try {
        // Endpoint değişikliği
        const response = await fetch(`${API_URL}/settings/units`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        units = data.units || [];
        
        const unitSelect = document.querySelector('select[name="unit_id"]');
        unitSelect.innerHTML = `
            <option value="">Seçiniz...</option>
            ${units.map(unit => `
                <option value="${unit.id}">${unit.name} (${unit.code})</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Birimler yüklenirken hata:', error);
        showError('Birimler yüklenemedi!');
    }
}

async function loadMaterials() {
    try {
        const response = await fetch(`${API_URL}/materials`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        const tbody = document.querySelector('#materialsTable tbody');
        const materials = selectedCategoryId ? 
            data.materials.filter(m => m.category_id === selectedCategoryId) : 
            data.materials;
        
        if (materials?.length > 0) {
            tbody.innerHTML = materials.map(material => `
                <tr>
                    <td>
                        <div class="fw-bold">${material.name}</div>
                        <small class="text-muted">${material.description || ''}</small>
                    </td>
                    <td>${material.category_name || '-'}</td>
                    <td>${material.unit_code}</td>
                    <td>
                        <span class="badge ${material.current_stock > 0 ? 'bg-success' : 'bg-danger'}">
                            ${material.current_stock} ${material.unit_code}
                        </span>
                    </td>
                    <td>${getStatusBadge(material.status)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-info me-1" 
                                onclick="showStockDetail(${material.id}, '${material.name}')">
                            <i class="bi bi-graph-up"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-primary" 
                                onclick="editMaterial(${material.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Hammadde bulunamadı</td></tr>';
        }
    } catch (error) {
        console.error('Hammaddeler yüklenirken hata:', error);
        showError('Hammaddeler yüklenemedi!');
    }
}

function filterByCategory(categoryId) {
    selectedCategoryId = categoryId;
    loadCategories(); // Aktif kategoriyi güncelle
    loadMaterials(); // Filtrelenmiş listeyi yükle
}

// Modal gösterme fonksiyonunu düzeltelim
function showMaterialModal() {
    materialModal = new bootstrap.Modal(document.getElementById('materialModal'));
    const form = document.getElementById('materialForm');
    form.reset();
    
    // Modal başlığını sıfırla
    document.getElementById('materialModalTitle').textContent = 'Yeni Hammadde';
    currentMaterialId = null;
    
    // Kategori ve birim select'lerini kontrol et
    if (categories.length === 0) loadCategories();
    if (units.length === 0) loadUnits();
    
    materialModal.show();
}

function showCategoryModal() {
    document.getElementById('categoryForm').reset();
    categoryModal.show();
}

async function saveMaterial() {
    const form = document.getElementById('materialForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const data = {
        name: formData.get('name').trim(),
        unit_id: parseInt(formData.get('unit_id')),
        category_id: formData.get('category_id') ? parseInt(formData.get('category_id')) : null,
        description: formData.get('description')?.trim() || null,
        notes: formData.get('notes')?.trim() || null
    };

    try {
        // Endpoint ve method seçimi
        const method = currentMaterialId ? 'PUT' : 'POST';
        const url = currentMaterialId ? 
            `${API_URL}/materials/${currentMaterialId}` : 
            `${API_URL}/materials`;

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        materialModal.hide();
        form.reset();
        currentMaterialId = null; // ID'yi temizle
        await loadMaterials();
        
        showSuccess(`Hammadde başarıyla ${method === 'PUT' ? 'güncellendi' : 'eklendi'}`);
    } catch (error) {
        console.error('Hammadde işlemi hatası:', error);
        showError(error.message);
    }
}

async function saveCategory() {
    const form = document.getElementById('categoryForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        description: formData.get('description') || '',
        display_order: parseInt(formData.get('display_order')) || 0,
        status: 'active'
    };

    try {
        const response = await fetch(`${API_URL}/materials/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API Hatası');
        }
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        categoryModal.hide();
        form.reset();
        await loadCategories();
        showSuccess('Kategori başarıyla eklendi');
    } catch (error) {
        console.error('Kategori kaydedilirken hata:', error);
        showError(error.message);
    }
}

async function editMaterial(id) {
    try {
        currentMaterialId = id; // Güncelleme için ID'yi sakla
        document.getElementById('materialModalTitle').textContent = 'Hammadde Düzenle';
        
        const response = await fetch(`${API_URL}/materials/${id}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        const form = document.getElementById('materialForm');
        const material = data.material;
        
        // Form alanlarını doldur
        form.elements['name'].value = material.name || '';
        form.elements['description'].value = material.description || '';
        form.elements['unit_id'].value = material.unit_id || '';
        form.elements['category_id'].value = material.category_id || '';
        form.elements['status'].value = material.status || 'active';
        form.elements['notes'].value = material.notes || '';
        
        materialModal.show();
    } catch (error) {
        console.error('Hammadde bilgileri yüklenirken hata:', error);
        showError('Hammadde bilgileri yüklenemedi!');
    }
}

async function showStockDetail(id, name) {
    try {
        document.getElementById('detail-material-name').textContent = name;
        
        const response = await fetch(`${API_URL}/materials/${id}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        const tbody = document.getElementById('stockMovementsTable');
        const movements = data.movements || [];
        
        if (movements.length > 0) {
            tbody.innerHTML = movements.map(mov => `
                <tr>
                    <td>${formatDateTime(mov.created_at)}</td>
                    <td>${getMovementTypeBadge(mov.movement_type)}</td>
                    <td>${mov.quantity} ${data.material.unit_code}</td>
                    <td>${getSourceTypeLabel(mov.source_type)}</td>
                    <td>${mov.notes || '-'}</td>
                    <td>${mov.created_by_name}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Hareket bulunamadı</td></tr>';
        }

        stockDetailModal.show();
    } catch (error) {
        console.error('Stok hareketleri yüklenirken hata:', error);
        showError('Stok hareketleri yüklenemedi!');
    }
}

async function toggleStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_URL}/materials/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('API Hatası');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        await loadMaterials();
        showSuccess('Hammadde durumu güncellendi');
    } catch (error) {
        console.error('Durum güncellenirken hata:', error);
        showError('Durum güncellenemedi!');
    }
}

// Helper Functions
function getStatusBadge(status) {
    const badges = {
        'active': '<span class="badge bg-success">Aktif</span>',
        'passive': '<span class="badge bg-warning">Pasif</span>'
    };
    return badges[status] || status;
}

function getMovementTypeBadge(type) {
    const badges = {
        'in': '<span class="badge bg-success">Giriş</span>',
        'out': '<span class="badge bg-danger">Çıkış</span>'
    };
    return badges[type] || type;
}

function getSourceTypeLabel(type) {
    const labels = {
        'purchase': 'Satın Alma',
        'sale': 'Satış',
        'waste': 'Fire',
        'adjustment': 'Düzeltme'
    };
    return labels[type] || type;
}

function showError(message) {
    const toastDiv = document.createElement('div');
    toastDiv.className = 'position-fixed bottom-0 end-0 p-3';
    toastDiv.style.zIndex = '1050';
    toastDiv.innerHTML = `
        <div class="toast align-items-center text-white bg-danger border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-exclamation-circle me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    document.body.appendChild(toastDiv);
    const toast = new bootstrap.Toast(toastDiv.querySelector('.toast'));
    toast.show();
}

function showSuccess(message) {
    const toastDiv = document.createElement('div');
    toastDiv.className = 'position-fixed bottom-0 end-0 p-3';
    toastDiv.style.zIndex = '1050';
    toastDiv.innerHTML = `
        <div class="toast align-items-center text-white bg-success border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-check-circle me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    document.body.appendChild(toastDiv);
    const toast = new bootstrap.Toast(toastDiv.querySelector('.toast'));
    toast.show();
}
