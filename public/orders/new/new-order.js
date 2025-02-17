class OrderManager {
    constructor() {
        this.state = {
            customer: null,
            delivery: {
                date: null,
                timeSlot: null,
                address: null,
                recipient: { name: '', phone: '' }
            },
            items: [],
            payment: { method: 'cash', status: 'pending' }
        };

        document.addEventListener('DOMContentLoaded', () => {
            this.components = {
                customerSelect: new CustomerSelect('customerSelectContainer', this),
                deliveryForm: new DeliveryForm('deliveryFormContainer', this),
                productSelect: new ProductSelect('productSelectContainer', this),
                paymentForm: new PaymentForm('paymentFormContainer', this)
            };

            this.setupEventListeners();
        });
    }

    setupEventListeners() {
        document.addEventListener('customerSelected', (e) => {
            this.state.customer = e.detail;
            if (this.components.deliveryForm?.addressSelect) {
                this.components.deliveryForm.addressSelect.loadSavedAddresses(e.detail?.id);
            }
        });

        document.addEventListener('addressSelected', (e) => {
            this.state.delivery.address = e.detail;
            this.updateDeliveryFee();
        });

        document.addEventListener('cartUpdated', (e) => {
            this.state.items = e.detail;
            this.updateTotals();
        });
    }

    updateTotals() {
        const totals = {
            subtotal: this.state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            deliveryFee: this.calculateDeliveryFee(),
            discount: 0
        };
        totals.total = totals.subtotal + totals.deliveryFee - totals.discount;

        if (this.components.paymentForm) {
            this.components.paymentForm.updateTotals(totals);
        }
    }

    calculateDeliveryFee() {
        // Basit teslimat ücreti hesaplama
        return this.state.delivery.address ? 70 : 0;
    }

    async saveOrder() {
        if (!this.validateOrder()) return;

        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.prepareOrderData())
            });

            if (!response.ok) throw new Error('API Hatası');
            
            showSuccess('Sipariş başarıyla oluşturuldu');
            setTimeout(() => window.location.href = '/orders', 1500);
        } catch (error) {
            console.error('Sipariş kaydedilemedi:', error);
            showError('Sipariş kaydedilemedi');
        }
    }

    validateOrder() {
        // Tüm gerekli alanları kontrol et
        if (!this.state.customer) {
            showError('Lütfen müşteri seçin');
            return false;
        }

        if (!this.state.delivery.date || !this.state.delivery.timeSlot) {
            showError('Lütfen teslimat bilgilerini girin');
            return false;
        }

        if (!this.state.delivery.recipient.name || !this.state.delivery.recipient.phone) {
            showError('Lütfen alıcı bilgilerini girin');
            return false;
        }

        if (!this.state.items.length) {
            showError('Lütfen en az bir ürün ekleyin');
            return false;
        }

        return true;
    }

    prepareOrderData() {
        return {
            customer_id: this.state.customer.id,
            delivery: this.state.delivery,
            items: this.state.items,
            payment: this.state.payment,
            totals: this.state.cart.totals
        };
    }
}

// Global instance
window.orderManager = new OrderManager();
