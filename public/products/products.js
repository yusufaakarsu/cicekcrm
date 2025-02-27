let categoryModal;

async function initializePage() {
    await loadSideBar();
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
        const response = await fetch(`${API_URL}/products/categories`); // Fixed URL
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

        // Kategori listesini düzenle - silme butonu kaldırıldı
        const list = document.getElementById('categoryList');
        list.innerHTML = categories.map(cat => `
            <tr>
                <td>${cat.name}</td>
                <td><span class="badge bg-info">${cat.product_count || 0}</span></td>
                <td>${getCategoryStatusBadge(cat.status)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editCategory(${cat.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="4" class="text-center">Kategori bulunamadı</td></tr>';

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
        if (!data.success) throw new Error(data.error);

        renderProducts(data.products || []); 
        
    } catch (error) {
        console.error('Products loading error:', error);
        showError('Ürünler yüklenemedi');
        
        const tbody = document.getElementById('productsTable');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Veriler yüklenirken hata oluştu!</td></tr>';
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
    const data = Object.fromEntries(formData);
    const isEdit = !!data.id;

    try {
        const response = await fetch(
            `${API_URL}/products/categories${isEdit ? `/${data.id}` : ''}`, 
            {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }
        );

        if (!response.ok) throw new Error('API Hatası');
        
        await loadCategories();
        resetCategoryForm();
        showSuccess(`Kategori başarıyla ${isEdit ? 'güncellendi' : 'eklendi'}`);
        
    } catch (error) {
        console.error('Category save error:', error);
        showError('Kategori kaydedilemedi');
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

function renderCategories(categories) {
    const tbody = document.getElementById('categoryList');
    
    tbody.innerHTML = categories.map(cat => `
        <tr>
            <td>${cat.name}</td>
            <td><span class="badge bg-info">${cat.product_count || 0}</span></td>
            <td>${getCategoryStatusBadge(cat.status)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editCategory(${cat.id})">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getCategoryStatusBadge(status) {
    return status === 'active' 
        ? '<span class="badge bg-success">Aktif</span>'
        : '<span class="badge bg-secondary">Pasif</span>';
}

async function editCategory(id) {
    try {
        const response = await fetch(`${API_URL}/products/categories/${id}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        const form = document.getElementById('categoryForm');
        form.elements['id'].value = data.category.id;
        form.elements['name'].value = data.category.name;
        form.elements['description'].value = data.category.description || '';
        form.elements['status'].value = data.category.status || 'active';
        
    } catch (error) {
        console.error('Category load error:', error);
        showError('Kategori yüklenemedi');
    }
}

function resetCategoryForm() {
    const form = document.getElementById('categoryForm');
    form.reset();
    form.elements['id'].value = '';
}

// Ürün düzenleme fonksiyonu - Düzenleme seçeneklerini sunar
function editProduct(id) {
    // Kullanıcıya seçenek sun - Hem modal hem de sayfa yönlendirme seçeneği
    const confirmModal = bootstrap.Modal.getOrCreateInstance(
        document.getElementById('confirmEditModal') || createConfirmEditModal()
    );
    
    // Modal'daki düğmelere tıklama olaylarını ekle
    document.getElementById('editInPage').onclick = () => {
        confirmModal.hide();
        window.location.href = `/products/edit-product/edit-product.html?id=${id}`;
    };
    
    document.getElementById('editInModal').onclick = () => {
        confirmModal.hide();
        openEditProductModal(id);
    };
    
    confirmModal.show();
}

// Modal HTML'ini dinamik olarak oluştur
function createConfirmEditModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'confirmEditModal';
    modal.setAttribute('tabindex', '-1');
    
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Ürün Düzenleme</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
                </div>
                <div class="modal-body">
                    <p>Ürünü nasıl düzenlemek istersiniz?</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                    <button type="button" class="btn btn-primary" id="editInModal">
                        <i class="bi bi-window"></i> Modal içinde düzenle
                    </button>
                    <button type="button" class="btn btn-success" id="editInPage">
                        <i class="bi bi-pencil-square"></i> Düzenleme sayfasını aç
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
}

// Ürün düzenleme modali
async function openEditProductModal(id) {
    try {
        // Ürün verisini getir
        const response = await fetch(`${API_URL}/products/${id}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        
        const product = data.product;
        
        // Eğer mevcut değilse, modal HTML'ini oluştur
        if (!document.getElementById('editProductModal')) {
            createEditProductModal();
        }
        
        // Modal örneğini al
        const editModal = bootstrap.Modal.getOrCreateInstance(
            document.getElementById('editProductModal')
        );
        
        // Form alanlarını doldur
        const form = document.getElementById('editProductForm');
        form.elements['id'].value = product.id;
        form.elements['name'].value = product.name;
        form.elements['description'].value = product.description || '';
        form.elements['base_price'].value = product.base_price;
        form.elements['category_id'].value = product.category_id;
        form.elements['status'].value = product.status || 'active';
        
        // Modali göster
        editModal.show();
        
    } catch (error) {
        console.error('Product load error:', error);
        showError(`Ürün yüklenemedi: ${error.message}`);
    }
}

// Düzenleme modal'ını oluştur
function createEditProductModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'editProductModal';
    modal.setAttribute('tabindex', '-1');
    
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Ürün Düzenle</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
                </div>
                <div class="modal-body">
                    <form id="editProductForm">
                        <input type="hidden" name="id">
                        <div class="mb-3">
                            <label class="form-label">Ürün Adı</label>
                            <input type="text" class="form-control" name="name" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Kategori</label>
                            <select class="form-select" name="category_id" required>
                                <option value="">Seçiniz...</option>
                                <!-- Kategoriler JavaScript ile doldurulacak -->
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Fiyat</label>
                            <input type="number" class="form-control" name="base_price" min="0" step="0.01" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Açıklama</label>
                            <textarea class="form-control" name="description" rows="3"></textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Durum</label>
                            <select class="form-select" name="status">
                                <option value="active">Aktif</option>
                                <option value="passive">Pasif</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                    <button type="button" class="btn btn-primary" onclick="updateProduct()">
                        <i class="bi bi-save"></i> Kaydet
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Kategorileri yükle
    loadCategoriesToSelect(document.querySelector('#editProductForm select[name="category_id"]'));
    
    return modal;
}

// Kategori select'ini doldur
async function loadCategoriesToSelect(select) {
    try {
        const response = await fetch(`${API_URL}/products/categories`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        const categories = data.categories || [];
        
        let options = '<option value="">Seçiniz...</option>';
        categories.forEach(cat => {
            options += `<option value="${cat.id}">${cat.name}</option>`;
        });
        
        select.innerHTML = options;
    } catch (error) {
        console.error('Categories loading error:', error);
    }
}

// Ürün güncelleme işlemi
async function updateProduct() {
    const form = document.getElementById('editProductForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const id = data.id;
    
    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: data.name,
                category_id: parseInt(data.category_id),
                base_price: parseFloat(data.base_price),
                description: data.description,
                status: data.status
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'API Hatası');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Güncelleme başarısız');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
        showSuccess('Ürün başarıyla güncellendi');
        loadProducts(); // Ürün listesini yenile
        
    } catch (error) {
        console.error('Product update error:', error);
        showError(`Ürün güncellenemedi: ${error.message}`);
    }
}

// Ürün silme fonksiyonu
async function deleteProduct(id) {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'API Hatası');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Silme işlemi başarısız');
        }
        
        showSuccess('Ürün başarıyla silindi');
        
        // Tabloyu yeniden yükle
        await loadProducts();
        
    } catch (error) {
        console.error('Product delete error:', error);
        showError(`Ürün silinemedi: ${error.message}`);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', initializePage);
