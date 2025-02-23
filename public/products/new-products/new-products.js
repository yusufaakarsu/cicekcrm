let materials = []; // Tüm ham maddeler
let categories = []; // Kategoriler
let materialSelectorModal;

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    loadCategories();
    loadMaterials();
    initForm();
});

// Form init
function initForm() {
    const form = document.getElementById('productForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveProduct();
    });
}

// Kategorileri yükle
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/products/categories`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        categories = data.categories || [];
        
        // Kategori dropdownını doldur
        const select = document.querySelector('select[name="category_id"]');
        select.innerHTML = `
            <option value="">Seçiniz</option>
            ${categories.map(c => `
                <option value="${c.id}">${c.name}</option>
            `).join('')}
        `;
        
        // Filter dropdown
        document.getElementById('categoryFilter').innerHTML = `
            <option value="">Tüm Kategoriler</option>
            ${categories.map(c => `
                <option value="${c.id}">${c.name}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Categories error:', error);
        showError('Kategoriler yüklenemedi');
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
        console.error('Materials error:', error);
        showError('Ham maddeler yüklenemedi');
    }
}

// Modal göster
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
    
    const filtered = materials.filter(m => {
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

// Ham madde ekle
function addMaterial(materialId) {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;
    
    // Zaten ekli mi kontrol et
    const existingRow = document.querySelector(`input[value="${material.id}"]`);
    if (existingRow) {
        showError('Bu ham madde zaten eklenmiş!');
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
            <div class="form-check">
                <input class="form-check-input" 
                       type="checkbox"
                       name="materials[][is_required]"
                       checked>
            </div>
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
    materialSelectorModal.hide();
}

// Ürünü kaydet
async function saveProduct() {
    try {
        const form = document.getElementById('productForm');
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        // Form verilerini topla
        const formData = {
            name: form.querySelector('[name="name"]').value,
            description: form.querySelector('[name="description"]').value || null,
            category_id: parseInt(form.querySelector('[name="category_id"]').value),
            base_price: parseFloat(form.querySelector('[name="base_price"]').value),
            materials: []
        };

        // Malzemeleri topla
        document.querySelectorAll('#materialsTableBody tr').forEach(row => {
            const material_id = parseInt(row.querySelector('[name$="[material_id]"]').value);
            const quantity = parseFloat(row.querySelector('[name$="[quantity]"]').value);
            const is_required = row.querySelector('[name$="[is_required]"]').checked;
            
            if (!material_id || !quantity) return;
            formData.materials.push({ material_id, quantity, is_required });
        });

        if (!formData.materials.length) {
            throw new Error('En az bir malzeme eklemelisiniz');
        }

        // API'ye gönder
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('API Hatası');
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'API Hatası');
        }

        showSuccess('Ürün başarıyla oluşturuldu');
        setTimeout(() => {
            window.location.href = '/products/products.html';
        }, 1000);

    } catch (error) {
        console.error('Save error:', error);
        showError('Ürün kaydedilemedi: ' + error.message);
    }
}

// Arama ve filtreleme
document.getElementById('categoryFilter')?.addEventListener('change', renderMaterialsList);
document.getElementById('searchInput')?.addEventListener('keyup', renderMaterialsList);
