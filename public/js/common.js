// API URL configuration
const CONFIG = {
    API_URL: window.location.hostname.includes('pages.dev')
        ? 'https://cicek-crm-api.yusufaakarsu.workers.dev/api'  // <-- /api eklendi
        : `${window.location.protocol}//${window.location.host}/api`,
    HERE_API_KEY: '8ga3iUSKvwTytKYkk8PbpnnH5iCFlNDsvFoSyCghhjI'
};

// İstanbul ilçeleri
const ISTANBUL_DISTRICTS = [
    'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler',
    'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü',
    'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt',
    'Eyüp', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane',
    'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer',
    'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla', 'Ümraniye',
    'Üsküdar', 'Zeytinburnu'
];

// API ve uygulama URL'leri - düzeltildi
const BASE_URL = window.location.origin; // Mevcut domaini kullan

// API URL Configuration
const API_BASE = window.location.hostname.includes('pages.dev') 
    ? 'https://cicek-crm-api.yusufaakarsu.workers.dev'
    : `${window.location.protocol}//${window.location.host}`;

const API_URL = `${API_BASE}/api`;

// API URL düzeltmesi
const API_URL = `${window.location.hostname.includes('pages.dev')
    ? 'https://cicek-crm-api.yusufaakarsu.workers.dev'
    : `${window.location.protocol}//${window.location.host}`}/api`;

// Bunu global olarak export et
window.getApiUrl = (path) => `${API_URL}${path}`;

// Genel utility fonksiyonları
// Sidebar yükleme fonksiyonu düzeltildi - doğru path kullanılması için
async function loadSideBar() {
    try {
        console.log('Sidebar yükleniyor...');
        
        // Sidebar HTML dosyasının yolunu düzelt
        const response = await fetch('/common/sidebar.html');
        
        if (!response.ok) {
            console.error('Sidebar yüklenemedi:', response.status, response.statusText);
            
            // Sidebar HTML dosyası bulunamadığında inline HTML oluştur
            const sidebarContainer = document.getElementById('mainSidebar');
            if (sidebarContainer) {
                sidebarContainer.innerHTML = `
                    <div class="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" style="width: 200px; min-height: 100vh;">
                        <h5 class="mb-4">Çiçek CRM</h5>
                        <ul class="nav nav-pills flex-column mb-auto">
                            <li class="nav-item">
                                <a href="/index.html" class="nav-link text-white active">
                                    <i class="bi bi-speedometer2 me-2"></i> Dashboard
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="/orders/orders.html" class="nav-link text-white">
                                    <i class="bi bi-box me-2"></i> Siparişler
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="/products/products.html" class="nav-link text-white">
                                    <i class="bi bi-box-seam me-2"></i> Ürünler
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="/stock/stock.html" class="nav-link text-white">
                                    <i class="bi bi-cart me-2"></i> Stok
                                </a>
                            </li>
                        </ul>
                    </div>
                `;
            }
            return;
        }
        
        const html = await response.text();
        const sidebarEl = document.getElementById('mainSidebar');
        if (sidebarEl) {
            sidebarEl.innerHTML = html;
        } else {
            console.error('Sidebar element bulunamadı: #mainSidebar');
        }

        // Aktif sayfayı işaretle
        const currentPage = document.body.dataset.page;
        console.log('Current page:', currentPage);
        
        if (currentPage) {
            // Daha esnek eşleşme için
            const links = document.querySelectorAll('#mainSidebar a');
            for (const link of links) {
                // Path'i lowercase yaparak karşılaştır
                const href = link.getAttribute('href').toLowerCase();
                if (href.includes('/' + currentPage.toLowerCase()) || 
                    (currentPage.toLowerCase() === 'dashboard' && href.includes('index.html'))) {
                    link.classList.add('active');
                    break;
                }
            }
        }
    } catch (error) {
        console.error('Sidebar yükleme hatası:', error);
        showError('Menü yüklenemedi: ' + error.message);
    }
}

// Sayfa yüklendiğinde header'ı yükle
document.addEventListener('DOMContentLoaded', loadSideBar);

// Para formatları
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0,00 ₺';
    return new Intl.NumberFormat('tr-TR', { 
        style: 'currency', 
        currency: 'TRY',
        minimumFractionDigits: 2
    }).format(amount);
}

function parseCurrency(text) {
    if (!text) return 0;
    return parseFloat(text.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
}

// Para formatı
function formatPrice(amount) {
    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Format tarih - sadece tarih için
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit'
    }).format(date);
}

function formatDateLocale(date) {
    return new Intl.DateTimeFormat('tr-TR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    }).format(new Date(date));
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(dateStr));
}

// Telefon numarası formatlama
function formatPhoneNumber(phone) {
    if (!phone) return '';
    // 5301234567 -> 0530 123 45 67
    phone = phone.toString().trim().replace(/\D/g, '');
    if (phone.length === 10 && !phone.startsWith('0')) {
        phone = '0' + phone;
    }
    return phone.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
}

// Teslimat saati formatı güncellendi
function formatDeliveryTime(slot) {
    const slots = {
        'morning': '📅 Sabah (09:00-12:00)', 
        'afternoon': '🌞 Öğlen (12:00-17:00)',
        'evening': '🌙 Akşam (17:00-21:00)'
    };
    return slots[slot] || slot;
}

// Status badge oluştur
function getStatusBadge(status) {
    const statusMap = {
        'new': ['Yeni', 'warning'],
        'preparing': ['Hazırlanıyor', 'info'],
        'ready': ['Hazır', 'primary'],          // Eklendi
        'delivering': ['Yolda', 'info'],
        'delivered': ['Teslim Edildi', 'success'], // Eklendi
        'cancelled': ['İptal', 'danger']
    };

    const [text, color] = statusMap[status] || ['Bilinmiyor', 'secondary'];
    return `<span class="badge bg-${color}">${text}</span>`;
}

// Ödeme yöntemi formatla
function formatPaymentMethod(method) {
    const methodMap = {
        'credit_card': 'Kredi Kartı',
        'bank_transfer': 'Havale/EFT',
        'cash': 'Nakit'
    };
    return methodMap[method] || method;
}

// Hata gösterme fonksiyonu
function showError(message) {
    console.error(message);
    
    // Toast mesajı göster
    const toast = document.createElement('div');
    toast.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toast.innerHTML = `
        <div class="toast align-items-center text-white bg-danger border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    document.body.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast.querySelector('.toast'), {
        autohide: true,
        delay: 5000
    });
    bsToast.show();
    
    // 5.5 saniye sonra DOM'dan kaldır
    setTimeout(() => {
        toast.remove();
    }, 5500);
}

// Başarı mesajı gösterme fonksiyonu
function showSuccess(message) {
    // Toast mesajı göster
    const toast = document.createElement('div');
    toast.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toast.innerHTML = `
        <div class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-check-circle-fill me-2"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    document.body.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast.querySelector('.toast'), {
        autohide: true,
        delay: 3000
    });
    bsToast.show();
    
    // 3.5 saniye sonra DOM'dan kaldır
    setTimeout(() => {
        toast.remove();
    }, 3500);
}

function showToast(type, message) {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    
    // Toast tipine göre stil
    toast.className = `toast ${type === 'error' ? 'bg-danger text-white' : 'bg-success text-white'}`;
    
    // Başlık ve mesaj
    toastTitle.textContent = type === 'error' ? 'Hata' : 'Bilgi';
    toastMessage.textContent = message;
    
    // Bootstrap toast'u göster
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Yükleme göstergesini göster/gizle fonksiyonları
function showLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) { // Null check ekledik
        loader.classList.remove('d-none');
    } else {
        console.warn('Loading indicator element not found');
        
        // Eğer yükleme göstergesi yoksa oluşturalım
        const newLoader = document.createElement('div');
        newLoader.id = 'loadingIndicator';
        newLoader.className = 'position-fixed top-50 start-50 translate-middle';
        newLoader.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Yükleniyor...</span>
            </div>
        `;
        document.body.appendChild(newLoader);
    }
}

function hideLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) { // Null check ekledik
        loader.classList.add('d-none');
    }
}

// API işlemleri için genel fonksiyonlar
// fetchAPI fonksiyonunu debug için geliştir
async function fetchAPI(endpoint, options = {}) {
    const apiUrl = API_URL + endpoint;
    console.log(`API Request to ${apiUrl}:`, { 
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body) : undefined 
    });

    // Varsayılan başlıkları ekle
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    try {
        const response = await fetch(apiUrl, {
            ...options,
            headers
        });

        // Response status problemi varsa detaylı logla
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`API Error (${response.status}):`, errorBody);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`API Response from ${endpoint}:`, data);
        return data;
    } catch (error) {
        console.error(`API Error for ${endpoint}:`, error);
        throw error;
    }
}

// getApiUrl fonksiyonu sadeleştirildi
function getApiUrl(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/api/') ? endpoint.substring(4) : endpoint;
    return `${CONFIG.API_URL}${cleanEndpoint.startsWith('/') ? '' : '/'}${cleanEndpoint}`;
}

// Export common utilities
window.API_URL = CONFIG.API_URL;
window.formatCurrency = formatCurrency;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.loadSideBar = loadSideBar;
window.showError = showError;
window.showSuccess = showSuccess;
window.showToast = showToast;
window.getApiUrl = getApiUrl;
window.formatDateTime = formatDateTime;