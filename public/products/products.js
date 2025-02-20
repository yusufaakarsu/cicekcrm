document.addEventListener('DOMContentLoaded', () => {
    initializePage();
});

async function initializePage() {
    await loadHeader();
    await loadCategories();
    await loadProducts();
}

async function loadCategories() {
    try {
        const categories = await fetchAPI('/products/categories');
        const select = document.getElementById('categoryFilter');
        
        select.innerHTML = `
            <option value="">Tümü</option>
            ${categories.map(cat => `
                <option value="${cat.id}">${cat.name}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Categories loading error:', error);
        showError('Kategoriler yüklenemedi');
    }
}

async function loadProducts() {
    try {
        const params = new URLSearchParams({
            category: document.getElementById('categoryFilter').value,
            status: document.getElementById('statusFilter').value,
            search: document.getElementById('searchInput').value
        });

        const products = await fetchAPI(`/products?${params}`);
        renderProducts(products);
    } catch (error) {
        console.error('Products loading error:', error);
        showError('Ürünler yüklenemedi');
    }
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

// ... Modal ve diğer fonksiyonlar eklenecek ...
