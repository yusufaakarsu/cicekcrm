// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Header'ı yükle
    loadHeader();
    
    // Müşteri arama dinleyicisini ekle
    setupCustomerSearch();

    // Yeni müşteri formu dinleyicisini ekle
    setupNewCustomerForm();
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
    
    // Kayıtlı adresleri yükle
    loadCustomerAddresses(customer.id);

    // Teslimat formunu göster
    document.getElementById('deliveryForm').classList.remove('d-none');
    
    // Bugünün tarihini set et
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('deliveryDate').min = today;
    document.getElementById('deliveryDate').value = today;
    
    // İlçe listesini doldur
    const districtSelect = document.getElementById('addressDistrict');
    districtSelect.innerHTML = '<option value="">İlçe seçin...</option>' +
        ISTANBUL_DISTRICTS.map(district => 
            `<option value="${district}">${district}</option>`
        ).join('');
}

// Müşteri kayıtlı adreslerini yükle
async function loadCustomerAddresses(customerId) {
    try {
        // Adresleri API'den al
        const response = await fetch(`${API_URL}/customers/${customerId}/addresses`);
        const data = await response.json();
        
        // Select elementini al
        const addressSelect = document.getElementById('customerAddresses');
        
        // Mevcut options'ları temizle (ilk option hariç)
        const defaultOption = addressSelect.options[0];
        addressSelect.innerHTML = '';
        addressSelect.appendChild(defaultOption);
        
        // Adresleri ekle
        if (data && data.length > 0) {
            data.forEach(address => {
                const option = document.createElement('option');
                option.value = address.id;
                option.textContent = `${address.label} - ${address.district}`;
                addressSelect.appendChild(option);
            });
        }
        
        // Select'i göster
        addressSelect.parentElement.classList.remove('d-none');
        
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

// Adres seçildiğinde yeni adres formunu göster/gizle
document.getElementById('deliveryAddressSelect').addEventListener('change', function() {
    const newAddressForm = document.getElementById('newAddressForm');
    newAddressForm.classList.toggle('d-none', this.value !== '');
});

// Teslimat bilgilerini kaydet
async function saveDeliveryInfo() {
    // Form validasyonu
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

    // Adres kontrolü
    const addressSelect = document.getElementById('deliveryAddressSelect');
    const newAddressForm = document.getElementById('newAddressForm');
    
    if (!addressSelect.value && newAddressForm.classList.contains('d-none')) {
        showError('Lütfen kayıtlı bir adres seçin veya yeni adres ekleyin');
        return;
    }

    // Adres validasyonu
    if (!addressSelect.value) {
        const district = document.getElementById('addressDistrict').value;
        const street = document.getElementById('addressStreet').value;
        const buildingNo = document.getElementById('addressBuildingNo').value;

        if (!district || !street || !buildingNo) {
            showError('Lütfen adres bilgilerini eksiksiz doldurun');
            return;
        }
    }

    // Teslimat bilgilerini objede topla
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

    // Başarılı ise sonraki adıma geç
    showSuccess('Teslimat bilgileri kaydedildi');
    // TODO: Ürün seçim formunu göster
}
