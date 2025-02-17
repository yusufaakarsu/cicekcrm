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

        this.components = {};
        
        document.addEventListener('DOMContentLoaded', () => {
            this.initComponents();
            this.setupEventListeners();
        });
    }

    initComponents() {
        // Bileşenleri başlat ve referansları sakla
        this.customerSelect = new CustomerSelect('customerSelectContainer');
        this.deliveryForm = new DeliveryForm('deliveryFormContainer');
        this.productSelect = new ProductSelect('productSelectContainer');
        this.paymentForm = new PaymentForm('paymentFormContainer');
    }

    setupEventListeners() {
        // Müşteri seçimi
        document.addEventListener('customerSelected', (e) => {
            this.state.customer = e.detail;
            if (e.detail && this.deliveryForm?.addressSelect) {
                this.deliveryForm.addressSelect.loadSavedAddresses(e.detail.id);
            }
        });

        // Teslimat bilgileri
        document.addEventListener('deliveryUpdated', (e) => {
            this.state.delivery = {...this.state.delivery, ...e.detail};
            this.updateTotals();
        });

        // Sepet değişiklikleri
        document.addEventListener('cartUpdated', (e) => {
            this.state.items = e.detail;
            this.updateTotals();
        });
    }

    updateTotals() {
        const subtotal = this.state.items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0);

        this.state.totals = {
            subtotal,
            deliveryFee: this.state.delivery.address ? 70 : 0,
            discount: 0,
            total: subtotal + (this.state.delivery.address ? 70 : 0)
        };

        if (this.paymentForm) {
            this.paymentForm.updateTotals(this.state.totals);
        }
    }

    async saveOrder() {
        if (!this.validateOrder()) return;

        try {
            const orderData = {
                customer_id: this.state.customer.id,
                delivery: {
                    date: this.state.delivery.date,
                    time_slot: this.state.delivery.timeSlot,
                    address: this.state.delivery.address,
                    recipient_name: this.state.delivery.recipient.name,
                    recipient_phone: this.state.delivery.recipient.phone,
                    notes: this.state.delivery.note,
                    card_message: this.state.delivery.cardMessage
                },
                items: this.state.items.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    unit_price: item.price
                })),
                payment: {
                    method: 'cash',
                    status: 'pending'
                },
                totals: this.state.totals
            };

            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) throw new Error('Sipariş kaydedilemedi');

            showSuccess('Sipariş başarıyla oluşturuldu');
            setTimeout(() => window.location.href = '/orders', 1500);

        } catch (error) {
            console.error('Sipariş hatası:', error);
            showError('Sipariş kaydedilemedi');
        }
    }

    validateOrder() {
        if (!this.state.customer) {
            showError('Lütfen müşteri seçin');
            return false;
        }

        if (!this.state.delivery.date || !this.state.delivery.timeSlot) {
            showError('Lütfen teslimat tarih ve saatini seçin');
            return false;
        }

        if (!this.state.delivery.address) {
            showError('Lütfen teslimat adresi seçin');
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
}

// Sayfa yüklendiğinde OrderManager'ı başlat
window.orderManager = new OrderManager();

// Global save order function
window.saveOrder = function() {
    if (window.orderManager) {
        window.orderManager.saveOrder();
    }
};
