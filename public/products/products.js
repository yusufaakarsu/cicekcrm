let categoryModal;
let productModal;
let rawMaterials = []; // Ham maddeleri global tutacağız

async function initializePage() {
    await loadHeader(); // common.js'ten gelen header yükleme fonksiyonu
    await loadRawMaterials(); // Ham maddeleri yükle
    await loadCategories();
    await loadProducts();

    // Event listeners
    document.getElementById('searchInput').addEventListener('keyup', debounce(applyFilters, 500));
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    
    // Kategori form submit
    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveCategory(new FormData(e.target));
    });
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/products/categories`); // URL düzeltildi
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        const categories = data.categories || [];

        // Filtre select'ini doldur
        const select = document.getElementById('categoryFilter');
        select.innerHTML = `
            <option value="">Tümü</option>
            ${categories.map(cat => `
                <option value="${cat.id}">${cat.name}</option>
            `).join('')}
        `;

        // Kategori listesini doldur
        const list = document.getElementById('categoryList');
        list.innerHTML = categories.map(cat => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0">${cat.name}</h6>
                    <small class="text-muted">${cat.description || ''}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${cat.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `).join('') || '<div class="list-group-item text-center">Kategori bulunamadı</div>';

    } catch (error) {
        console.error('Categories loading error:', error);
        showError('Kategoriler yüklenemedi');
    }
}

// Filtreleme için products endpoint'ini güncelle
async function loadProducts() {
    try {
        const categoryId = document.getElementById('categoryFilter').value;
        const status = document.getElementById('statusFilter').value;
        const search = document.getElementById('searchInput').value.trim();

        const params = new URLSearchParams();
        if (categoryId) params.append('category_id', categoryId);
        if (status) params.append('status', status);
        if (search) params.append('search', search);

        const response = await fetch(`${API_URL}/products?${params}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        renderProducts(data.products); // data.products'ı gönder
    } catch (error) {
        console.error('Products loading error:', error);
        showError('Ürünler yüklenemedi');
    }
}

// Filtreleri uygula
async function applyFilters() {
    await loadProducts();
}

// Ürünleri renderla
function renderProducts(products) {
    const tbody = document.getElementById('productsTable');
    
    if (!Array.isArray(products) || products.length === 0) { // Array kontrolü ekle
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Ürün bulunamadı</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>${product.category_name || '-'}</td>
            <td>${formatCurrency(product.base_price)}</td>
            <td>
                <span class="badge bg-info">
                    ${product.recipe_count || 0} reçete
                </span>
            </td>
            <td>${getProductStatusBadge(product.status)}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct(${product.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${product.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getProductStatusBadge(status) {
    const badges = {
        'active': '<span class="badge bg-success">Aktif</span>',
        'passive': '<span class="badge bg-secondary">Pasif</span>',
        'out_of_stock': '<span class="badge bg-danger">Stok Dışı</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

function showCategoryModal() {
    categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
    document.getElementById('categoryForm').reset();
    categoryModal.show();
}

async function saveCategory(formData) {
    try {
        const response = await fetch(`${API_URL}/products/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(formData))
        });

        if (!response.ok) throw new Error('API Hatası');

        await loadCategories();
        document.getElementById('categoryForm').reset();
        showSuccess('Kategori başarıyla eklendi');
    } catch (error) {
        console.error('Category save error:', error);
        showError('Kategori eklenemedi');
    }
}

async function deleteCategory(id) {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;

    try {
        const response = await fetch(`${API_URL}/products/categories/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('API Hatası');

        await loadCategories();
        showSuccess('Kategori başarıyla silindi');
    } catch (error) {
        console.error('Category delete error:', error);
        showError('Kategori silinemedi');
    }
}

// Debounce fonksiyonu
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Ürün modalını göster
function showProductModal(id = null) {
    productModal = new bootstrap.Modal(document.getElementById('productModal'));
    const form = document.getElementById('productForm');
    const title = document.getElementById('modalTitle');
    
    // Form resetle
    form.reset();
    form.elements['id'].value = '';
    
    // Kategorileri yükle
    loadCategoriesForSelect();
    
    if (id) {
        // Düzenleme modu
        title.textContent = 'Ürün Düzenle';
        loadProductDetails(id);
    } else {
        // Yeni ürün modu
        title.textContent = 'Yeni Ürün';
    }
    
    productModal.show();
}

// Select için kategorileri yükle
async function loadCategoriesForSelect() {
    try {
        const response = await fetch(`${API_URL}/products/categories`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        const categories = data.categories || [];
        
        const select = document.querySelector('#productForm select[name="category_id"]');
        select.innerHTML = `
            <option value="">Seçiniz</option>
            ${categories.map(cat => `
                <option value="${cat.id}">${cat.name}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Categories loading error:', error);
        showError('Kategoriler yüklenemedi');
    }
}

// Ürün detaylarını yükle (düzenleme için)
async function loadProductDetails(id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const product = await response.json();
        const form = document.getElementById('productForm');
        
        // Form alanlarını doldur
        form.elements['id'].value = product.id;
        form.elements['name'].value = product.name;
        form.elements['category_id'].value = product.category_id;
        form.elements['description'].value = product.description || '';
        form.elements['base_price'].value = product.base_price;
        form.elements['status'].value = product.status;
        
    } catch (error) {
        console.error('Product loading error:', error);
        showError('Ürün bilgileri yüklenemedi');
        productModal.hide();
    }
}

// Ürün kaydet/güncelle
async function saveProduct() {
    const form = document.getElementById('productForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Form verilerini al
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Reçete verilerini ekle
    data.recipe = {
        labor_cost: parseFloat(data.labor_cost) || 0,
        preparation_time: parseInt(data.preparation_time) || null,
        instructions: data.instructions,
        items: Array.from(document.querySelectorAll('.recipe-item')).map(item => ({
            material_id: item.querySelector('.material-select').value,
            quantity: parseFloat(item.querySelector('.quantity-input').value),
            notes: item.querySelector('input[type="text"]').value
        })).filter(item => item.material_id && item.quantity)
    };

    const isEdit = !!data.id;

    try {
        const url = `${API_URL}/products${isEdit ? `/${data.id}` : ''}`;
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');

        productModal.hide();
        await loadProducts();
        showSuccess(`Ürün başarıyla ${isEdit ? 'güncellendi' : 'eklendi'}`);
    } catch (error) {
        console.error('Product save error:', error);
        showError('Ürün kaydedilemedi');
    }
}

// Ürün silme fonksiyonu
async function deleteProduct(id) {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('API Hatası');

        await loadProducts();
        showSuccess('Ürün başarıyla silindi');
    } catch (error) {
        console.error('Product delete error:', error);
        showError('Ürün silinemedi');
    }
}

// Ham maddeleri yükle
async function loadRawMaterials() {
    try {
        const response = await fetch(`${API_URL}/products/raw-materials`); 
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        rawMaterials = data.materials || [];
    } catch (error) {
        console.error('Raw materials loading error:', error);
        showError('Ham maddeler yüklenemedi');
    }
}

// Reçeteye yeni malzeme satırı ekle
function addRecipeItem() {
    const template = document.getElementById('recipeItemTemplate');
    const container = document.getElementById('recipeItems');
    
    const clone = template.content.cloneNode(true);
    const select = clone.querySelector('.material-select');
    
    // Ham maddeleri select'e doldur
    select.innerHTML = `
        <option value="">Malzeme Seçin</option>
        ${rawMaterials.map(m => `
            <option value="${m.id}" data-unit="${m.unit_name}">
                ${m.name}
            </option>
        `).join('')}
    `;
    
    // Malzeme seçildiğinde birim güncellensin
    select.addEventListener('change', (e) => {
        const unit = e.target.selectedOptions[0].dataset.unit;
        const unitText = e.target.closest('.recipe-item').querySelector('.unit-text');
        unitText.textContent = unit || '-';
    });

    container.appendChild(clone);
    calculateTotalCost(); // Maliyeti güncelle
}

// Reçete malzemesini kaldır
function removeRecipeItem(button) {
    button.closest('.recipe-item').remove();
    calculateTotalCost(); // Maliyeti güncelle
}

// Toplam maliyeti hesapla
function calculateTotalCost() {
    const recipeItems = document.querySelectorAll('.recipe-item');
    let totalCost = 0;
    
    recipeItems.forEach(item => {
        const materialId = item.querySelector('.material-select').value;
        const quantity = parseFloat(item.querySelector('.quantity-input').value) || 0;
        
        const material = rawMaterials.find(m => m.id == materialId);
        if (material) {
            totalCost += material.unit_price * quantity;
        }
    });

    // İşçilik maliyetini ekle
    const laborCost = parseFloat(document.querySelector('[name="labor_cost"]').value) || 0;
    totalCost += laborCost;

    // Maliyeti göster
    document.getElementById('cost').value = totalCost.toFixed(2);
}

// Initialize
document.addEventListener('DOMContentLoaded', initializePage);
