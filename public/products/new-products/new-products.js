let rawMaterials = [];
let categories = [];
let materialSelectorModal;

document.addEventListener('DOMContentLoaded', async () => {
    await loadSideBar();
    await Promise.all([
        loadCategories(),
        loadRawMaterials(),
        loadMaterialCategories() // Yeni eklenen
    ]);
});

// API calls ve temel fonksiyonlar buraya gelecek...

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/products/categories`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        const select = document.querySelector('[name="category_id"]');
        select.innerHTML = `
            <option value="">Seçiniz</option>
            ${data.categories.map(cat => `
                <option value="${cat.id}">${cat.name}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Categories loading error:', error);
        showError('Kategoriler yüklenemedi');
    }
}

async function loadRawMaterials() {
    try {
        const response = await fetch(`${API_URL}/products/raw-materials`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        rawMaterials = data.materials || [];
    } catch (error) {
        console.error('Raw materials loading error:', error);
        showError('Ham maddeler yüklenemedi');
    }
}

// Malzeme kategorilerini yükle
async function loadMaterialCategories() {
    try {
        const response = await fetch(`${API_URL}/materials/categories`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        const select = document.getElementById('categoryFilter');
        select.innerHTML = `
            <option value="">Tüm Kategoriler</option>
            ${data.categories.map(cat => `
                <option value="${cat.id}">${cat.name}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Material categories loading error:', error);
        showError('Kategoriler yüklenemedi');
    }
}

function showMaterialSelector() {
    if (!materialSelectorModal) {
        materialSelectorModal = new bootstrap.Modal(document.getElementById('materialSelectorModal'));
    }
    materialSelectorModal.show();
    renderMaterialsList();
}

function addMaterial(materialId) {
    const material = rawMaterials.find(m => m.id === materialId);
    if (!material) return;
    
    // Zaten ekli mi kontrol et
    const existingRows = document.querySelectorAll(`input[name="materials[][material_id]"][value="${material.id}"]`);
    if (existingRows.length > 0) {
        showError('Bu ham madde zaten eklenmiş!');
        materialSelectorModal.hide();
        return;
    }
    
    const tbody = document.getElementById('materialsTableBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <input type="hidden" name="materials[][material_id]" value="${material.id}">
            ${material.name}
            <div class="small text-muted">${material.unit_name}</div>
        </td>
        <td>
            <div class="input-group input-group-sm">
                <input type="number" 
                       class="form-control" 
                       name="materials[][quantity]"
                       value="1"
                       min="0.01" 
                       step="0.01" 
                       required>
                <span class="input-group-text">${material.unit_name}</span>
            </div>
        </td>
        <td>
            <input type="text" 
                   class="form-control form-control-sm" 
                   name="materials[][notes]"
                   placeholder="Özel not...">
        </td>
        <td>
            <button type="button" 
                    class="btn btn-sm btn-outline-danger"
                    onclick="this.closest('tr').remove()">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
    if (materialSelectorModal) {
        materialSelectorModal.hide();
    }
}

// Ürünü kaydet
async function saveProduct() {
    try {
        // Form verilerini al
        const name = document.getElementById('productName').value.trim();
        const category_id = document.getElementById('categorySelect').value;
        const description = document.getElementById('productDescription').value.trim();
        const base_price = parseFloat(document.getElementById('productPrice').value);
        const status = document.getElementById('productStatus').value;

        // Validasyon
        if (!name || !category_id || isNaN(base_price) || base_price <= 0) {
            showError('Lütfen gerekli alanları doldurun');
            return;
        }

        // DOM seçicilerini iyileştir ve daha güvenli hale getir
        const materials = [];
        const materialRows = document.querySelectorAll('#materialsList .material-row');
        
        // Debug için bilgi
        console.log(`Bulunan malzeme satırı sayısı: ${materialRows.length}`);
        
        if (materialRows.length > 0) {
            materialRows.forEach(row => {
                try {
                    const material_id = row.getAttribute('data-id');
                    
                    // Null kontrolü ekle
                    const quantityElement = row.querySelector('.material-quantity');
                    const notesElement = row.querySelector('.material-notes');
                    
                    if (!material_id || !quantityElement) {
                        console.warn('Eksik malzeme verisi:', row);
                        return; // Bu satırı atla
                    }
                    
                    const quantity = parseFloat(quantityElement.value);
                    const notes = notesElement ? notesElement.value : '';
                    
                    console.log(`Malzeme ekleniyor: ID=${material_id}, Miktar=${quantity}`);
                    
                    if (material_id && !isNaN(quantity) && quantity > 0) {
                        materials.push({
                            material_id: parseInt(material_id),
                            quantity: quantity,
                            notes: notes || ''
                        });
                    }
                } catch (rowError) {
                    console.error('Malzeme satırı işlenirken hata:', rowError, row);
                }
            });
        }

        // API'ye gönderilecek payload
        const payload = {
            name,
            category_id: parseInt(category_id),
            description,
            base_price,
            status,
            materials // Artık güvenli bir şekilde dolu
        };
        
        console.log('Gönderilen veri:', payload); // Debug için

        // API isteği
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API yanıt hatası:', errorData);
            throw new Error(errorData.message || 'API Hatası');
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Kayıt başarısız');
        }

        showSuccess('Ürün başarıyla kaydedildi');
        setTimeout(() => {
            window.location.href = '/products/products.html';
        }, 1500);
        
    } catch (error) {
        console.error('Product save error:', error);
        showError(`Ürün kaydedilemedi: ${error.message}`);
    }
}

// Modal göster ve malzeme listesini yenile
function showMaterialSelector() {
    if (!materialSelectorModal) {
        materialSelectorModal = new bootstrap.Modal(document.getElementById('materialSelectorModal'));
    }
    renderMaterialsList();
    materialSelectorModal.show();
}

// Ham maddeleri filtrele ve listele
function renderMaterialsList() {
    const categoryId = document.getElementById('categoryFilter').value;
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    
    const filtered = rawMaterials.filter(m => {
        const categoryMatch = !categoryId || m.category_id == categoryId;
        const searchMatch = !searchText || m.name.toLowerCase().includes(searchText);
        return categoryMatch && searchMatch;
    });
    
    document.getElementById('materialsList').innerHTML = filtered.length ? 
        filtered.map(m => `
            <div class="col-md-4 mb-2">
                <button type="button" 
                        class="btn btn-outline-primary w-100 text-start"
                        onclick="addMaterial(${m.id})">
                    <div class="fw-bold">${m.name}</div>
                    <small class="text-muted">${m.unit_name}</small>
                </button>
            </div>
        `).join('') :
        '<div class="col-12"><div class="alert alert-info">Ham madde bulunamadı</div></div>';
}

// Malzeme satırını sil
function removeMaterial(button) {
    button.closest('tr').remove();
}

// Hammadde satırı ekle - Zorunlu checkbox'ı kaldırıldı
function addMaterialRow(material) {
    const materialsContainer = document.getElementById('materialsList');
    const row = document.createElement('div');
    row.className = 'material-row card p-3 mb-2';
    row.setAttribute('data-id', material.id);
    
    row.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">${material.name}</h6>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeMaterial(this)">
                <i class="bi bi-trash"></i>
            </button>
        </div>
        <div class="row g-2">
            <div class="col-md-6">
                <label class="form-label small">Miktar (${material.unit_code})</label>
                <input type="number" class="form-control material-quantity" min="0.1" step="0.1" value="1">
            </div>
            <div class="col-md-6">
                <label class="form-label small">Not</label>
                <input type="text" class="form-control material-notes" placeholder="Özel notlar...">
            </div>
        </div>
    `;
    
    materialsContainer.appendChild(row);
}

// Arama ve filtreleme
document.getElementById('categoryFilter')?.addEventListener('change', renderMaterialsList);
document.getElementById('searchInput')?.addEventListener('keyup', renderMaterialsList);

// Hammadde Ekle Modalı
function showMaterialModal() {
    materialModal = new bootstrap.Modal(document.getElementById('materialModal'));
    searchMaterials();
    materialModal.show();
}

// Hammaddeler Ara
function searchMaterials(search = '') {
    try {
        const filtered = rawMaterials.filter(m => 
            !search || m.name.toLowerCase().includes(search.toLowerCase())
        );
        
        const list = document.getElementById('materialList');
        
        if (filtered.length === 0) {
            list.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">Hammadde bulunamadı</td>
                </tr>
            `;
            return;
        }
        
        list.innerHTML = filtered.map(material => `
            <tr>
                <td>${material.name}</td>
                <td>${material.category_name || '-'}</td>
                <td>${material.unit_code}</td>
                <td>${material.current_stock || 0}</td>
                <td>
                    <button type="button" class="btn btn-sm btn-primary"
                            onclick="addMaterialRow(${JSON.stringify(material).replace(/"/g, '&quot;')})">
                        <i class="bi bi-plus"></i> Ekle
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Material search error:', error);
    }
}

// Malzeme Satırı Ekle - "zorunlu" seçeneği kaldırıldı
function addMaterialRow(material) {
    try {
        // Control if material is already added
        const existingRow = document.querySelector(`.material-row[data-id="${material.id}"]`);
        if (existingRow) {
            showError(`${material.name} zaten eklenmiş`);
            if (materialModal) materialModal.hide();
            return;
        }

        const materialsContainer = document.getElementById('materialsList');
        const row = document.createElement('div');
        row.className = 'material-row card p-3 mb-2';
        row.setAttribute('data-id', material.id);
        
        row.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">${material.name}</h6>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeMaterial(this)">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
            <div class="row g-2">
                <div class="col-md-6">
                    <label class="form-label small">Miktar (${material.unit_code})</label>
                    <input type="number" class="form-control material-quantity" min="0.1" step="0.1" value="1">
                </div>
                <div class="col-md-6">
                    <label class="form-label small">Not</label>
                    <input type="text" class="form-control material-notes" placeholder="Özel notlar...">
                </div>
            </div>
        `;
        
        materialsContainer.appendChild(row);
        
        // Modal varsa kapat
        if (materialModal) materialModal.hide();
        
    } catch (error) {
        console.error('Error adding material row:', error);
        showError('Hammadde eklenirken hata oluştu');
    }
}
