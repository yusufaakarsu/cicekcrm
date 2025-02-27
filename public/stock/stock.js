let materialModal, movementModal, stockDetailModal;
let units = []; // Global birimler listesi
let stockTable;
let currentMaterialId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    loadUnits();
    loadStock();
    loadCategories();
    
    stockDetailModal = new bootstrap.Modal(document.getElementById('stockDetailModal'));
});

// Ham madde listesini yükle
async function loadStock() {
    try {
        const response = await fetch(`${API_URL}/stock/materials`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        const tbody = document.querySelector('#stockTable tbody');
        
        if (data.materials?.length > 0) {
            tbody.innerHTML = data.materials.map(material => {
                const stockStatus = getStockStatus(material);
                
                return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="rounded-circle ${stockStatus.bgColor} me-2" 
                                 style="width: 8px; height: 8px; display: inline-block;"></div>
                            <div>
                                <div class="fw-bold">${material.name}</div>
                                <small class="text-muted">#${material.id}</small>
                            </div>
                        </div>
                    </td>
                    <td>${material.category_name || '-'}</td>
                    <td>
                        <div>${material.unit_name}</div>
                        <small class="text-muted">${material.unit_code}</small>
                    </td>
                    <td class="text-center">
                        <span class="badge ${stockStatus.badge}">
                            ${material.current_stock} ${material.unit_code}
                        </span>
                    </td>
                    <td class="text-center">${material.min_stock || '-'}</td>
                    <td class="text-center">
                        ${formatDateTime(material.last_movement)}
                    </td>
                    <td class="text-end">
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="showStockDetail(${material.id})">
                                <i class="bi bi-search"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="addStockMovement(${material.id})">
                                <i class="bi bi-plus-lg"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Kayıt bulunamadı</td></tr>';
        }

    } catch (error) {
        console.error('Stock loading error:', error);
        showError('Stok bilgileri yüklenemedi!');
    }
}

// Stok durumu helper fonksiyonu
function getStockStatus(material) {
    const stock = material.current_stock || 0;
    const minStock = material.min_stock || 0;

    if (stock <= 0) {
        return {
            badge: 'bg-danger',
            bgColor: 'bg-danger',
            text: 'Stok Yok'
        };
    }

    if (stock <= minStock) {
        return {
            badge: 'bg-warning',
            bgColor: 'bg-warning',
            text: 'Kritik'
        };
    }

    return {
        badge: 'bg-success',
        bgColor: 'bg-success',
        text: 'Normal'
    };
}

// Birimleri yükle
async function loadUnits() {
    try {
        const response = await fetch(`${API_URL}/settings/units`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        units = data.units || [];
    } catch (error) {
        console.error('Units loading error:', error);
        showError('Birimler yüklenemedi');
    }
}

// Stok tablosunu render et
function renderStockTable(materials) {
    const tbody = document.getElementById('stockTable');
    
    if (!materials?.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">Kayıt bulunamadı</td></tr>`;
        return;
    }
    
    tbody.innerHTML = materials.map(material => {
        const current_stock = material.current_stock || 0;
        const min_stock = material.min_stock || 0;
        
        // Stok durumu sınıfını belirle
        const stockClass = getStockStatusClass(current_stock, min_stock);
        
        // Son hareket bilgisi
        const lastMovement = material.last_movement ? {
            date: formatDate(material.last_movement.date),
            type: material.last_movement.type,
            quantity: material.last_movement.quantity
        } : null;

        return `
        <tr>
            <td>
                <div class="fw-bold">${material.name}</div>
                <small class="text-muted">${material.description || ''}</small>
            </td>
            <td>
                <span class="badge bg-secondary">${material.category_name || '-'}</span>
            </td>
            <td>
                <small class="text-muted">Birim:</small> ${material.unit_name}<br>
                <small class="text-muted">Kod:</small> ${material.unit_code}
            </td>
            <td class="text-center">
                <div class="d-flex flex-column align-items-center">
                    <h5 class="mb-1">
                        <span class="badge ${stockClass}">
                            ${current_stock} ${material.unit_code}
                        </span>
                    </h5>
                    <small class="text-${getStockTrendClass(material)}">
                        <i class="bi ${getStockTrendIcon(material)}"></i>
                        ${getStockTrendText(material)}
                    </small>
                </div>
            </td>
            <td class="text-center">
                <div class="d-flex flex-column align-items-center">
                    <span>${min_stock} ${material.unit_code}</span>
                    ${getStockWarning(current_stock, min_stock)}
                </div>
            </td>
            <td class="text-center">
                ${lastMovement ? `
                    <div class="text-muted small">
                        <div>${lastMovement.date}</div>
                        <span class="badge ${getMovementBadgeClass(lastMovement.type)}">
                            ${lastMovement.type === 'in' ? 'Giriş' : 'Çıkış'}:
                            ${lastMovement.quantity} ${material.unit_code}
                        </span>
                    </div>
                ` : '-'}
            </td>
            <td class="text-end">
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="showStockDetail(${material.id}, '${material.name}')">
                        <i class="bi bi-box-arrow-in-right"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" 
                            onclick="showNewMovement(${material.id})">
                        <i class="bi bi-plus-lg"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" 
                            onclick="showHistory(${material.id})">
                        <i class="bi bi-clock-history"></i>
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
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
    const search = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const status = document.getElementById('statusFilter').value;

    const tbody = document.querySelector('#stockTable tbody');
    const rows = tbody.getElementsByTagName('tr');

    Array.from(rows).forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const categoryName = row.cells[1].textContent;
        const stock = parseFloat(row.cells[3].textContent);
        
        let show = true;

        // İsim filtresi
        if (search && !name.includes(search)) {
            show = false;
        }

        // Kategori filtresi
        if (category && !categoryName.includes(category)) {
            show = false;
        }

        // Stok durum filtresi
        if (status) {
            switch (status) {
                case 'ok':
                    if (stock <= 0) show = false;
                    break;
                case 'low':
                    if (stock > 5 || stock <= 0) show = false;
                    break;
                case 'critical':
                    if (stock > 0) show = false;
                    break;
            }
        }

        row.style.display = show ? '' : 'none';
    });
}

function getStockBadgeClass(stock) {
    if (stock <= 0) return 'bg-danger';
    if (stock <= 5) return 'bg-warning';
    return 'bg-success';
}

// Stock kategorilerini yükle
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/materials/categories`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        const select = document.getElementById('categoryFilter');
        select.innerHTML = `
            <option value="">Tümü</option>
            ${data.categories.map(c => `
                <option value="${c.id}">${c.name}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Categories loading error:', error);
        showError('Kategoriler yüklenemedi');
    }
}

// Detay görüntüleme fonksiyonunu ekle
async function showStockDetail(id, name) {
    try {
        document.getElementById('detail-material-name').textContent = name;
        
        const response = await fetch(`${API_URL}/stock/movements/${id}`);
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
                    <td>${mov.quantity} ${mov.unit_code}</td>
                    <td>${getSourceTypeLabel(mov.source_type)}</td>
                    <td>${mov.notes || '-'}</td>
                    <td>${mov.created_by_name || '-'}</td>
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

// Helper fonksiyonlar
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

// Stok durum sınıfını belirle
function getStockStatusClass(current, min) {
    if (current <= 0) return 'bg-danger';
    if (current <= min) return 'bg-warning';
    if (current <= min * 1.5) return 'bg-info';
    return 'bg-success';
}

// Stok trend yönünü belirle
function getStockTrendClass(material) {
    const trend = material.stock_trend || 0;
    if (trend > 0) return 'success';
    if (trend < 0) return 'danger';
    return 'muted';
}

function getStockTrendIcon(material) {
    const trend = material.stock_trend || 0;
    if (trend > 0) return 'bi-arrow-up-circle';
    if (trend < 0) return 'bi-arrow-down-circle';
    return 'bi-dash-circle';
}

function getStockTrendText(material) {
    const trend = material.stock_trend || 0;
    if (trend > 0) return `%${trend} artış`;
    if (trend < 0) return `%${Math.abs(trend)} azalış`;
    return 'Değişim yok';
}

// Stok uyarı mesajı
function getStockWarning(current, min) {
    if (current <= 0) {
        return `<div class="text-danger small">
            <i class="bi bi-exclamation-triangle-fill"></i> Stok tükendi
        </div>`;
    }
    if (current <= min) {
        return `<div class="text-warning small">
            <i class="bi bi-exclamation-circle-fill"></i> Kritik seviye
        </div>`;
    }
    return '';
}

// Hareket badge rengi
function getMovementBadgeClass(type) {
    return type === 'in' ? 'bg-success' : 'bg-danger';
}
