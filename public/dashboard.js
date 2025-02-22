// Dashboard ilk yükleme
document.addEventListener('DOMContentLoaded', async () => {
    await loadSideBar();
    await loadDashboardData();
    await loadRecentOrders();

    // 5 dakikada bir güncelle
    setInterval(loadDashboardData, 5 * 60 * 1000);
});

async function loadDashboardData() {
    try {
        const response = await fetch(getApiUrl('/dashboard'));
        const data = await response.json();

        if (!data.success) throw new Error(data.error);

        // İstatistik kartları
        updateStats(data.deliveryStats);
        
        // Teslimat programı
        updateDeliveryProgram(data.orderSummary);
        
        // Kritik stok
        updateLowStock(data.lowStock);
        
        // Son siparişler
        updateRecentOrders(data.recentOrders);

    } catch (error) {
        console.error('Dashboard veri hatası:', error);
        showToast('error', 'Veriler yüklenemedi');
    }
}

function updateStats(stats) {
    document.getElementById('ordersToday').textContent = `${stats.total_orders || 0}`;
    document.getElementById('deliveredOrders').textContent = `${stats.delivered_orders || 0}`;
    document.getElementById('pendingDeliveries').textContent = `${stats.pending_orders || 0}`;
    document.getElementById('lowStockCount').textContent = `${stats.low_stock_count || 0}`;
}

async function loadRecentOrders() {
    try {
        const response = await fetch(getApiUrl('/dashboard/recent-orders'));
        const data = await response.json();

        if (!data.success) throw new Error(data.error);

        const tbody = document.querySelector('#recentOrders tbody');
        tbody.innerHTML = data.orders.map(order => `
            <tr>
                <td>
                    <div>${order.customer_name}</div>
                    <small class="text-muted">${order.customer_phone}</small>
                </td>
                <td>${order.items_summary}</td>
                <td>
                    <div>${formatDate(order.delivery_date)}</div>
                    <small class="text-muted">${formatDeliveryTime(order.delivery_time)}</small>
                </td>
                <td>
                    <span class="badge bg-${getStatusColor(order.status)}">
                        ${formatStatus(order.status)}
                    </span>
                </td>
                <td>${formatPrice(order.total_amount)}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Son siparişler yükleme hatası:', error);
        const tbody = document.querySelector('#recentOrders tbody');
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Veriler yüklenemedi</td></tr>';
    }
}

// Dashboard yardımcı fonksiyonları
function updateDeliveryProgram(summary) {
    document.getElementById('today-orders').textContent = `${summary[0]?.count || 0} Sipariş`;
    document.getElementById('tomorrow-orders').textContent = `${summary[1]?.count || 0} Sipariş`;
    document.getElementById('future-orders').textContent = `${summary[2]?.count || 0} Sipariş`;
}

function updateTomorrowNeeds(needs) {
    const stockList = document.getElementById('low-stock-list');
    stockList.innerHTML = needs.length > 0 
        ? needs.map(item => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0">${item.name}</h6>
                        <small class="text-muted">Mevcut: ${item.current_stock}</small>
                    </div>
                    <span class="badge bg-warning">${item.needed_quantity} gerekli</span>
                </div>
            </div>
        `).join('')
        : '<div class="list-group-item text-center">Kritik stok yok</div>';
}

function getStatusColor(status) {
    const colors = {
        'new': 'info',
        'confirmed': 'primary',
        'preparing': 'warning',
        'ready': 'success',
        'delivering': 'warning',
        'delivered': 'success',
        'cancelled': 'danger'
    };
    return colors[status] || 'secondary';
}

function formatDeliveryTime(time) {
    const times = {
        'morning': 'Sabah (09:00-12:00)',
        'afternoon': 'Öğleden Sonra (12:00-17:00)',
        'evening': 'Akşam (17:00-21:00)'
    };
    return times[time] || time;
}

function updateRecentOrders(orders) {
    const tbody = document.querySelector('#recentOrders tbody');
    if (!orders?.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Sipariş bulunmuyor</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>
                <div>${order.customer_name}</div>
                <small class="text-muted">${formatPhoneNumber(order.customer_phone)}</small>
            </td>
            <td>${order.items_summary}</td>
            <td>
                <div>${formatDate(order.delivery_date)}</div>
                <small class="text-muted">${formatDeliveryTime(order.delivery_time)}</small>
            </td>
            <td>${getStatusBadge(order.status)}</td>
            <td>${formatPrice(order.total_amount)}</td>
        </tr>
    `).join('');
}