// Environment variables'ı doğrudan tanımla
const CONFIG = {
    HERE_API_KEY: '8ga3iUSKvwTytKYkk8PbpnnH5iCFlNDsvFoSyCghhjI' // HERE API KEY buraya eklenecek
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

// Development/Production URL kontrolü - dinamik versiyonu
const isDevelopment = window.location.hostname.includes('pages.dev');

// API ve uygulama URL'leri - düzeltildi
const BASE_URL = window.location.origin; // Mevcut domaini kullan
    
const API_URL = 'https://cicek-crm-api.yusufaakarsu.workers.dev/api';

// Header yükleme fonksiyonu
async function loadSideBar() {
    const response = await fetch('/common/sidebar.html');  // header.html -> sidebar.html
    const html = await response.text();
    document.getElementById('mainSidebar').innerHTML = html;  // header -> mainSidebar
}

// Sayfa yüklendiğinde header'ı yükle
document.addEventListener('DOMContentLoaded', loadSideBar);

// Format para birimi
function formatCurrency(amount) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(amount);
}

// Para formatı
function formatPrice(amount) {
    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// API temel URL'i ve endpoint'leri
const API_ENDPOINTS = {
    CATEGORIES: '/product-categories', 
    PRODUCTS: '/products',
    CUSTOMERS: '/customers',
    ORDERS: '/orders'
};

// API çağrıları için yardımcı fonksiyon
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    console.log('API Request:', url);

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function showLoading(element) {
    element.classList.add('loading');
}

function hideLoading(element) {
    element.classList.remove('loading');
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

async function loadDashboardData() {
    try {
        // /api/api/dashboard yerine /api/dashboard kullanılacak
        const response = await fetch(`/api/dashboard`); // api/ prefix'i kaldırıldı
        if (!response.ok) throw new Error('API Hatası');
        const data = await response.json();

        // İstatistik kartları güncelleme
        document.getElementById('ordersToday').textContent = `${data.deliveryStats.total_orders} Sipariş`;
        document.getElementById('deliveredOrders').textContent = `${data.deliveryStats.delivered_orders} Teslim Edilen`;
        document.getElementById('pendingDeliveries').textContent = `${data.deliveryStats.pending_orders} Teslimat`;

        // Teslimat programı güncelleme
        const summary = data.orderSummary;
        document.getElementById('today-orders').textContent = `${summary[0]?.count || 0} Sipariş`;
        document.getElementById('tomorrow-orders').textContent = `${summary[1]?.count || 0} Sipariş`;
        document.getElementById('future-orders').textContent = `${summary[2]?.count || 0} Sipariş`;

        // Yarının ürün ihtiyaçları
        const stockList = document.getElementById('low-stock-list');
        if (data.tomorrowNeeds && data.tomorrowNeeds.length > 0) {
            stockList.innerHTML = data.tomorrowNeeds.map(item => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${item.name}</span>
                    <span>İhtiyaç: ${item.needed_quantity} adet</span>
                </div>
            `).join('');
        } else {
            stockList.innerHTML = '<div class="list-group-item">Yarın için sipariş yok</div>';
        }

        // Düşük stok
        document.getElementById('lowStockCount').textContent = `${data.lowStock} Ürün`;

        // Son güncelleme
        document.getElementById('status').innerHTML = `
            <i class="bi bi-check-circle"></i> Son güncelleme: ${new Date().toLocaleTimeString()}
        `;
    } catch (error) {
        console.error('Dashboard hatası:', error);
        document.getElementById('status').innerHTML = `
            <i class="bi bi-exclamation-triangle"></i> Bağlantı hatası!
        `;
    }
}

async function loadRecentOrders() {
    try {
        const response = await fetch(`/api/orders`);
        if (!response.ok) throw new Error('API Hatası');
        const orders = await response.json();
        
        const recentOrdersTable = document.getElementById('recentOrders').getElementsByTagName('tbody')[0];
        
        if (orders && orders.length > 0) {
            recentOrdersTable.innerHTML = orders.map(order => `
                <tr>
                    <td>${order.customer_name}</td>
                    <td>${order.items ? order.items.map(item => `${item.quantity}x ${item.name}`).join('<br>') : '-'}</td>
                    <td>
                        ${formatDate(order.delivery_date)}<br>
                        <small class="text-muted">${order.delivery_address}</small>
                    </td>
                    <td>${getStatusBadge(order.status)}</td>
                    <td>${formatCurrency(order.total_amount)}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Recent orders error:', error);
    }
}

// Export
window.API_URL = API_URL;
window.formatCurrency = formatCurrency;
window.loadSideBar = loadSideBar;
window.showError = showError;
window.showSuccess = showSuccess;