class ProductManager {
    constructor() {
        this.items = [];
        this.step = document.getElementById('step3Status');
        this.container = document.createElement('div');
        this.container.className = 'mb-4';
        document.getElementById('orderForm').appendChild(this.container);
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">3. Ürün ve Ödeme</h6>
                    <button type="button" class="btn btn-sm btn-primary" id="productSearchBtn">
                        <i class="bi bi-plus-lg"></i> Ürün Ekle
                    </button>
                </div>
                <div class="card-body p-0">
                    <!-- Ürün Tablosu -->
                    <div class="table-responsive">
                        <table class="table table-sm mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Ürün</th>
                                    <th width="100">Adet</th>
                                    <th width="120" class="text-end">Fiyat</th>
                                    <th width="120" class="text-end">Toplam</th>
                                    <th width="40"></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderItems()}
                            </tbody>
                            <tfoot class="table-light">
                                <tr>
                                    <td colspan="3" class="text-end">Ara Toplam:</td>
                                    <td class="text-end" id="subtotal">₺0,00</td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td colspan="3" class="text-end">Teslimat:</td>
                                    <td class="text-end" id="deliveryFee">₺50,00</td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td colspan="3" class="text-end"><strong>Genel Toplam:</strong></td>
                                    <td class="text-end"><strong id="total" class="text-primary">₺50,00</strong></td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <!-- Notlar ve Ödeme -->
                <div class="card-footer">
                    <div class="row">
                        <div class="col-md-8">
                            <div class="mb-3">
                                <label class="form-label">Kart Mesajı</label>
                                <textarea class="form-control form-control-sm" id="cardMessage" rows="2"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Sipariş Notu</label>
                                <textarea class="form-control form-control-sm" id="orderNotes" rows="2"></textarea>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Ödeme Yöntemi</label>
                            <select class="form-select form-select-sm mb-3" id="paymentMethod" required>
                                <option value="">Seçiniz</option>
                                <option value="cash">Nakit</option>
                                <option value="credit_card">Kredi Kartı</option>
                                <option value="bank_transfer">Havale/EFT</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Ürün arama butonunu aktif et
        document.getElementById('productSearchBtn')?.addEventListener('click', () => this.showProductModal());
    }

    setupListeners() {
        const addBtn = document.getElementById('addProductBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addProduct());
        }
    }

    renderItems() {
        return this.items.map((item, index) => `
            <tr>
                <td>${item.name}</td>
                <td>
                    <input type="number" class="form-control form-control-sm" 
                           value="${item.quantity}" min="1" 
                           onchange="productManager.updateQuantity(${index}, this.value)">
                </td>
                <td class="text-end">${formatCurrency(item.price)}</td>
                <td class="text-end">${formatCurrency(item.price * item.quantity)}</td>
                <td>
                    <button type="button" class="btn btn-sm btn-outline-danger" 
                            onclick="productManager.removeItem(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async addProduct() {
        try {
            const response = await fetch(`${API_URL}/products`);
            const products = await response.json();

            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Ürün Seç</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="list-group">
                                ${products.map(p => `
                                    <button type="button" class="list-group-item list-group-item-action"
                                            onclick="productManager.selectProduct(${JSON.stringify(p)})">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>${p.name}</strong>
                                                <small class="d-block text-muted">${p.description || ''}</small>
                                            </div>
                                            <strong class="text-primary">${formatCurrency(p.retail_price)}</strong>
                                        </div>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();

            modal.addEventListener('hidden.bs.modal', () => {
                document.body.removeChild(modal);
            });
        } catch (error) {
            showError('Ürünler yüklenemedi');
        }
    }

    selectProduct(product) {
        this.items.push({
            id: product.id,
            name: product.name,
            price: product.retail_price,
            quantity: 1
        });

        const modal = bootstrap.Modal.getInstance(document.querySelector('.modal'));
        modal.hide();

        this.render();
        this.updateStatus();
    }

    updateQuantity(index, quantity) {
        this.items[index].quantity = parseInt(quantity) || 1;
        this.render();
        this.updateStatus();
    }

    removeItem(index) {
        this.items.splice(index, 1);
        this.render();
        this.updateStatus();
    }

    updateStatus() {
        let total = 0;
        this.items.forEach(item => {
            total += item.price * item.quantity;
        });

        document.getElementById('subtotal').textContent = formatCurrency(total);
        document.getElementById('total').textContent = formatCurrency(total + 50);

        // Adım göstergesini güncelle
        this.step.innerHTML = this.items.length 
            ? `<i class="bi bi-check-circle text-success"></i> ${formatCurrency(total + 50)}`
            : '₺0,00';
    }

    getItems() {
        return this.items.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price
        }));
    }

    clear() {
        this.items = [];
        this.render();
        this.updateStatus();
    }
}

window.productManager = new ProductManager();
