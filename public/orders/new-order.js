
// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Header'ı yükle
    loadHeader();
    
    // Müşteri arama dinleyicisini ekle
    setupCustomerSearch();
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

// Müşteri arama fonksiyonu
async function searchCustomer() {
    // Input değerini al ve temizle
    const phoneInput = document.getElementById('customerSearch');
    const phone = phoneInput.value.trim().replace(/\D/g, '');
    
    // Boş kontrolü
    if (!phone) {
        showError('Lütfen telefon numarası girin');
        return;
    }
    
    try {
        // Yükleniyor durumunu göster
        const searchButton = document.getElementById('searchCustomer');
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
        document.getElementById('customerNotFound').classList.add('d-none');
        document.getElementById('newCustomerForm').classList.add('d-none');
        
        if (data.success && data.customer) {
            // Müşteri bulunduysa detayları göster
            showCustomerDetails(data.customer);
        } else {
            // Müşteri bulunamadıysa yeni müşteri seçeneğini göster
            document.getElementById('customerNotFound').classList.remove('d-none');
        }
        
    } catch (error) {
        console.error('Müşteri arama hatası:', error);
        showError('Müşteri araması başarısız oldu');
        
        // Buton durumunu resetle
        searchButton.disabled = false;
        searchButton.innerHTML = originalButtonContent;
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
}
