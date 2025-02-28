/**
 * Çiçek CRM Ortak Fonksiyonlar
 * Tüm sistem için paylaşılan utility kodları
 */

// API ve Yapılandırma
const CONFIG = {
    API_URL: window.location.hostname.includes('pages.dev')
        ? 'https://cicek-crm-api.yusufaakarsu.workers.dev/api'
        : `${window.location.protocol}//${window.location.host}/api`,
    HERE_API_KEY: '8ga3iUSKvwTytKYkk8PbpnnH5iCFlNDsvFoSyCghhjI'
};

// API URL değişkeni oluştur - Tek bir API URL tanımı
const API_URL = CONFIG.API_URL;

// İstanbul ilçeleri - Adres işlemleri için
const ISTANBUL_DISTRICTS = [
    'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler',
    'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü',
    'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt',
    'Eyüp', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane',
    'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer',
    'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla', 'Ümraniye',
    'Üsküdar', 'Zeytinburnu'
];

// ===============================================
// SIDEBAR & NAVIGATION
// ===============================================

/**
 * Sidebar modülünü yükler ve aktif sayfayı işaretler
 */
async function loadSideBar() {
    try {
        console.log('Sidebar yükleniyor...');
        
        const response = await fetch('/common/sidebar.html');
        
        if (!response.ok) {
            console.error('Sidebar yüklenemedi:', response.status);
            createFallbackSidebar();
            return;
        }
        
        const html = await response.text();
        const sidebarEl = document.getElementById('mainSidebar');
        
        if (!sidebarEl) {
            console.error('Sidebar elementi bulunamadı: #mainSidebar');
            return;
        }
        
        sidebarEl.innerHTML = html;
        markActiveNavItem();
        
    } catch (error) {
        console.error('Sidebar yükleme hatası:', error);
        createFallbackSidebar();
    }
}

/**
 * Yedek sidebar oluştur - Ana sidebar yüklenemediğinde
 */
function createFallbackSidebar() {
    const sidebarContainer = document.getElementById('mainSidebar');
    if (!sidebarContainer) return;
    
    sidebarContainer.innerHTML = `
        <div class="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" style="width: 200px; min-height: 100vh;">
            <h5 class="mb-4">Çiçek CRM</h5>
            <ul class="nav nav-pills flex-column mb-auto">
                <li class="nav-item">
                    <a href="/index.html" class="nav-link text-white">
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
    
    // Yedek sidebar'da da aktif sayfayı işaretle
    markActiveNavItem();
}

/**
 * Mevcut sayfaya göre sidebar'daki ilgili item'ı aktif olarak işaretler
 */
function markActiveNavItem() {
    const currentPage = document.body.dataset.page;
    if (!currentPage) return;
    
    const links = document.querySelectorAll('#mainSidebar a');
    
    for (const link of links) {
        const href = link.getAttribute('href').toLowerCase();
        
        // Sayfanın pathinde ilgili route var mı?
        const isActive = href.includes('/' + currentPage.toLowerCase()) || 
                        (currentPage.toLowerCase() === 'dashboard' && href.includes('index.html'));
                        
        if (isActive) {
            link.classList.add('active');
            
            // Eğer dropdown içindeyse, parent dropdown'ı da aç
            const parentDropdown = link.closest('.collapse');
            if (parentDropdown) {
                parentDropdown.classList.add('show');
            }
            
            break;
        }
    }
}

// ===============================================
// FORMAT UTILITIES
// ===============================================

/**
 * Para miktarını formatlar (₺ sembolü ile)
 * @param {number} amount - Formatlanacak miktar
 * @returns {string} Formatlanmış para miktarı (₺)
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0,00 ₺';
    return new Intl.NumberFormat('tr-TR', { 
        style: 'currency', 
        currency: 'TRY',
        minimumFractionDigits: 2
    }).format(amount);
}

/**
 * Metin içindeki para değerini sayısal değere çevirir
 * @param {string} text - Para miktarı içeren metin
 * @returns {number} Sayısal değer
 */
function parseCurrency(text) {
    if (!text) return 0;
    return parseFloat(text.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
}

/**
 * Para miktarını formatlı sayı olarak gösterir (₺ sembolü olmadan)
 * @param {number} amount - Formatlanacak miktar
 * @returns {string} Formatlanmış sayı
 */
function formatPrice(amount) {
    if (amount === null || amount === undefined) return '0,00';
    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Tarihi formatlı şekilde gösterir (gün.ay.yıl)
 * @param {string} dateString - Tarih string'i
 * @returns {string} Formatlanmış tarih
 */
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

/**
 * Tarihi kısa gün adı ile gösterir (Pzt, 4 Oca)
 * @param {string|Date} date - Tarih
 * @returns {string} Formatlanmış tarih
 */
function formatDateLocale(date) {
    if (!date) return '-';
    return new Intl.DateTimeFormat('tr-TR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    }).format(new Date(date));
}

/**
 * Tarih ve saati formatlı şekilde gösterir (gün.ay.yıl saat:dakika)
 * @param {string} dateStr - Tarih string'i
 * @returns {string} Formatlanmış tarih ve saat
 */
function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

/**
 * Telefon numarasını formatlı şekilde gösterir (0530 123 45 67)
 * @param {string} phone - Telefon numarası
 * @returns {string} Formatlanmış telefon numarası
 */
function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    phone = phone.toString().trim().replace(/\D/g, '');
    if (phone.length === 10 && !phone.startsWith('0')) {
        phone = '0' + phone;
    }
    
    return phone.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
}

/**
 * Teslimat saatini formatlı şekilde gösterir (emoji ile)
 * @param {string} slot - Teslimat dilimi (morning, afternoon, evening)
 * @returns {string} Formatlanmış teslimat saati
 */
function formatDeliveryTime(slot) {
    const slots = {
        'morning': '📅 Sabah (09:00-12:00)', 
        'afternoon': '🌞 Öğleden Sonra (12:00-17:00)',
        'evening': '🌙 Akşam (17:00-21:00)'
    };
    
    return slots[slot] || slot;
}

/**
 * Durum badge'i oluşturur
 * @param {string} status - Durum kodu
 * @returns {string} HTML badge elementi
 */
function getStatusBadge(status) {
    const statusMap = {
        'new': ['Yeni', 'warning'],
        'confirmed': ['Onaylandı', 'primary'],
        'preparing': ['Hazırlanıyor', 'info'],
        'ready': ['Hazır', 'primary'],
        'delivering': ['Yolda', 'info'],
        'delivered': ['Teslim Edildi', 'success'],
        'cancelled': ['İptal', 'danger']
    };

    const [text, color] = statusMap[status] || ['Bilinmiyor', 'secondary'];
    return `<span class="badge bg-${color}">${text}</span>`;
}

/**
 * Ödeme yöntemi adını gösterir
 * @param {string} method - Ödeme yöntemi kodu
 * @returns {string} Ödeme yöntemi adı
 */
function formatPaymentMethod(method) {
    const methodMap = {
        'credit_card': 'Kredi Kartı',
        'bank_transfer': 'Havale/EFT',
        'cash': 'Nakit'
    };
    
    return methodMap[method] || method;
}

// Sayı formatla
function formatNumber(number) {
    return number?.toLocaleString('tr-TR') || '0';
}

// Dosya boyutu formatla
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ===============================================
// UI NOTIFICATIONS
// ===============================================

/**
 * Hata mesajı gösterir
 * @param {string} message - Hata mesajı
 */
function showError(message) {
    console.error(message);
    showNotification('error', message);
}

/**
 * Başarı mesajı gösterir
 * @param {string} message - Başarı mesajı
 */
function showSuccess(message) {
    showNotification('success', message);
}

/**
 * Bildirim toastı gösterir
 * @param {string} type - Bildirim tipi ('error' veya 'success')
 * @param {string} message - Bildirim mesajı
 */
function showNotification(type, message) {
    // Mevcut toast var mı? Varsa kaldır
    const existingToast = document.querySelector('.toast-container');
    if (existingToast) {
        existingToast.remove();
    }
    
    const isError = type === 'error';
    const bgColor = isError ? 'bg-danger' : 'bg-success';
    const icon = isError ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill';
    const delay = isError ? 5000 : 3000;
    
    // Toast elementi oluştur
    const toast = document.createElement('div');
    toast.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toast.innerHTML = `
        <div class="toast align-items-center text-white ${bgColor} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi ${icon} me-2"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Bootstrap toast'u göster
    const bsToast = new bootstrap.Toast(toast.querySelector('.toast'), {
        autohide: true,
        delay: delay
    });
    bsToast.show();
    
    // Toast kapandıktan sonra kaldır
    setTimeout(() => {
        toast.remove();
    }, delay + 500);
}

/**
 * Mevcut toast elementini kullanarak bildirim gösterir
 * @param {string} type - Bildirim tipi ('error' veya 'success')
 * @param {string} message - Bildirim mesajı
 */
function showToast(type, message) {
    const toast = document.getElementById('toast');
    if (!toast) {
        // Hazır toast element yoksa, dinamik oluştur
        showNotification(type, message);
        return;
    }
    
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

// ===============================================
// LOADING INDICATOR
// ===============================================

/**
 * Yükleme göstergesini gösterir
 */
function showLoading() {
    let loader = document.getElementById('loadingIndicator');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loadingIndicator';
        loader.className = 'position-fixed top-50 start-50 translate-middle d-none';
        loader.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Yükleniyor...</span>
            </div>
        `;
        document.body.appendChild(loader);
    }
    
    loader.classList.remove('d-none');
}

/**
 * Yükleme göstergesini gizler
 */
function hideLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
        loader.classList.add('d-none');
    }
}

// ===============================================
// API UTILS
// ===============================================

/**
 * API endpoint'ine istek yapar
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<object>} API yanıtı
 */
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

/**
 * API URL oluşturur
 * @param {string} endpoint - Endpoint
 * @returns {string} Tam API URL
 */
function getApiUrl(endpoint) {
    // Başında /api/ varsa kaldır
    const cleanEndpoint = endpoint.startsWith('/api/') ? endpoint.substring(4) : endpoint;
    
    // Başında / yoksa ekle
    const path = cleanEndpoint.startsWith('/') ? cleanEndpoint : '/' + cleanEndpoint;
    
    return API_URL + path;
}

// ===============================================
// INITIALIZATION
// ===============================================

// Sayfa yüklendiğinde sidebar'ı yükle
document.addEventListener('DOMContentLoaded', loadSideBar);

// Global değişkenleri window nesnesine ekle
window.API_URL = API_URL;
window.formatCurrency = formatCurrency;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.formatPhoneNumber = formatPhoneNumber;
window.formatDeliveryTime = formatDeliveryTime;
window.getStatusBadge = getStatusBadge;
window.loadSideBar = loadSideBar;
window.showError = showError;
window.showSuccess = showSuccess;
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.fetchAPI = fetchAPI;
window.getApiUrl = getApiUrl;