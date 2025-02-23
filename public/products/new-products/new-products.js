let rawMaterials = [];
let categories = [];
let materialSelectorModal;

document.addEventListener('DOMContentLoaded', async () => {
    await loadSideBar();
    await Promise.all([
        loadCategories(),
        loadRawMaterials()
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

function showMaterialSelector() {
    if (!materialSelectorModal) {
        materialSelectorModal = new bootstrap.Modal(document.getElementById('materialSelectorModal'));
    }
    
    renderMaterialsList();
    materialSelectorModal.show();
}

function addMaterial(materialId) {
    const material = rawMaterials.find(m => m.id === materialId);
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

async function saveProduct() {
    const form = document.getElementById('productForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Malzemeleri ekle
    data.materials = Array.from(document.querySelectorAll('#materialsTableBody tr')).map(row => ({
        material_id: row.querySelector('input[name="materials[][material_id]"]').value,
        quantity: parseFloat(row.querySelector('input[name="materials[][quantity]"]').value),
        is_required: row.querySelector('input[name="materials[][is_required]"]').checked
    }));

    try {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');
        
        showSuccess('Ürün başarıyla kaydedildi');
        setTimeout(() => {
            window.location.href = '/products/products.html';
        }, 1000);
    } catch (error) {
        console.error('Product save error:', error);
        showError('Ürün kaydedilemedi');
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

// Ham madde ekle
function addMaterial(materialId) {
    const material = rawMaterials.find(m => m.id === materialId);
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
    const form = document.getElementById('productForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Form verilerini al
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Malzemeleri ekle
    data.materials = Array.from(document.querySelectorAll('.material-row')).map(row => ({
        material_id: row.querySelector('.material-select').value,
        quantity: parseFloat(row.querySelector('.quantity-input').value),
        notes: row.querySelector('input[type="text"]').value
    })).filter(m => m.material_id && m.quantity);

    try {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        showSuccess('Ürün başarıyla kaydedildi');
        setTimeout(() => {
            window.location.href = '/products/products.html';
        }, 1000);

    } catch (error) {
        console.error('Product save error:', error);
        showError('Ürün kaydedilemedi');
    }
}

// Arama ve filtreleme
document.getElementById('categoryFilter')?.addEventListener('change', renderMaterialsList);
document.getElementById('searchInput')?.addEventListener('keyup', renderMaterialsList);

function addMaterial() {
    const template = document.getElementById('materialRowTemplate');
    const container = document.getElementById('materialsList');
    
    const clone = template.content.cloneNode(true);
    const select = clone.querySelector('.material-select');
    
    // Ham maddeleri select'e doldur
    select.innerHTML = `
        <option value="">Malzeme Seçin</option>
        ${rawMaterials.map(m => `
            <option value="${m.id}" data-unit="${m.unit_name}" data-price="${m.unit_price}">
                ${m.name}
            </option>
        `).join('')}
    `;
    
    // Event listeners
    select.addEventListener('change', updateUnitAndCalculate);
    clone.querySelector('.quantity-input').addEventListener('input', calculateTotalCost);
    
    container.appendChild(clone);
}

function removeMaterial(button) {
    button.closest('.material-row').remove();
    calculateTotalCost();
}

function updateUnitAndCalculate(event) {
    const row = event.target.closest('.material-row');
    const option = event.target.selectedOptions[0];
    const unitText = row.querySelector('.unit-text');
    
    unitText.textContent = option.dataset.unit || '-';
    calculateTotalCost();
}

function calculateTotalCost() {
    let materialCost = 0;
    
    // Malzeme maliyetlerini topla
    document.querySelectorAll('.material-row').forEach(row => {
        const select = row.querySelector('.material-select');
        const quantity = parseFloat(row.querySelector('.quantity-input').value) || 0;
        const price = parseFloat(select.selectedOptions[0]?.dataset.price) || 0;
        
        materialCost += quantity * price;
    });

    // İşçilik maliyetini ekle
    const laborCost = parseFloat(document.querySelector('[name="labor_cost"]').value) || 0;
    const totalCost = materialCost + laborCost;

    // Maliyetleri göster
    document.getElementById('materialCost').value = materialCost.toFixed(2);
    document.getElementById('totalCost').value = totalCost.toFixed(2);
}
