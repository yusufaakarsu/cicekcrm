// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Header'ı yükle
    loadHeader();
    
    // Müşteri arama dinleyicisini ekle
    setupCustomerSearch();

    // Yeni müşteri formu dinleyicisini ekle
    setupNewCustomerForm();

    // Adres tipi değişikliği dinleyicisi
    setupAddressTypeListeners();
});

// Müşteri arama işlemlerini ayarla
function setupCustomerSearch() {
    const searchInput = document.getElementById('customerSearch');
    const searchButton = document.getElementById('searchCustomer');
    
    // Enter tuşu ile arama
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchCustomer();
        }
    });
    
    // Buton ile arama
    searchButton.addEventListener('click', (e) => {
        e.preventDefault();
        searchCustomer();
    });
}

// Müşteri arama fonksiyonu güncellendi
async function searchCustomer() {
    // Input değerini al ve temizle
    const phoneInput = document.getElementById('customerSearch');
    const searchButton = document.getElementById('searchCustomer');
    const phone = phoneInput.value.trim().replace(/\D/g, '');
    
    // Boş kontrolü
    if (!phone) {
        showError('Lütfen telefon numarası girin');
        return;
    }
    
    try {
        // Yükleniyor durumunu göster
        const originalButtonContent = searchButton.innerHTML;
        searchButton.disabled = true;
        searchButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        
        // API'den müşteriyi ara
        const response = await fetch(`${API_URL}/customers/phone/${phone}`);
        const data = await response.json();
        
        // Buton durumunu resetle
        searchButton.disabled = false;
        searchButton.innerHTML = originalButtonContent;
        
        // Müşteri detayları ve yeni müşteri formunu gizle
        document.getElementById('customerDetails').classList.add('d-none');
        document.getElementById('newCustomerForm').classList.add('d-none');
        
        if (data.success && data.customer) {
            // Müşteri bulunduysa detayları göster
            showCustomerDetails(data.customer);
        } else {
            // Müşteri bulunamadıysa direk yeni müşteri formunu göster
            showNewCustomerForm(phone); // Telefon numarasını parametre olarak gönder
        }
        
    } catch (error) {
        console.error('Müşteri arama hatası:', error);
        showError('Müşteri araması başarısız oldu');
        
        // Buton durumunu resetle
        if (searchButton) {
            searchButton.disabled = false;
            searchButton.innerHTML = '<i class="bi bi-search"></i>';
        }
    }
}

// Müşteri detaylarını göster
function showCustomerDetails(customer) {
    // Detay alanını göster
    const detailsDiv = document.getElementById('customerDetails');
    detailsDiv.classList.remove('d-none');
    
    // Müşteri ID'sini sakla
    document.getElementById('customerId').value = customer.id;
    
    // Müşteri bilgilerini doldur
    document.getElementById('customerName').textContent = customer.name;
    document.getElementById('customerPhone').textContent = formatPhoneNumber(customer.phone);
    
    // Adres seçim panelini göster
    document.getElementById('addressSelectionCard').classList.remove('d-none');
    
    // Kayıtlı adresleri yükle
    loadCustomerAddresses(customer.id);

    // Müşteri adres tipini seç
    document.getElementById('customerAddress').checked = true;
    document.getElementById('customerAddressesSection').classList.remove('d-none');
    document.getElementById('newAddressSection').classList.add('d-none');

    // Teslimat formunu gizle
    document.getElementById('deliveryForm').classList.add('d-none');
}

// Müşteri kayıtlı adreslerini yükle
async function loadCustomerAddresses(customerId) {
    try {
        const response = await fetch(`${API_URL}/customers/${customerId}/addresses`);
        const addresses = await response.json();
        
        const container = document.querySelector('.saved-addresses');
        
        if (addresses && addresses.length > 0) {
            container.innerHTML = addresses.map((address, index) => `
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" name="savedAddress" 
                           id="address_${address.id}" value="${address.id}"
                           data-address='${JSON.stringify(address)}'
                           ${index === 0 ? 'checked' : ''}>
                    <label class="form-check-label" for="address_${address.id}">
                        <strong>${address.label || 'Adres ' + (index + 1)}</strong><br>
                        <small class="text-muted">
                            ${address.district}, ${address.street} ${address.building_no}
                        </small>
                    </label>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="alert alert-info">Kayıtlı adres bulunamadı.</div>';
        }
    } catch (error) {
        console.error('Adres yükleme hatası:', error);
        showError('Adresler yüklenemedi');
    }
}

// Yeni müşteri formu gösterme fonksiyonu güncellendi
function showNewCustomerForm(phone = '') { // phone parametresi eklendi, varsayılan değeri boş string
    document.getElementById('customerDetails').classList.add('d-none');
    document.getElementById('newCustomerForm').classList.remove('d-none');
    
    // İlçe listesini doldur
    const districtSelect = document.querySelector('[name="new_customer_district"]');
    districtSelect.innerHTML = '<option value="">İlçe seçin...</option>' +
        ISTANBUL_DISTRICTS.map(district => 
            `<option value="${district}">${district}</option>`
        ).join('');

    // Form alanlarını resetle
    const form = document.getElementById('newCustomerForm');
    form.querySelector('[name="new_customer_name"]').value = '';
    form.querySelector('[name="new_customer_phone"]').value = phone; // Aranan numarayı otomatik doldur
    form.querySelector('[name="new_customer_email"]').value = '';
    form.querySelector('[name="new_customer_district"]').value = '';
    form.querySelector('[name="new_customer_notes"]').value = '';
    form.querySelector('[name="new_customer_special_dates"]').value = '';
    form.querySelector('[name="new_customer_tax_number"]').value = '';
    form.querySelector('[name="new_customer_company_name"]').value = '';

    // Bireysel müşteri tipini seç
    document.getElementById('customerTypeRetail').checked = true;
    document.getElementById('customerTypeCorporate').checked = false;

    // Kurumsal alanları gizle
    document.querySelectorAll('.corporate-fields').forEach(field => {
        field.classList.add('d-none');
    });
}

// Müşteri tipi değişikliğini dinle
function setupNewCustomerForm() {
    const customerTypeInputs = document.querySelectorAll('input[name="new_customer_type"]');
    customerTypeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const corporateFields = document.querySelectorAll('.corporate-fields');
            corporateFields.forEach(field => {
                field.classList.toggle('d-none', e.target.value !== 'corporate');
            });
        });
    });
}

// Yeni müşteri kaydetme fonksiyonu
async function saveNewCustomer() {
    try {
        const formData = {
            name: document.querySelector('[name="new_customer_name"]').value,
            phone: document.querySelector('[name="new_customer_phone"]').value.replace(/\D/g, ''),
            email: document.querySelector('[name="new_customer_email"]').value || null,
            city: document.querySelector('[name="new_customer_city"]').value || 'İstanbul',
            district: document.querySelector('[name="new_customer_district"]').value,
            customer_type: document.querySelector('input[name="new_customer_type"]:checked').value,
            special_dates: document.querySelector('[name="new_customer_special_dates"]').value || null,
            notes: document.querySelector('[name="new_customer_notes"]').value || null
        };

        if (formData.customer_type === 'corporate') {
            formData.tax_number = document.querySelector('[name="new_customer_tax_number"]').value;
            formData.company_name = document.querySelector('[name="new_customer_company_name"]').value;
        }

        console.log('Gönderilen veri:', formData);

        const data = await fetchAPI('/customers', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        console.log('API yanıtı:', data);

        if (data.success) {
            showSuccess('Müşteri başarıyla kaydedildi');
            document.getElementById('customerId').value = data.id;
            showCustomerDetails(data.customer);
            document.getElementById('newCustomerForm').classList.add('d-none');
        } else {
            throw new Error(data.error || 'Müşteri kaydedilemedi');
        }

    } catch (error) {
        console.error('Müşteri kayıt hatası:', error);
        showError(error.message);
    }
}

// Adres tipine göre panel değişimi
function setupAddressTypeListeners() {
    document.querySelectorAll('input[name="addressType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const isNewAddress = e.target.value === 'new';
            document.getElementById('customerAddressesSection').classList.toggle('d-none', isNewAddress);
            document.getElementById('newAddressSection').classList.toggle('d-none', !isNewAddress);
        });
    });
}

// HERE API ile adres arama
let searchTimeout;
document.getElementById('addressSearchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => searchAddress(e.target.value), 500);
});

async function searchAddress(query) {
    if (!query || query.length < 3) return;

    try {
        const geocodingUrl = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(query + ' İstanbul')}&apiKey=${CONFIG.HERE_API_KEY}&lang=tr`;
        const response = await fetch(geocodingUrl);
        const data = await response.json();

        const resultsDiv = document.getElementById('addressSearchResults');
        resultsDiv.classList.remove('d-none');

        if (data.items && data.items.length > 0) {
            resultsDiv.innerHTML = data.items.map(item => `
                <button type="button" class="list-group-item list-group-item-action"
                        onclick='selectAddress(${JSON.stringify(item)})'>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-bold">${item.title}</div>
                            <small class="text-muted">${item.address.district}, ${item.address.city}</small>
                        </div>
                        <i class="bi bi-chevron-right"></i>
                    </div>
                </button>
            `).join('');
        } else {
            resultsDiv.innerHTML = '<div class="list-group-item">Sonuç bulunamadı</div>';
        }
    } catch (error) {
        console.error('Adres arama hatası:', error);
        showError('Adres araması başarısız oldu');
    }
}

function selectAddress(address) {
    const detail = document.getElementById('selectedAddressDetail');
    const text = document.getElementById('selectedAddressText');
    
    detail.classList.remove('d-none');
    text.innerHTML = `
        <p class="mb-1"><strong>${address.title}</strong></p>
        <p class="mb-0 text-muted">${address.address.district}, ${address.address.city}</p>
    `;

    // Seçilen adresi sakla
    detail.dataset.selectedAddress = JSON.stringify(address);
    
    // Arama sonuçlarını gizle
    document.getElementById('addressSearchResults').classList.add('d-none');
}

function confirmAddress() {
    const addressType = document.querySelector('input[name="addressType"]:checked').value;
    let selectedAddress;

    if (addressType === 'customer') {
        const selectedRadio = document.querySelector('input[name="savedAddress"]:checked');
        if (!selectedRadio) {
            showError('Lütfen kayıtlı bir adres seçin');
            return;
        }
        selectedAddress = JSON.parse(selectedRadio.dataset.address);
    } else {
        const addressDetail = document.getElementById('selectedAddressDetail');
        if (addressDetail.classList.contains('d-none')) {
            showError('Lütfen yeni bir adres seçin');
            return;
        }
        selectedAddress = JSON.parse(addressDetail.dataset.selectedAddress);
    }

    // Teslimat formunu göster ve adres bilgilerini doldur
    document.getElementById('deliveryForm').classList.remove('d-none');
    sessionStorage.setItem('selectedAddress', JSON.stringify(selectedAddress));
}

// Adresi onayla ve devam et
function confirmAddressAndContinue() {
    const addressType = document.querySelector('input[name="addressType"]:checked').value;
    let selectedAddress;

    if (addressType === 'customer') {
        const selectedRadio = document.querySelector('input[name="savedAddress"]:checked');
        if (!selectedRadio) {
            showError('Lütfen kayıtlı bir adres seçin');
            return;
        }
        selectedAddress = JSON.parse(selectedRadio.dataset.address);
    } else {
        const addressDetail = document.getElementById('selectedAddressDetail');
        if (addressDetail.classList.contains('d-none')) {
            showError('Lütfen yeni bir adres seçin');
            return;
        }
        selectedAddress = JSON.parse(addressDetail.dataset.selectedAddress);
    }

    // Seçilen adresi sakla
    sessionStorage.setItem('selectedAddress', JSON.stringify(selectedAddress));

    // Teslimat formunu göster
    document.getElementById('deliveryForm').classList.remove('d-none');
    
    // Sayfayı teslimat formuna kaydır
    document.getElementById('deliveryForm').scrollIntoView({ behavior: 'smooth' });
}
