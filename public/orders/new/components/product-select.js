class ProductSelect {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.items = []; // Seçilen ürünler
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.loadProducts();
    }

    render() {
        this.container.innerHTML = `
            <div class="row g-3">
                <!-- Ürün Arama -->
                <div class="col-md-8">
                    <div class="input-group">
                        <input type="text" class="form-control" id="productSearch" 
                               placeholder="Ürün ara...">
                        <button class="btn btn-primary" type="button" id="searchProductBtn">
                            <i class="bi bi-search"></i>
                        </button>
                    </div>
                    <!-- Ürün Sonuçları -->
                    <div id="productResults" class="list-group mt-2" style="display:none">
                    </div>
                </div>

                <!-- Sepet Özeti -->
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body p-2">
                            <div class="d-flex justify-content-between mb-2">
                                <span>Ara Toplam:</span>
                                <strong id="cartSubtotal">₺0,00</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Toplam Ürün:</span>
                                <strong id="cartCount">0</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Seçili Ürünler -->
                <div class="col-12">
                    <div class="table-responsive">
                        <table class="table table-sm" id="selectedProducts">
                            <thead>
                                <tr>
                                    <th>Ürün</th>
                                    <th style="width:100px">Adet</th>
                                    <th style="width:120px">Fiyat</th>
                                    <th style="width:120px">Toplam</th>
                                    <th style="width:40px"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colspan="5" class="text-center text-muted">
                                        Henüz ürün eklenmedi
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const searchInput = document.getElementById('productSearch');
        const searchBtn = document.getElementById('searchProductBtn');

        // Ürün arama
        let timeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            const query = e.target.value;
            
            if (query.length >= 2) {
                timeout = setTimeout(() => this.searchProducts(query), 300);
            } else {
                document.getElementById('productResults').style.display = 'none';
            }
        });

        searchBtn.addEventListener('click', () => {
            const query = searchInput.value;
            if (query.length >= 2) {
                this.searchProducts(query);
            }
        });

        // Sonuçlar dışında bir yere tıklandığında
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#productResults') && !e.target.closest('#productSearch')) {
                document.getElementById('productResults').style.display = 'none';
            }
        });
    }

    async loadProducts() {
        try {
            const response = await fetch(`${API_URL}/products`);
            if (!response.ok) throw new Error('API Hatası');
            
            this.products = await response.json();
        } catch (error) {
            console.error('Ürünler yüklenirken hata:', error);
            showError('Ürünler yüklenemedi!');
        }
    }

    searchProducts(query) {
        if (!this.products) return;

        const results = this.products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.sku?.toLowerCase().includes(query.toLowerCase())
        );

        const resultsDiv = document.getElementById('productResults');
        resultsDiv.style.display = 'block';

        if (results.length === 0) {
            resultsDiv.innerHTML = `
                <div class="list-group-item text-muted">
                    Ürün bulunamadı
                </div>
            `;
            return;
        }

        resultsDiv.innerHTML = results.map(product => `
            <button type="button" class="list-group-item list-group-item-action"
                    onclick="productSelect.addProduct(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${product.name}</strong><br>
                        <small class="text-muted">Stok: ${product.stock}</small>
                    </div>
                    <div class="text-end">
                        <strong>${formatCurrency(product.retail_price)}</strong>
                    </div>
                </div>
            </button>
        `).join('');
    }

    addProduct(product) {
        // Ürün zaten sepette mi kontrol et
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.retail_price,
                quantity: 1
            });
        }

        this.updateCart();
        document.getElementById('productResults').style.display = 'none';
        document.getElementById('productSearch').value = '';
    }

    removeProduct(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.updateCart();
    }

    updateQuantity(productId, newQuantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = parseInt(newQuantity) || 1;
            this.updateCart();
        }
    }

    updateCart() {
        const tbody = document.querySelector('#selectedProducts tbody');
        
        if (this.items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        Henüz ürün eklenmedi
                    </td>
                </tr>
            `;
            document.getElementById('cartSubtotal').textContent = formatCurrency(0);
            document.getElementById('cartCount').textContent = '0';
            return;
        }

        tbody.innerHTML = this.items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>
                    <input type="number" class="form-control form-control-sm" 
                           value="${item.quantity}" min="1"
                           onchange="productSelect.updateQuantity(${item.id}, this.value)">
                </td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.price * item.quantity)}</td>
                <td>
                    <button type="button" class="btn btn-sm btn-outline-danger"
                            onclick="productSelect.removeProduct(${item.id})">
                        <i class="bi bi-x"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Toplam değerleri güncelle
        const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const count = this.items.reduce((sum, item) => sum + item.quantity, 0);

        document.getElementById('cartSubtotal').textContent = formatCurrency(subtotal);
        document.getElementById('cartCount').textContent = count.toString();

        // Event'i tetikle
        document.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: this.items
        }));
    }

    getItems() {
        return this.items;
    }

    validate() {
        return this.items.length > 0;
    }
}

// Global instance
window.productSelect = new ProductSelect('productSelectContainer');
