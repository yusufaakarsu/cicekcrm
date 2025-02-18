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
        
        // API'den müşteriyi ara - düzeltilmiş endpoint
        const data = await fetchAPI(`/customers/phone/${phone}`);
        
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
    
    // Diğer panelleri gizle
    document.getElementById('addressSelectionCard').classList.add('d-none');
    document.getElementById('deliveryForm').classList.add('d-none');
}

// Adres seçimine geç
function continueToAddress() {
    const customerId = document.getElementById('customerId').value;
    if (!customerId) {
        showError('Müşteri seçilmedi!');
        return;
    }

    // Adres seçim panelini göster
    document.getElementById('addressSelectionCard').classList.remove('d-none');
    
    // Kayıtlı adresleri yükle
    loadCustomerAddresses(customerId);

    // Müşteri adres tipini seç
    document.getElementById('customerAddress').checked = true;
    document.getElementById('customerAddressesSection').classList.remove('d-none');
    document.getElementById('newAddressSection').classList.add('d-none');

    // Panele kaydır
    document.getElementById('addressSelectionCard').scrollIntoView({ behavior: 'smooth' });
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
                            ${address.floor ? 'Kat:' + address.floor : ''} 
                            ${address.apartment_no ? 'No:' + address.apartment_no : ''}
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
    console.log('HERE API address:', address);

    const detail = document.getElementById('selectedAddressDetail');
    const text = document.getElementById('selectedAddressText');
    
    detail.classList.remove('d-none');
    text.innerHTML = `
        <p class="mb-1"><strong>${address.title}</strong></p>
        <p class="mb-0 text-muted">${address.address.district}, ${address.address.city}</p>
    `;

    // HERE API verilerini sakla - düzgün formatta
    detail.dataset.selectedAddress = JSON.stringify({
        title: address.title,
        id: address.id,
        address: {
            city: address.address.county || address.address.city, // county veya city
            district: address.address.district,
            street: address.address.street,
            postalCode: address.address.postalCode,
            countryCode: address.address.countryCode,
            countryName: address.address.countryName,
            houseNumber: address.address.houseNumber
        },
        position: {
            lat: address.position.lat,
            lng: address.position.lng
        }
    });
    
    // Bina numarası varsa otomatik doldur
    if (address.address.houseNumber) {
        document.getElementById('addressBuildingNo').value = address.address.houseNumber;
    }
    
    document.getElementById('addressSearchResults').classList.add('d-none');
}

function confirmAddressAndContinue() {
    const addressType = document.querySelector('input[name="addressType"]:checked').value;
    let selectedAddress;

    try {
        if (addressType === 'customer') {
            // Kayıtlı adres seçimi
            const selectedRadio = document.querySelector('input[name="savedAddress"]:checked');
            if (!selectedRadio) {
                throw new Error('Lütfen kayıtlı bir adres seçin');
            }
            selectedAddress = JSON.parse(selectedRadio.dataset.address);
        } else {
            // Yeni adres bilgileri
            const buildingNo = document.getElementById('addressBuildingNo').value;
            const floor = document.getElementById('addressFloor').value;
            const apartmentNo = document.getElementById('addressApartmentNo').value;
            const addressLabel = document.getElementById('addressLabel').value;

            if (!buildingNo || !floor || !apartmentNo) {
                throw new Error('Lütfen bina no, kat ve daire no bilgilerini girin');
            }

            const addressDetail = document.getElementById('selectedAddressDetail');
            if (!addressDetail || addressDetail.classList.contains('d-none')) {
                throw new Error('Lütfen bir adres seçin');
            }

            const hereAddress = JSON.parse(addressDetail.dataset.selectedAddress);
            selectedAddress = {
                street: hereAddress.title.split(',')[0],
                district: hereAddress.address.district,
                city: hereAddress.address.city,
                postal_code: hereAddress.address.postalCode,
                country_code: hereAddress.address.countryCode,
                country_name: hereAddress.address.countryName,
                lat: hereAddress.position?.lat,
                lng: hereAddress.position?.lng,
                here_place_id: hereAddress.id,
                building_no: buildingNo,
                floor: floor,
                apartment_no: apartmentNo,
                label: addressLabel || 'Teslimat Adresi'
            };
        }

        // Session storage'a kaydet ve devam et
        sessionStorage.setItem('selectedAddress', JSON.stringify(selectedAddress));
        document.getElementById('deliveryForm').classList.remove('d-none');
        document.getElementById('deliveryForm').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        showError(error.message);
    }
}

// Teslimat bilgilerini kaydet ve ürün seçimine geç
async function saveDeliveryInfo() {
    try {
        // Form validasyonu yap
        const requiredFields = [
            'deliveryDate', 
            'recipientName', 
            'recipientPhone'
        ];

        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field.value) {
                showError(`${field.previousElementSibling.textContent} alanı zorunludur`);
                field.focus();
                return;
            }
        }

        // Teslimat saati kontrolü
        const timeSlot = document.querySelector('input[name="deliveryTime"]:checked');
        if (!timeSlot) {
            showError('Lütfen teslimat saati seçin');
            return;
        }

        // Teslimat bilgilerini kaydet
        const deliveryInfo = {
            delivery_date: document.getElementById('deliveryDate').value,
            delivery_time_slot: timeSlot.value,
            recipient_name: document.getElementById('recipientName').value,
            recipient_phone: document.getElementById('recipientPhone').value,
            recipient_alternative_phone: document.getElementById('recipientAlternativePhone').value,
            recipient_note: document.getElementById('recipientNote').value,
            card_message: document.getElementById('cardMessage').value,
        };

        // Session storage'a kaydet
        sessionStorage.setItem('deliveryInfo', JSON.stringify(deliveryInfo));

        // Ürün seçim panelini göster
        document.getElementById('productSelectionCard').classList.remove('d-none');
        document.getElementById('selectedProductsCard').classList.remove('d-none');

        // Kategorileri yükle
        await loadCategories();

        // Başarı mesajı göster
        showSuccess('Teslimat bilgileri kaydedildi');
        
        // Sayfayı ürün seçimine kaydır
        document.getElementById('productSelectionCard').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Hata:', error);
        showError('İşlem başarısız oldu: ' + error.message);
    }
}

// Kategorileri yükle - güncellendi
async function loadCategories() {
    try {
        // Önce container'ı temizle ve yükleniyor mesajı göster
        const container = document.getElementById('categoryFilters');        
        container.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';

        // Endpoint'i düzelttik - /product-categories yerine /products/product-categories kullanıyoruz
        const response = await fetchAPI('/products/product-categories');
        console.log('Kategori yanıtı:', response);

        // API yanıt yapısını kontrol et ve kategorileri al
        const categories = response?.categories || [];

        if (!Array.isArray(categories)) {
            throw new Error('Geçersiz kategori verisi');
        }

        // HTML oluştur
        let html = `
            <input type="radio" class="btn-check" name="category" id="category_all" 
                   value="" checked>
            <label class="btn btn-outline-primary" for="category_all">Tümü</label>
        `;

        categories.forEach(category => {
            html += `
                <input type="radio" class="btn-check" name="category" 
                       id="category_${category.id}" value="${category.id}">
                <label class="btn btn-outline-primary" for="category_${category.id}">
                    ${category.name}
                </label>
            `;
        });

        // HTML'i güncelle
        container.innerHTML = html;

        // Event listener'ları ekle
        document.querySelectorAll('input[name="category"]').forEach(radio => {
            radio.addEventListener('change', loadProducts);
        });
    } catch (error) {
        console.error('Kategoriler yüklenemedi:', error);
        document.getElementById('categoryFilters').innerHTML = 
            '<div class="alert alert-warning">Kategoriler yüklenemedi: ' + error.message + '</div>';
    }
}

// Seçilen ürünleri sakla
let selectedProducts = new Map();

// Ürünleri yükle
async function loadProducts() {
    try {
        const categoryId = document.querySelector('input[name="category"]:checked').value;
        const searchQuery = document.getElementById('productSearch').value;
        
        let url = `${API_URL}/products`;
        if (categoryId) url += `?category=${categoryId}`;
        if (searchQuery) url += `${categoryId ? '&' : '?'}search=${searchQuery}`;
        
        const response = await fetch(url);
        const products = await response.json();
        
        const container = document.getElementById('productList');
        container.innerHTML = products.map(product => {
            // Özel karakterleri escape et
            const safeProduct = JSON.stringify(product).replace(/"/g, '&quot;');
            return `
                <div class="col-md-4 col-lg-3">
                    <div class="card h-100">
                        <div class="card-body">
                            <h6 class="card-title">${product.name}</h6>
                            <p class="card-text small text-muted mb-2">${product.description || ''}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="fw-bold">${formatCurrency(product.retail_price)}</span>
                                <button type="button" class="btn btn-sm btn-outline-primary" 
                                        onclick="addProduct(${safeProduct})">
                                    <i class="bi bi-plus-lg"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Ürünler yüklenemedi:', error);
        showError('Ürünler yüklenemedi');
    }
}

// Ürün ekle
function addProduct(product) {
    try {
        // Safety check
        if (!product || typeof product !== 'object') {
            console.error('Invalid product data:', product);
            return;
        }

        // Parse product if it's a string
        let productData = typeof product === 'string' ? JSON.parse(product) : product;

        let quantity = 1;
        if (selectedProducts.has(productData.id)) {
            quantity = selectedProducts.get(productData.id).quantity + 1;
        }
        
        selectedProducts.set(productData.id, {
            ...productData,
            quantity,
            total: productData.retail_price * quantity
        });
        
        updateSelectedProducts();
        showSuccess(`${productData.name} sepete eklendi`);
    } catch (error) {
        console.error('Ürün eklenirken hata:', error);
        showError('Ürün eklenemedi');
    }
}

// Ürün çıkar
function removeProduct(productId) {
    selectedProducts.delete(Number(productId));
    updateSelectedProducts();
}

// Ürün miktarını güncelle
function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) return;

    const product = selectedProducts.get(Number(productId));
    if (product) {
        product.quantity = newQuantity;
        product.total = product.retail_price * newQuantity;
        selectedProducts.set(Number(productId), product);
        updateSelectedProducts();
    }
}

// Seçilen ürünleri göster
function updateSelectedProducts() {
    const container = document.getElementById('selectedProductsList');
    const subtotalEl = document.getElementById('subtotal');
    
    let html = '';
    let subtotal = 0;

    selectedProducts.forEach(product => {
        html += `
            <tr>
                <td>${product.name}</td>
                <td>
                    <div class="input-group input-group-sm" style="width: 100px">
                        <button class="btn btn-outline-secondary" type="button"
                                onclick="updateQuantity(${product.id}, ${product.quantity - 1})">-</button>
                        <input type="number" class="form-control text-center" value="${product.quantity}"
                               onchange="updateQuantity(${product.id}, this.value)">
                        <button class="btn btn-outline-secondary" type="button"
                                onclick="updateQuantity(${product.id}, ${product.quantity + 1})">+</button>
                    </div>
                </td>
                <td>${formatCurrency(product.retail_price)}</td>
                <td>${formatCurrency(product.total)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" 
                            onclick="removeProduct(${product.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        subtotal += product.total;
    });
    
    container.innerHTML = html || '<tr><td colspan="5" class="text-center">Henüz ürün seçilmedi</td></tr>';
    subtotalEl.textContent = formatCurrency(subtotal);
}

// Ürünleri onayla ve kaydet
async function confirmProducts() {
    if (selectedProducts.size === 0) {
        showError('Lütfen en az bir ürün seçin');
        return;
    }

    try {
        const deliveryInfo = JSON.parse(sessionStorage.getItem('deliveryInfo'));
        const selectedAddress = JSON.parse(sessionStorage.getItem('selectedAddress'));
        const customerId = document.getElementById('customerId').value;
        const addressType = document.querySelector('input[name="addressType"]:checked').value;
        
        // Adres ID kontrolü - düzeltildi
        let deliveryAddressId;
        
        if (addressType === 'customer') {
            // Kayıtlı adres seçilmişse
            const selectedRadio = document.querySelector('input[name="savedAddress"]:checked');
            if (!selectedRadio) {
                throw new Error('Lütfen kayıtlı bir adres seçin');
            }
            deliveryAddressId = selectedRadio.value;
        } else {
            // Yeni adres kaydı
            try {
                const buildingNo = document.getElementById('addressBuildingNo').value;
                const floor = document.getElementById('addressFloor').value;
                const apartmentNo = document.getElementById('addressApartmentNo').value;
                const addressLabel = document.getElementById('addressLabel').value;

                if (!buildingNo || !floor || !apartmentNo) {
                    throw new Error('Lütfen bina no, kat ve daire no bilgilerini girin');
                }

                const addressDetail = document.getElementById('selectedAddressDetail');
                const hereAddress = JSON.parse(addressDetail.dataset.selectedAddress);

                // Adres verilerini hazırla - düzeltilmiş format
                const addressData = {
                    tenant_id: 1,
                    customer_id: Number(customerId),
                    label: addressLabel || 'Teslimat Adresi',
                    city: 'İstanbul',  // Her zaman İstanbul olacak
                    district: hereAddress.address.district, 
                    street: hereAddress.address.street,
                    building_no: buildingNo,
                    floor: floor,
                    apartment_no: apartmentNo,
                    postal_code: hereAddress.address.postalCode,
                    country_code: hereAddress.address.countryCode || 'TUR',
                    country_name: hereAddress.address.countryName || 'Türkiye',
                    lat: hereAddress.position.lat,
                    lng: hereAddress.position.lng,
                    source: 'here_api',
                    here_place_id: hereAddress.id
                };

                console.log('Gönderilecek adres verisi:', addressData);

                const addressResponse = await fetchAPI('/addresses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(addressData)
                });

                if (!addressResponse.success) {
                    throw new Error('Adres kaydedilemedi: ' + (addressResponse.error || ''));
                }

                deliveryAddressId = addressResponse.address_id;
            } catch (error) {
                throw new Error('Adres kaydedilemedi: ' + error.message);
            }
        }

        // Ara toplam hesapla
        const subtotal = Array.from(selectedProducts.values())
            .reduce((sum, p) => sum + p.total, 0);

        // Sipariş verilerini hazırla
        const orderData = {
            tenant_id: 1,
            customer_id: Number(customerId),
            delivery_address_id: deliveryAddressId,
            delivery_date: deliveryInfo.delivery_date,
            delivery_time_slot: deliveryInfo.delivery_time_slot,
            recipient_name: deliveryInfo.recipient_name,
            recipient_phone: deliveryInfo.recipient_phone,
            recipient_alternative_phone: deliveryInfo.recipient_alternative_phone || null,
            recipient_note: deliveryInfo.recipient_note || null,
            card_message: deliveryInfo.card_message || null,
            status: 'new',
            payment_method: 'cash',
            payment_status: 'pending',
            subtotal: subtotal,
            total_amount: subtotal,
            items: Array.from(selectedProducts.values()).map(product => ({
                tenant_id: 1,
                product_id: product.id,
                quantity: product.quantity,
                unit_price: product.retail_price,
                cost_price: product.purchase_price || 0
            }))
        };

        console.log('Gönderilecek sipariş verisi:', orderData);

        // Siparişi kaydet
        const result = await fetchAPI('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });

        if (result.success) {
            // Başarı mesajı göster
            showSuccess('Sipariş başarıyla oluşturuldu');
            
            // Session storage'ı temizle
            sessionStorage.removeItem('deliveryInfo');
            sessionStorage.removeItem('selectedAddress');
            sessionStorage.removeItem('selectedProducts');
            
            // Sipariş detaylarını göster
            const orderDetails = `
                <div class="alert alert-success">
                    <h5>Sipariş No: ${result.order.id}</h5>
                    <p>Sipariş başarıyla oluşturuldu.</p>
                    <hr>
                    <a href="/orders/${result.order.id}" class="btn btn-sm btn-primary">
                        Sipariş Detaylarını Görüntüle
                    </a>
                </div>
            `;
            
            // Detayları sayfada göster
            const container = document.getElementById('selectedProductsCard');
            container.innerHTML = orderDetails;
            
            // Sayfanın üstüne scroll
            container.scrollIntoView({ behavior: 'smooth' });
        } else {
            throw new Error(result.message || 'Sipariş oluşturulamadı');
        }

    } catch (error) {
        console.error('Sipariş kayıt hatası:', error);
        showError('Sipariş kaydedilemedi: ' + error.message);
    }
}