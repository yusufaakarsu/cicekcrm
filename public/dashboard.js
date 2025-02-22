// Dashboard ilk yükleme
document.addEventListener('DOMContentLoaded', async () => {
    // Header'ı yükle
    await loadSideBar();
    await loadDashboardData();
    await loadRecentOrders();
});

async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard');
        const data = await response.json();

        if (!data.success) throw new Error(data.error);

        // İstatistik kartlarını güncelle
        document.getElementById('ordersToday').textContent = data.deliveryStats.total_orders;
        document.getElementById('deliveredOrders').textContent = data.deliveryStats.delivered_orders;
        document.getElementById('pendingDeliveries').textContent = data.deliveryStats.pending_orders;
        document.getElementById('lowStockCount').textContent = data.tomorrowNeeds.length;

        // Teslimat programını güncelle
        if (data.orderSummary.length > 0) {
            document.getElementById('today-orders').textContent = `${data.orderSummary[0].count} Sipariş`;
            if (data.orderSummary[1]) {
                document.getElementById('tomorrow-orders').textContent = `${data.orderSummary[1].count} Sipariş`;
            }
            if (data.orderSummary[2]) {
                document.getElementById('future-orders').textContent = `${data.orderSummary[2].count} Sipariş`;
            }
        }

        // Düşük stok listesini güncelle
        const lowStockList = document.getElementById('low-stock-list');
        lowStockList.innerHTML = data.tomorrowNeeds.map(item => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0">${item.name}</h6>
                        <small class="text-muted">Mevcut: ${item.current_stock}</small>
                    </div>
                    <span class="badge bg-warning">${item.needed_quantity} gerekli</span>
                </div>
            </div>
        `).join('') || '<div class="list-group-item text-center">Kritik stok yok</div>';

    } catch (error) {
        console.error('Dashboard veri yükleme hatası:', error);
        showToast('error', 'Dashboard verisi yüklenemedi');
    }
}

async function loadRecentOrders() {
    try {
        const response = await fetch('/api/dashboard/recent-orders');
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

// Yardımcı fonksiyonlar
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

// 5 dakikada bir güncelle
setInterval(loadDashboardData, 5 * 60 * 1000);