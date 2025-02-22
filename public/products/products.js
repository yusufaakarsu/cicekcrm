let categoryModal;

async function initializePage() {
    await loadHeader(); // common.js'ten gelen header yükleme fonksiyonu
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
        const response = await fetch(`${API_URL}/products/categories`);
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

// Initialize
document.addEventListener('DOMContentLoaded', initializePage);
