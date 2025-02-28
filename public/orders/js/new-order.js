// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Header'ı yükle
    loadSideBar();
    
    // Müşteri arama dinleyicisini ekle
    setupCustomerSearch();

    // Yeni müşteri formu dinleyicisini ekle
    setupNewCustomerForm();

    // Adres tipi değişikliği dinleyicisi
    setupAddressTypeListeners();

    // Bugünün tarihini ayarla
    setupDateDefaults();
});

// Bugünün tarihini ayarla
function setupDateDefaults() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('deliveryDate').value = formattedDate;
}

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

// Müşteri arama fonksiyonu - Hata durumları daha iyi yönetiliyor
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
        
        // API'den müşteriyi ara - 404 hatasını daha iyi yönet
        let data;
        try {
            const response = await fetch(`${API_URL}/customers/phone/${phone}`);
            
            // 404 hatası durumunda müşteriyi bulamadığımızı varsay
            if (response.status === 404) {
                showNewCustomerForm(phone);
                showInfo(`${phone} numaralı müşteri bulunamadı. Yeni müşteri kaydı yapabilirsiniz.`);
                return;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            data = await response.json();
        } catch (fetchError) {
            console.error('Customer API error:', fetchError);
            // API hatası durumunda yeni müşteri formunu göster
            showNewCustomerForm(phone);
            showInfo(`Müşteri arama işlemi yapılamadı. Yeni müşteri kaydı yapabilirsiniz.`);
            return;
        }
        
        // Buton durumunu resetle
        searchButton.disabled = false;
        searchButton.innerHTML = originalButtonContent;
        
        // Müşteri detayları ve yeni müşteri formunu gizle
        document.getElementById('customerDetails').classList.add('d-none');
        document.getElementById('newCustomerForm').classList.add('d-none');

        // API başarılı olsa bile customer null olabilir, bu durumu kontrol et
        if (data.success && data.customer) {
            // Müşteri bulunduysa detayları göster
            showCustomerDetails(data.customer);
        } else {
            // Müşteri bulunamadıysa yeni müşteri formunu göster
            showNewCustomerForm(phone);
            // Müşteri bulunamadığını belirt
            if (data.success) {
                showInfo(`${phone} numaralı müşteri bulunamadı. Yeni müşteri kaydı yapabilirsiniz.`);
            }
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

// Bilgi mesajı gösterme fonksiyonu
function showInfo(message) {
    const infoEl = document.createElement('div');
    infoEl.className = 'alert alert-info alert-dismissible fade show';
    infoEl.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Eğer varsa, önceki alertleri kaldır
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
    
    // Forma ekle
    const form = document.getElementById('newCustomerForm');
    form.insertBefore(infoEl, form.firstChild);
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

// Müşteri kayıtlı adreslerini yükle - API yanıt yapısı düzeltildi
async function loadCustomerAddresses(customerId) {
    try {
        const response = await fetch(`${API_URL}/customers/${customerId}/addresses`);
        
        // Hata durumunda boş adres listesi göster
        if (!response.ok) {
            console.error(`Address fetch error: HTTP status ${response.status}`);
            showNoAddresses();
            return;
        }
        
        // API yanıtını al
        const data = await response.json();
        console.log("Adres API yanıtı:", data);
        
        // Yeni API formatına uygun şekilde addresses'i al
        // API ya { success: true, addresses: [...] } ya da doğrudan [...] olabilir
        const addresses = data.success !== undefined ? data.addresses : data;
        
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
            showNoAddresses();
        }
    } catch (error) {
        console.error('Adres yükleme hatası:', error);
        showNoAddresses();
    }
}

// Adres bulunamadı gösterimi için yardımcı fonksiyon
function showNoAddresses() {
    const container = document.querySelector('.saved-addresses');
    container.innerHTML = '<div class="alert alert-info">Kayıtlı adres bulunamadı.</div>';
    
    // Müşterinin kayıtlı adresi yokmuş gibi, yeni adres seçeneğini seç
    document.getElementById('newAddress').checked = true;
    document.getElementById('customerAddressesSection').classList.add('d-none');
    document.getElementById('newAddressSection').classList.remove('d-none');
}

// Yeni müşteri formu gösterme fonksiyonu - Veritabanı uyumlu hale getirildi
function showNewCustomerForm(phone = '') {
    document.getElementById('customerDetails').classList.add('d-none');
    document.getElementById('newCustomerForm').classList.remove('d-none');

    // Form alanlarını resetle - Hata yönetimi eklendi
    const form = document.getElementById('newCustomerForm');
    
    // Form elemanlarına güvenli erişim
    const safeSetValue = (selector, value) => {
        const element = form.querySelector(selector);
        if (element) element.value = value;
    };
    
    safeSetValue('[name="new_customer_name"]', '');
    safeSetValue('[name="new_customer_phone"]', phone); // Telefon numarasını güvenli şekilde ayarla
    safeSetValue('[name="new_customer_email"]', '');
    safeSetValue('[name="new_customer_notes"]', '');
}

// Müşteri tipi değişikliğini dinle - updateNewCustomerForm olarak yeniden adlandırıldı
function setupNewCustomerForm() {
    // Eğer müşteri tipi seçimi kaldırıldıysa, bu fonksiyonu basitleştirelim
    const customerTypeInputs = document.querySelectorAll('input[name="new_customer_type"]');
    
    // Eğer müşteri tipi seçenekleri varsa olayları ayarla
    if (customerTypeInputs && customerTypeInputs.length > 0) {
        customerTypeInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const corporateFields = document.querySelectorAll('.corporate-fields');
                corporateFields.forEach(field => {
                    field.classList.toggle('d-none', e.target.value !== 'corporate');
                });
            });
        });
    }
}

// Yeni müşteri kaydetme fonksiyonu - Veritabanı şemasıyla tam uyumlu
async function saveNewCustomer() {
    try {
        const form = document.getElementById('newCustomerForm');
        
        // Sadece veritabanındaki alanlara uygun veri hazırla
        const formData = {
            name: form.querySelector('[name="new_customer_name"]')?.value?.trim(),
            phone: form.querySelector('[name="new_customer_phone"]')?.value?.replace(/\D/g, ''),
            email: form.querySelector('[name="new_customer_email"]')?.value?.trim() || null,
            notes: form.querySelector('[name="new_customer_notes"]')?.value?.trim() || null
        };

        console.log('Gönderilen veri:', formData);

        // Gerekli alanların dolu olduğundan emin ol
        if (!formData.name || !formData.phone) {
            throw new Error('İsim ve telefon alanları zorunludur');
        }

        const data = await fetchAPI('/customers', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        console.log('API yanıtı:', data);

        if (data.success) {
            // API'den dönen ID'yi kullan
            const customerId = data.customer_id;
            
            showSuccess('Müşteri başarıyla kaydedildi');
            document.getElementById('customerId').value = customerId;
            
            // Temel müşteri bilgilerini göster
            showBasicCustomerDetails({
                id: customerId,
                name: formData.name,
                phone: formData.phone
            });
            document.getElementById('newCustomerForm').classList.add('d-none');
        } else {
            throw new Error(data.error || 'Müşteri kaydedilemedi');
        }

    } catch (error) {
        console.error('Müşteri kayıt hatası:', error);
        showError(error.message);
    }
}

// Müşteri detayları yetersizse temel bilgileri göster
function showBasicCustomerDetails(basicInfo) {
    // Detay alanını göster
    const detailsDiv = document.getElementById('customerDetails');
    detailsDiv.classList.remove('d-none');
    
    // Müşteri ID'sini sakla
    document.getElementById('customerId').value = basicInfo.id;
    
    // Müşteri bilgilerini doldur
    document.getElementById('customerName').textContent = basicInfo.name;
    document.getElementById('customerPhone').textContent = formatPhoneNumber(basicInfo.phone);
    
    // Diğer panelleri gizle
    document.getElementById('addressSelectionCard').classList.add('d-none');
    document.getElementById('deliveryForm').classList.add('d-none');
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
                label: 'Teslimat Adresi'
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

// Teslimat bilgilerini kaydet ve ürün seçimine geç - Yeni backend yapısına uyarlandı
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
        const customerId = document.getElementById('customerId').value;
        const selectedAddress = JSON.parse(sessionStorage.getItem('selectedAddress'));

        // Adres bilgisi hazırla
        const addressData = {
            customer_id: Number(customerId),
            address_id: selectedAddress.id || null,
            new_address: selectedAddress.id ? null : {
                district: selectedAddress.district,
                street: selectedAddress.street,
                building_no: selectedAddress.building_no,
                floor: selectedAddress.floor,
                door_no: selectedAddress.apartment_no,
                neighborhood: selectedAddress.neighborhood || null,
                directions: selectedAddress.directions || null,
                label: selectedAddress.label || 'Teslimat Adresi'
            },
            delivery_date: document.getElementById('deliveryDate').value,
            delivery_time_slot: timeSlot.value,
            recipient_name: document.getElementById('recipientName').value,
            recipient_phone: document.getElementById('recipientPhone').value,
            recipient_note: document.getElementById('recipientNote').value || null,
            card_message: document.getElementById('cardMessage').value || null
        };

        // Session storage'a da kaydet
        const deliveryInfo = {
            delivery_date: addressData.delivery_date,
            delivery_time_slot: addressData.delivery_time_slot,
            recipient_name: addressData.recipient_name,
            recipient_phone: addressData.recipient_phone,
            recipient_note: addressData.recipient_note,
            card_message: addressData.card_message
        };
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
        const response = await fetch(`${API_URL}/products/categories`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        // Kategori butonlarını oluştur
        const container = document.getElementById('categoryFilters');
        container.innerHTML = `
            <input type="radio" class="btn-check" name="category" id="allCategories" value="" checked>
            <label class="btn btn-outline-primary" for="allCategories">Tümü</label>
            ${data.categories.map(cat => `
                <input type="radio" class="btn-check" name="category" id="cat_${cat.id}" value="${cat.id}">
                <label class="btn btn-outline-primary" for="cat_${cat.id}">${cat.name}</label>
            `).join('')}
        `;

        // Kategori değişiminde ürünleri filtrele
        container.querySelectorAll('input[name="category"]').forEach(radio => {
            radio.addEventListener('change', loadProducts);
        });

    } catch (error) {
        console.error('Categories loading error:', error);
        showError('Kategoriler yüklenemedi: ' + error.message);
    }
}

// Seçilen ürünleri sakla
let selectedProducts = new Map();

// Ürünleri yükle - düzeltildi
async function loadProducts() {
    try {
        const categoryId = document.querySelector('input[name="category"]:checked')?.value;
        const search = document.getElementById('productSearch').value;

        const params = new URLSearchParams();
        if (categoryId) params.append('category_id', categoryId);
        if (search) params.append('search', search);

        const response = await fetch(`${API_URL}/products?${params}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderProducts(data.products || []);

    } catch (error) {
        console.error('Products loading error:', error);
        showError('Ürünler yüklenemedi');
    }
}

// Ürün arama input listener'ı ekle
document.getElementById('productSearch').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadProducts(), 500);
});

// Ürün ekle
function addProduct(product) {
    try {
        // Safety check
        if (!product || typeof product !== 'object') {
            console.error('Invalid product data:', product);
            return;
        }

        const productData = typeof product === 'string' ? JSON.parse(product) : product;
        
        // base_price kullanımı - retail_price yerine
        const price = parseFloat(productData.base_price);
        if (!price) {
            console.error('Product has no price:', productData);
            showError('Ürün fiyatı bulunamadı');
            return;
        }

        let quantity = 1;
        if (selectedProducts.has(productData.id)) {
            quantity = selectedProducts.get(productData.id).quantity + 1;
        }
        
        selectedProducts.set(productData.id, {
            ...productData,
            quantity,
            unit_price: price,  // Değiştirildi
            total: price * quantity
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

// Ürün miktarını güncelle - Fiyat hesaplaması düzeltildi
function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) return;

    const product = selectedProducts.get(Number(productId));
    if (product) {
        product.quantity = Number(newQuantity);
        product.unit_price = product.base_price; // base_price kullan
        product.total = product.unit_price * product.quantity;
        selectedProducts.set(Number(productId), product);
        updateSelectedProducts();
    }
}

// Seçilen ürünleri göster - Fiyat alanları düzeltildi
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
                <td>${formatCurrency(product.unit_price)}</td>
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

// Ürünleri onayla - Yeni API yapısına göre güncellendi
async function confirmProducts() {
    try {
        const deliveryInfo = JSON.parse(sessionStorage.getItem('deliveryInfo'));
        const selectedAddress = JSON.parse(sessionStorage.getItem('selectedAddress'));
        const customerId = document.getElementById('customerId').value;
        const addressType = document.querySelector('input[name="addressType"]:checked').value;

        // Ürün seçilip seçilmediğini kontrol et
        if (selectedProducts.size === 0) {
            throw new Error('Lütfen en az bir ürün seçin');
        }

        // Önce adres kaydı yap
        let addressId;
        if (addressType === 'customer') {
            // Kayıtlı adres seçilmişse
            addressId = selectedAddress.id;
        } else {
            // Yeni adres oluştur
            const addressData = {
                customer_id: Number(customerId),
                label: selectedAddress.label || 'Teslimat Adresi',
                district: selectedAddress.district,
                street: selectedAddress.street,
                here_place_id: selectedAddress.here_place_id || null,
                building_no: selectedAddress.building_no || "1", 
                floor_no: selectedAddress.floor || "1",
                door_no: selectedAddress.apartment_no || "1",
                lat: selectedAddress.lat || null,
                lng: selectedAddress.lng || null,
                neighborhood: selectedAddress.neighborhood || null,
                directions: selectedAddress.directions || null
            };
            
            try {
                // Ayrı bir fonksiyonda adres oluştur
                addressId = await createNewAddress(addressData);
            } catch (addressError) {
                throw new Error(`Adres kaydedilemedi: ${addressError.message}`);
            }
        }

        // Ara toplam hesapla
        const subtotal = Array.from(selectedProducts.values())
            .reduce((sum, p) => sum + p.unit_price * p.quantity, 0);

        // Sipariş verilerini hazırla - Yeni modele göre
        const orderData = {
            customer_id: Number(customerId),
            address_id: addressId,
            delivery_date: deliveryInfo.delivery_date,
            delivery_time: deliveryInfo.delivery_time_slot,
            recipient_name: deliveryInfo.recipient_name,
            recipient_phone: deliveryInfo.recipient_phone,
            recipient_note: deliveryInfo.recipient_note || null,
            card_message: deliveryInfo.card_message || null,
            total_amount: subtotal,
            items: Array.from(selectedProducts.values()).map(product => ({
                product_id: product.id,
                quantity: product.quantity,
                unit_price: product.base_price || product.unit_price,
                total_amount: product.quantity * (product.base_price || product.unit_price)
            }))
        };

        // Siparişi kaydet - Yeni API endpoint'i kullanımı
        const result = await fetchAPI('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });

        if (result.success) {
            // Başarılı kayıt sonrası sipariş detayına yönlendir
            window.location.href = `/orders/order-detail.html?id=${result.order.id}`;
        } else {
            throw new Error(result.error || 'Sipariş kaydedilemedi');
        }

    } catch (error) {
        console.error('Sipariş kayıt hatası:', error);
        showError('Sipariş kaydedilemedi: ' + error.message);
    }
}

// Adres ekleme işlemini daha dayanıklı hale getir
async function createNewAddress(addressData) {
    try {
        console.log("Gönderilecek adres verisi:", addressData);
        
        // Alıcı bilgilerini de ekle
        const recipientName = document.getElementById('recipientName')?.value;
        const recipientPhone = document.getElementById('recipientPhone')?.value;
        const recipientNote = document.getElementById('recipientNote')?.value;
        
        if (recipientName && recipientPhone) {
            addressData.recipient_name = recipientName;
            addressData.recipient_phone = recipientPhone;
            addressData.recipient_note = recipientNote || null;
        }
        
        // Fetch API kullanarak address API'sine direkt istek yap
        const addressResponse = await fetch(`${API_URL}/addresses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(addressData)
        });
        
        if (!addressResponse.ok) {
            // API response status başarılı değilse, hata detaylarını logla
            const errorText = await addressResponse.text();
            console.error("Address API Error:", addressResponse.status, errorText);
            
            // Hata içinde "created_at" geçiyorsa, muhtemelen şema problemi
            if (errorText.includes('created_at')) {
                throw new Error('Veritabanı şema hatası: Adres tablosunda created_at sütunu eksik');
            } else {
                throw new Error(`Adres kaydedilemedi: HTTP ${addressResponse.status}`);
            }
        }
        
        const addressResult = await addressResponse.json();
        
        if (!addressResult.success) {
            throw new Error('Adres kaydedilemedi: ' + (addressResult.error || 'Bilinmeyen hata'));
        }
        
        const addressId = addressResult.address_id || addressResult.id;
        console.log("Oluşturulan adres ID:", addressId);
        return addressId;
        
    } catch (error) {
        console.error("Adres oluşturma hatası:", error);
        throw error;
    }
}

// Ürünleri listele
function renderProducts(products) {
    const container = document.getElementById('productList');
    
    if (!products || products.length === 0) {
        container.innerHTML = '<div class="col-12"><div class="alert alert-info">Ürün bulunamadı</div></div>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="col-md-3 col-sm-6">
            <div class="card h-100">
                ${product.image_url ? `
                    <img src="${product.image_url}" class="card-img-top" alt="${product.name}">
                ` : `
                    <div class="card-img-top bg-light text-center py-4">
                        <i class="bi bi-image text-muted" style="font-size: 2rem;"></i>
                    </div>
                `}
                <div class="card-body">
                    <h6 class="card-title">${product.name}</h6>
                    <p class="card-text text-success fw-bold mb-2">
                        ${formatCurrency(product.base_price)}
                    </p>
                </div>
                <div class="card-footer bg-white border-top-0">
                    <button type="button" class="btn btn-primary btn-sm w-100" 
                            onclick="addProduct(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                        <i class="bi bi-plus-lg"></i> Sepete Ekle
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}