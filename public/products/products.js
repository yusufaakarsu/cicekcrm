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

async function loadProducts(params) {
    try {
        const products = await fetchAPI(`/products?${params}`);
        renderProducts(products);
    } catch (error) {
        console.error('Products loading error:', error);
        showError('Ürünler yüklenemedi');
    }
}

async function applyFilters() {
    const params = new URLSearchParams({
        category: document.getElementById('categoryFilter').value,
        status: document.getElementById('statusFilter').value,
        search: document.getElementById('searchInput').value.trim()
    });

    await loadProducts(params);
}

function renderProducts(products) {
    const tbody = document.getElementById('productsTable');
    
    if (!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Ürün bulunamadı</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr>
            <td>
                <div class="fw-bold">${product.name}</div>
                <small class="text-muted">${product.code || ''}</small>
            </td>
            <td>${product.category_name}</td>
            <td>
                <div class="fw-bold ${product.current_stock <= product.min_stock ? 'text-danger' : ''}">${product.current_stock}</div>
                <small class="text-muted">Min: ${product.min_stock}</small>
            </td>
            <td>
                <div class="fw-bold">${formatCurrency(product.retail_price)}</div>
                <small class="text-muted">Maliyet: ${formatCurrency(product.purchase_price)}</small>
            </td>
            <td>${getProductStatusBadge(product.status)}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editProduct(${product.id})">
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
