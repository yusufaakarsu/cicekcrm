class PaymentForm extends BaseComponent {
    constructor(containerId, manager) {
        super(containerId, manager);
        this.state = {
            method: 'cash',
            status: 'pending',
            totals: {
                subtotal: 0,
                deliveryFee: 70,
                discount: 0,
                total: 0
            }
        };
        this.init();
    }

    // ...existing render and event listeners...

    updateTotals(totals) {
        this.state.totals = totals;
        this.container.querySelector('#subtotal').textContent = formatCurrency(totals.subtotal);
        this.container.querySelector('#deliveryFee').textContent = formatCurrency(totals.deliveryFee);
        this.container.querySelector('#discount').textContent = `-${formatCurrency(totals.discount)}`;
        this.container.querySelector('#total').textContent = formatCurrency(totals.total);
    }

    // ...existing other methods...
}
