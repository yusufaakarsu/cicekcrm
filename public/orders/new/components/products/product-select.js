class ProductSelect extends BaseComponent {
    constructor(containerId, manager) {
        super(containerId, manager);
        this.state = {
            items: [],
            search: ''
        };
        this.init();
    }

    render() {
        this.container.innerHTML = `
            <div class="row mb-3">
                <div class="col">
                    <div class="input-group">
                        <input type="text" class="form-control" id="productSearch" 
                               placeholder="Ürün ara...">
                        <button class="btn btn-outline-primary" type="button" id="searchBtn">
                            <i class="bi bi-search"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-8">
                    <div id="productList" class="list-group"></div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">Sepet</h6>
                            <div id="cartItems"></div>
                            <hr>
                            <div class="d-flex justify-content-between">
                                <span>Ara Toplam:</span>
                                <strong id="cartTotal">₺0,00</strong>
                            </div>
                            <div class="text-muted small mt-2">
                                Toplam Ürün: <span id="cartCount">0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.searchInput = this.container.querySelector('#productSearch');
        this.productList = this.container.querySelector('#productList');
        this.cartItems = this.container.querySelector('#cartItems');
        this.updateCart();
    }

    setupEventListeners() {
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(this._searchTimeout);
            this._searchTimeout = setTimeout(() => {
                this.searchProducts(e.target.value);
            }, 300);
        });

        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart')) {
                const productData = JSON.parse(e.target.dataset.product);
                this.addToCart(productData);
            }
            if (e.target.classList.contains('remove-from-cart')) {
                const productId = e.target.dataset.productId;
                this.removeFromCart(productId);
            }
        });
    }

    async searchProducts(query) {
        try {
            const response = await fetch(`${API_URL}/products/search?q=${query}`);
            const products = await response.json();
            this.renderProducts(products);
        } catch (error) {
            this.showError('Ürün araması başarısız');
        }
    }

    renderProducts(products) {
        this.productList.innerHTML = products.map(product => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${product.name}</strong>
                        <div class="text-muted small">Stok: ${product.stock}</div>
                    </div>
                    <div>
                        <div class="text-end mb-1">${formatCurrency(product.retail_price)}</div>
                        <button class="btn btn-sm btn-primary add-to-cart" 
                                data-product='${JSON.stringify(product)}'>
                            <i class="bi bi-plus"></i> Ekle
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    addToCart(product) {
        const existingItem = this.state.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.state.items.push({
                id: product.id,
                name: product.name,
                price: product.retail_price,
                quantity: 1
            });
        }

        this.updateCart();
    }

    removeFromCart(productId) {
        this.state.items = this.state.items.filter(item => item.id !== parseInt(productId));
        this.updateCart();
    }

    updateCart() {
        // Sepet UI güncelleme
        this.cartItems.innerHTML = this.state.items.map(item => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <div>${item.name}</div>
                    <small class="text-muted">${item.quantity}x ${formatCurrency(item.price)}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger remove-from-cart" 
                        data-product-id="${item.id}">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `).join('') || '<div class="text-muted">Sepet boş</div>';

        // Toplam hesaplama
        const total = this.state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        this.container.querySelector('#cartTotal').textContent = formatCurrency(total);
        this.container.querySelector('#cartCount').textContent = this.state.items.length;

        // Event emit
        this.emit('cartUpdated', this.state.items);
    }

    getCartItems() {
        return this.state.items;
    }

    validate() {
        return this.state.items.length > 0;
    }
}
