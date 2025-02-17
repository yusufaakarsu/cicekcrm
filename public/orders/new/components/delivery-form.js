class DeliveryForm {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.state = {
            date: null,
            timeSlot: null,
            address: null,
            type: 'recipient'
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
                <!-- Teslimat Tarihi -->
                <div class="col-md-6">
                    <label class="form-label">Teslimat Tarihi *</label>
                    <input type="date" class="form-control" id="deliveryDate" 
                           min="${new Date().toISOString().split('T')[0]}" required>
                </div>

                <!-- Teslimat Saati -->
                <div class="col-md-6">
                    <label class="form-label">Teslimat Saati *</label>
                    <select class="form-select" id="deliveryTimeSlot" required>
                        <option value="">Seçiniz</option>
                        <option value="morning">Sabah (09:00-12:00)</option>
                        <option value="afternoon">Öğlen (12:00-17:00)</option>
                        <option value="evening">Akşam (17:00-21:00)</option>
                    </select>
                </div>

                <!-- Teslimat Tipi -->
                <div class="col-12">
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="deliveryType" 
                               id="typeRecipient" value="recipient" checked>
                        <label class="form-check-label" for="typeRecipient">
                            Alıcı Adresi
                        </label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="deliveryType" 
                               id="typeCustomer" value="customer">
                        <label class="form-check-label" for="typeCustomer">
                            Müşteri Adresi
                        </label>
                    </div>
                </div>

                <!-- Alıcı Bilgileri -->
                <div class="col-md-6">
                    <label class="form-label">Alıcı Adı *</label>
                    <input type="text" class="form-control" id="recipientName" required>
                </div>

                <div class="col-md-6">
                    <label class="form-label">Alıcı Telefonu *</label>
                    <input type="tel" class="form-control" id="recipientPhone" required>
                </div>

                <!-- Adres Seçimi -->
                <div class="col-12">
                    <label class="form-label">Teslimat Adresi *</label>
                    <div id="addressSelectContainer"></div>
                </div>

                <!-- Not ve Kart Mesajı -->
                <div class="col-md-6">
                    <label class="form-label">Teslimat Notu</label>
                    <textarea class="form-control" id="deliveryNote" rows="2"></textarea>
                </div>

                <div class="col-md-6">
                    <label class="form-label">Kart Mesajı</label>
                    <textarea class="form-control" id="cardMessage" rows="2"></textarea>
                </div>
            </div>
        `;

        // AddressSelect'i doğru container'a başlat
        const addressContainer = this.container.querySelector('#addressSelectContainer');
        if (addressContainer) {
            this.addressSelect = new AddressSelect(addressContainer);
        } else {
            console.error('Address container not found in delivery form');
        }
    }

    setupEventListeners() {
        // Tarih değişimi
        document.getElementById('deliveryDate').addEventListener('change', (e) => {
            this.state.date = e.target.value;
            this.emitChange();
        });

        // Zaman dilimi değişimi
        document.getElementById('deliveryTimeSlot').addEventListener('change', (e) => {
            this.state.timeSlot = e.target.value;
            this.emitChange();
        });

        // Teslimat tipi değişimi
        document.querySelectorAll('input[name="deliveryType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.state.type = e.target.value;
                this.emitChange();
            });
        });

        // Alıcı bilgileri değişimi
        document.getElementById('recipientName').addEventListener('change', (e) => {
            this.state.recipientName = e.target.value;
            this.emitChange();
        });

        document.getElementById('recipientPhone').addEventListener('change', (e) => {
            this.state.recipientPhone = e.target.value;
            this.emitChange();
        });

        // Not ve kart mesajı değişimi
        document.getElementById('deliveryNote').addEventListener('change', (e) => {
            this.state.note = e.target.value;
            this.emitChange();
        });

        document.getElementById('cardMessage').addEventListener('change', (e) => {
            this.state.cardMessage = e.target.value;
            this.emitChange();
        });

        // Adres seçimi event listener
        if (this.addressSelect) {
            document.addEventListener('addressSelected', (e) => {
                this.state.address = e.detail;
                this.emitChange();
            });
        }
    }

    emitChange() {
        document.dispatchEvent(new CustomEvent('deliveryUpdated', {
            detail: this.state
        }));
    }

    validate() {
        const date = document.getElementById('deliveryDate').value;
        const timeSlot = document.getElementById('deliveryTimeSlot').value;
        const recipientName = document.getElementById('recipientName').value;
        const recipientPhone = document.getElementById('recipientPhone').value;
        const address = this.addressSelect.getSelectedAddress();

        if (!date || !timeSlot || !recipientName || !recipientPhone || !address) {
            return false;
        }

        return true;
    }
}

// Global instance
window.deliveryForm = new DeliveryForm('deliveryFormContainer');
