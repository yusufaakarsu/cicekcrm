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

// Bunu global olarak export et
window.getApiUrl = (path) => `${API_URL}${path}`;

// Genel utility fonksiyonları
// Sidebar yükleme fonksiyonu düzeltildi - doğru path kullanıldı
async function loadSideBar() {
    try {
        const response = await fetch('/common/sidebar.html');
        const html = await response.text();
        document.getElementById('mainSidebar').innerHTML = html;

        // Aktif sayfayı işaretle
        const currentPage = document.body.dataset.page;
        if (currentPage) {
            const activeLink = document.querySelector(`#mainSidebar a[href*="/${currentPage}/"]`);
            if (activeLink) {
                activeLink.classList.add('active');
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
    if (!amount && amount !== 0) return '0,00 ₺';
    return amount.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' ₺';
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
function formatDate(date) {
    if (!date) return '-';
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date(date));
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
    if (!phone) return '-';
    // Sadece rakamları al
    const numbers = phone.replace(/\D/g, '');
    // Türkiye formatına çevir
    if (numbers.length === 10) {
        return `0${numbers.slice(0,3)} ${numbers.slice(3,6)} ${numbers.slice(6,8)} ${numbers.slice(8)}`;
    }
    // 10 haneli değilse orijinal numarayı döndür
    return phone;
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
    // Önce varsa eski toast container'ı temizle
    const existingContainer = document.querySelector('.toast-container');
    if (existingContainer) {
        existingContainer.remove();
    }

    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '1050';

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="toast-header bg-danger text-white">
            <i class="bi bi-exclamation-circle me-2"></i>
            <strong class="me-auto">Hata</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;

    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Toast kapandığında container'ı kaldır
    toast.addEventListener('hidden.bs.toast', () => {
        if (toastContainer && toastContainer.parentNode === document.body) {
            document.body.removeChild(toastContainer);
        }
    });
}

// Başarı mesajı gösterme fonksiyonu
function showSuccess(message) {
    // Önce varsa eski toast container'ı temizle
    const existingContainer = document.querySelector('.toast-container');
    if (existingContainer) {
        existingContainer.remove();
    }

    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '1050';

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="toast-header bg-success text-white">
            <i class="bi bi-check-circle me-2"></i>
            <strong class="me-auto">Başarılı</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;

    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Toast kapandığında container'ı kaldır
    toast.addEventListener('hidden.bs.toast', () => {
        if (toastContainer && toastContainer.parentNode === document.body) {
            document.body.removeChild(toastContainer);
        }
    });
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

function showLoading(element) {
    element.classList.add('loading');
}

function hideLoading(element) {
    element.classList.remove('loading');
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