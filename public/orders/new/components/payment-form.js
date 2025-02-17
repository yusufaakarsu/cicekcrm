class PaymentForm {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.state = {
            method: 'cash',
            status: 'pending'
        };
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="row g-3">
                <!-- Ödeme Yöntemi -->
                <div class="col-md-6">
                    <label class="form-label">Ödeme Yöntemi *</label>
                    <select class="form-select" id="paymentMethod" required>
                        <option value="cash">Nakit</option>
                        <option value="credit_card">Kredi Kartı</option>
                        <option value="bank_transfer">Havale/EFT</option>
                    </select>
                </div>

                <!-- Tutar Detayları -->
                <div class="col-md-6">
                    <div class="card bg-light">
                        <div class="card-body p-2">
                            <div class="d-flex justify-content-between mb-2">
                                <span>Ara Toplam:</span>
                                <strong id="subtotal">₺0,00</strong>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span>Teslimat Ücreti:</span>
                                <strong id="deliveryFee">₺0,00</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>İndirim:</span>
                                <strong id="discount" class="text-success">-₺0,00</strong>
                            </div>
                            <hr class="my-2">
                            <div class="d-flex justify-content-between">
                                <span class="fw-bold">Toplam:</span>
                                <strong id="total" class="text-primary">₺0,00</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- İndirim Kuponu -->
                <div class="col-md-6">
                    <label class="form-label">İndirim Kuponu</label>
                    <div class="input-group">
                        <input type="text" class="form-control" id="discountCode" 
                               placeholder="Kupon kodu">
                        <button class="btn btn-outline-primary" type="button" id="applyDiscount">
                            Uygula
                        </button>
                    </div>
                </div>

                <!-- Ödeme Notu -->
                <div class="col-md-6">
                    <label class="form-label">Ödeme Notu</label>
                    <textarea class="form-control" id="paymentNote" rows="1"></textarea>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Ödeme yöntemi değişimi
        document.getElementById('paymentMethod').addEventListener('change', (e) => {
            this.state.method = e.target.value;
            this.emitChange();
        });

        // İndirim kuponu uygulama
        document.getElementById('applyDiscount').addEventListener('click', () => {
            const code = document.getElementById('discountCode').value;
            if (code) {
                this.applyDiscountCode(code);
            }
        });

        // Not değişimi
        document.getElementById('paymentNote').addEventListener('change', (e) => {
            this.state.note = e.target.value;
            this.emitChange();
        });
    }

    async applyDiscountCode(code) {
        try {
            const response = await fetch(`${API_URL}/discounts/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code })
            });

            if (!response.ok) throw new Error('API Hatası');
            
            const result = await response.json();
            if (result.valid) {
                this.state.discount = {
                    code: code,
                    amount: result.amount,
                    type: result.type // 'percentage' veya 'fixed'
                };
                showSuccess('İndirim uygulandı!');
            } else {
                showError('Geçersiz kupon kodu');
            }

            this.emitChange();

        } catch (error) {
            console.error('İndirim kuponu hatası:', error);
            showError('İndirim kuponu uygulanamadı');
        }
    }

    updateTotals(totals) {
        document.getElementById('subtotal').textContent = formatCurrency(totals.subtotal);
        document.getElementById('deliveryFee').textContent = formatCurrency(totals.deliveryFee);
        document.getElementById('discount').textContent = `-${formatCurrency(totals.discount)}`;
        document.getElementById('total').textContent = formatCurrency(totals.total);
    }

    emitChange() {
        document.dispatchEvent(new CustomEvent('paymentUpdated', {
            detail: this.state
        }));
    }

    getState() {
        return this.state;
    }

    validate() {
        return document.getElementById('paymentMethod').value !== '';
    }
}

// Global instance
window.paymentForm = new PaymentForm('paymentFormContainer');
