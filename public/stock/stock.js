let materialModal, movementModal;
let units = []; // Global birimler listesi

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    loadUnits();
    loadStock();
});

// Ham madde listesini yükle
async function loadStock() {
    try {
        const response = await fetch(`${API_URL}/stock/materials`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        renderStockTable(data.materials);
    } catch (error) {
        console.error('Stock loading error:', error);
        showError('Stok bilgileri yüklenemedi');
    }
}

// Birimleri yükle
async function loadUnits() {
    try {
        const response = await fetch(`${API_URL}/stock/units`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        units = data.units || [];
        
        // Birim filtresini doldur
        const unitFilter = document.getElementById('unitFilter');
        unitFilter.innerHTML = `
            <option value="">Tümü</option>
            ${units.map(unit => `
                <option value="${unit.id}">${unit.name}</option>
            `).join('')}
        `;
        
        // Form select'lerini doldur
        const unitSelects = document.querySelectorAll('select[name="unit_id"]');
        unitSelects.forEach(select => {
            select.innerHTML = `
                <option value="">Seçiniz</option>
                ${units.map(unit => `
                    <option value="${unit.id}">${unit.name}</option>
                `).join('')}
            `;
        });
    } catch (error) {
        console.error('Units loading error:', error);
        showError('Birimler yüklenemedi');
    }
}

// Stok tablosunu render et
function renderStockTable(materials) {
    const tbody = document.getElementById('stockTable');
    
    if (!materials || materials.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="7" class="text-center">Kayıt bulunamadı</td></tr>
        `;
        return;
    }
    
    tbody.innerHTML = materials.map(material => `
        <tr>
            <td>${material.name}</td>
            <td>${material.unit_name}</td>
            <td>
                <span class="badge bg-${getStockLevelClass(material)}">
                    ${material.current_stock} ${material.unit_code}
                </span>
            </td>
            <td>${material.min_stock || '-'} ${material.unit_code}</td>
            <td>${getStatusBadge(material.status)}</td>
            <td>${material.last_movement ? formatDateTime(material.last_movement) : '-'}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary me-1" 
                            onclick="editMaterial(${material.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info me-1" 
                            onclick="showMovementHistory(${material.id})">
                        <i class="bi bi-clock-history"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" 
                            onclick="quickMovement(${material.id})">
                        <i class="bi bi-plus-lg"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Stok seviyesine göre renk class'ı
function getStockLevelClass(material) {
    if (!material.min_stock) return 'info';
    
    const stock = parseFloat(material.current_stock);
    const minStock = parseFloat(material.min_stock);
    
    if (stock <= minStock * 0.5) return 'danger';
    if (stock <= minStock) return 'warning';
    return 'success';
}

// Durum badge'i
function getStatusBadge(status) {
    const badges = {
        'active': '<span class="badge bg-success">Aktif</span>',
        'passive': '<span class="badge bg-secondary">Pasif</span>',
        'archived': '<span class="badge bg-dark">Arşiv</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

// Yeni ham madde modalını göster
function showNewMaterialModal() {
    materialModal = new bootstrap.Modal(document.getElementById('materialModal'));
    document.getElementById('materialForm').reset();
    materialModal.show();
}

// Ham madde kaydet
async function saveMaterial() {
    const form = document.getElementById('materialForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_URL}/stock/materials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');

        materialModal.hide();
        await loadStock();
        showSuccess('Ham madde başarıyla eklendi');
    } catch (error) {
        console.error('Material save error:', error);
        showError('Ham madde eklenemedi');
    }
}

// Yeni stok hareketi modalını göster
function showNewMovementModal() {
    movementModal = new bootstrap.Modal(document.getElementById('movementModal'));
    document.getElementById('movementForm').reset();
    movementModal.show();
}

// Stok hareketi kaydet
async function saveMovement() {
    const form = document.getElementById('movementForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_URL}/stock/movements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');

        movementModal.hide();
        await loadStock();
        showSuccess('Stok hareketi başarıyla kaydedildi');
    } catch (error) {
        console.error('Movement save error:', error);
        showError('Stok hareketi kaydedilemedi');
    }
}

// Filtreleri uygula
function applyFilters() {
    loadStock();
}
