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
            totals: {
                subtotal: 0,
                deliveryFee: 70,
                discount: 0,
                total: 0
            }
        };

        document.addEventListener('DOMContentLoaded', () => {
            this.initComponents();
            this.setupEventListeners();
        });
    }

    initComponents() {
        // Her bileşene OrderManager referansını geçir
        this.customerSelect = new CustomerSelect('customerSelectContainer', this);
        this.deliveryForm = new DeliveryForm('deliveryFormContainer', this);
        this.productSelect = new ProductSelect('productSelectContainer', this);
        this.paymentForm = new PaymentForm('paymentFormContainer', this);
    }

    setupEventListeners() {
        document.addEventListener('customerUpdated', (e) => this.updateCustomer(e.detail));
        document.addEventListener('deliveryUpdated', (e) => this.updateDelivery(e.detail));
        document.addEventListener('cartUpdated', (e) => this.updateCart(e.detail));
    }

    // State güncelleme metodları
    updateCustomer(customer) {
        this.state.customer = customer;
        // Müşteri değişince adresleri güncelle
        if (this.deliveryForm) {
            this.deliveryForm.loadCustomerAddresses(customer?.id);
        }
    }

    updateDelivery(delivery) {
        this.state.delivery = {...this.state.delivery, ...delivery};
        this.updateTotals();
    }

    updateCart(items) {
        this.state.items = items;
        this.updateTotals();
    }

    updateTotals() {
        const totals = {
            subtotal: this.state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            deliveryFee: this.calculateDeliveryFee(),
            discount: 0
        };
        totals.total = totals.subtotal + totals.deliveryFee - totals.discount;

        if (this.paymentForm) {
            this.paymentForm.updateTotals(totals);
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
