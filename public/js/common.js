// API URL'ini global olarak tanımla
const API_URL = 'https://cicek-crm-api.yusufaakarsu.workers.dev';

// Header yükleme fonksiyonu
async function loadHeader() {
    try {
        const response = await fetch('/common/header.html');
        const html = await response.text();
        document.getElementById('header').innerHTML = html;
        
        // Aktif sayfayı işaretle
        const currentPage = document.body.dataset.page;
        if (currentPage) {
            document.querySelector(`[data-page="${currentPage}"]`)?.classList.add('active');
        }
    } catch (error) {
        console.error('Header yüklenemedi:', error);
    }
}

// Format para birimi
function formatCurrency(amount) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(amount);
}

async function fetchAPI(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) throw new Error('API Hatası');
    return response.json();
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

async function loadDashboardData() {
    try {
        const response = await fetch(`${API_URL}/api/dashboard`);
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
        const response = await fetch(`${API_URL}/orders`);
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
