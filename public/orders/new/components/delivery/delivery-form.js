class DeliveryForm extends BaseComponent {
    constructor(containerId, manager) {
        super(containerId, manager);
        this.state = {
            date: null,
            timeSlot: null,
            address: null,
            recipient: {
                name: '',
                phone: ''
            }
        };
        this.init();
    }

    render() {
        // ... existing delivery form HTML ...

        // AddressSelect'i başlat
        const addressContainer = this.container.querySelector('#addressSelectContainer');
        if (addressContainer) {
            this.addressSelect = new AddressSelect(addressContainer, this.manager);
        }
    }

    // ... rest of the methods ...
}
