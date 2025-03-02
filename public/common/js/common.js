const CONFIG = {
    API_URL: window.location.hostname.includes('shirincicek.com')
        ? 'https://api.shirincicek.com/api'
        : window.location.hostname.includes('pages.dev')
            ? 'https://cicek-crm-api.yusufaakarsu.workers.dev/api'
            : `${window.location.protocol}//${window.location.host}/api`,
    HERE_API_KEY: '8ga3iUSKvwTytKYkk8PbpnnH5iCFlNDsvFoSyCghhjI'
};
const API_URL = CONFIG.API_URL;

async function loadSideBar() {
    try {
        console.log('Sidebar yükleniyor...');
        const response = await fetch('/common/sidebar.html');
        if (!response.ok) {
            console.error('Sidebar yüklenemedi:', response.status);
            return;
        }
        const html = await response.text();
        const sidebarEl = document.getElementById('mainSidebar');
        if (!sidebarEl) {
            console.error('Sidebar elementi bulunamadı: #mainSidebar');
            return;
        }
        sidebarEl.innerHTML = html;
    } catch (error) {
        console.error('Sidebar yükleme hatası:', error);
    }
}

// Yardımcı fonksiyonlar
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0 ₺';
    const isInteger = Number.isInteger(Number(amount));
    return new Intl.NumberFormat('tr-TR', { 
        style: 'currency', 
        currency: 'TRY',
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: isInteger ? 0 : 2
    }).format(amount);
}

function parseCurrency(text) {
    if (!text) return 0;
    return parseFloat(text.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
}

function formatPrice(amount) {
    if (amount === null || amount === undefined) return '0,00';
    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

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
    if (!date) return '-';
    return new Intl.DateTimeFormat('tr-TR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    }).format(new Date(date));
}

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

function formatPhoneNumber(phone) {
    if (!phone) return '';
    phone = phone.toString().trim().replace(/\D/g, '');
    if (phone.length === 10 && !phone.startsWith('0')) {
        phone = '0' + phone;
    }
    return phone.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
}

function formatDeliveryTime(slot) {
    const slots = {
        'morning': '📅 Sabah (09:00-12:00)', 
        'afternoon': '🌞 Öğleden Sonra (12:00-17:00)',
        'evening': '🌙 Akşam (17:00-21:00)'
    };
    return slots[slot] || slot;
}

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

function formatPaymentMethod(method) {
    const methodMap = {
        'credit_card': 'Kredi Kartı',
        'bank_transfer': 'Havale/EFT',
        'cash': 'Nakit'
    };
    return methodMap[method] || method;
}

function formatNumber(number) {
    return number?.toLocaleString('tr-TR') || '0';
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Bildirim fonksiyonları
function showError(message) {
    console.error(message);
    showNotification('error', message);
}

function showSuccess(message) {
    showNotification('success', message);
}

function showNotification(type, message) {
    const existingToast = document.querySelector('.toast-container');
    if (existingToast) {
        existingToast.remove();
    }
    const isError = type === 'error';
    const bgColor = isError ? 'bg-danger' : 'bg-success';
    const icon = isError ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill';
    const delay = isError ? 5000 : 3000;
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
    const bsToast = new bootstrap.Toast(toast.querySelector('.toast'), {
        autohide: true,
        delay: delay
    });
    bsToast.show();
    setTimeout(() => {
        toast.remove();
    }, delay + 500);
}

function showToast(type, message) {
    const toast = document.getElementById('toast');
    if (!toast) {
        showNotification(type, message);
        return;
    }
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    toast.className = `toast ${type === 'error' ? 'bg-danger text-white' : 'bg-success text-white'}`;
    toastTitle.textContent = type === 'error' ? 'Hata' : 'Bilgi';
    toastMessage.textContent = message;
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Yükleme göstergesi
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

function hideLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
        loader.classList.add('d-none');
    }
}

// Cookie işlemleri
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// API istekleri
async function fetchAPI(endpoint, options = {}) {
    const apiUrl = API_URL + endpoint;
    console.log(`API Request to ${apiUrl}:`, { 
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body) : undefined 
    });
    
    // Headers basitleştirildi - artık auth token kullanılmıyor
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    try {
        const response = await fetch(apiUrl, {
            ...options,
            headers,
            credentials: 'include' // SSO için gerekirse cookie gönderimi
        });
        
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

function getApiUrl(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/api/') ? endpoint.substring(4) : endpoint;
    const path = cleanEndpoint.startsWith('/') ? endpoint : '/' + cleanEndpoint;
    return API_URL + path;
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', () => {
  // Sidebar'ı yükle
  loadSideBar();
  
  const style = document.createElement('style');
  style.textContent = `
        .table-row-clickable {
            cursor: pointer;
            transition: background-color 0.15s ease-in-out;
        }
        .table-row-clickable:hover {
            background-color: rgba(0, 0, 0, 0.05);
        }
    `;
  document.head.appendChild(style);
  
  const menuStyle = document.createElement('style');
  menuStyle.textContent = `
        .menu-parent-active {
            color: var(--bs-primary) !important;
            font-weight: 500;
        }
        .nav-link.active {
            font-weight: 600;
            position: relative;
        }
        .nav-link.active::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: 3px;
            background-color: var(--bs-primary);
            border-radius: 0 2px 2px 0;
        }
    `;
  document.head.appendChild(menuStyle);
});

// Global değişken ve fonksiyon tanımlamaları
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