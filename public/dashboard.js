// Dashboard ilk yükleme
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});

async function loadDashboard() {
    try {
        const response = await fetch(getApiUrl('/dashboard'));
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error('API Error: ' + response.status);
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'API Error');
        }

        console.log('Dashboard data:', data); // Debug için

        // Metrikleri güncelle 
        updateMetrics(data.metrics);
        
        // Bugünün siparişlerini listele
        renderTodayOrders(data.todayOrders);

    } catch (error) {
        console.error('Dashboard error:', error);
        showError('Dashboard yüklenemedi: ' + error.message);
    }
}

function updateMetrics(metrics) {
    document.getElementById('totalOrders').textContent = metrics.total_orders;
    document.getElementById('newOrders').textContent = metrics.new_orders;
    document.getElementById('activeDeliveries').textContent = metrics.active_deliveries;
    document.getElementById('todayDeliveries').textContent = metrics.today_deliveries;
    document.getElementById('totalCustomers').textContent = metrics.total_customers;
    document.getElementById('totalRevenue').textContent = formatCurrency(metrics.total_revenue);

    // İstatistik kartları
    document.getElementById('ordersToday').textContent = metrics.today_orders;
    document.getElementById('deliveredOrders').textContent = metrics.delivered_orders;
    document.getElementById('pendingDeliveries').textContent = metrics.pending_deliveries;
    document.getElementById('lowStockCount').textContent = metrics.low_stock_count;

    // Teslimat programı
    document.getElementById('today-orders').textContent = `${metrics.today_orders} Teslimat`;
    document.getElementById('tomorrow-orders').textContent = `${metrics.tomorrow_orders} Teslimat`;
    document.getElementById('future-orders').textContent = `${metrics.future_orders} Teslimat`;
}

function renderTodayOrders(orders) {
    const tbody = document.getElementById('todayOrdersTable');
    
    if (!orders?.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Bugün için sipariş bulunmuyor</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>
                <div class="fw-bold">${formatDeliveryTime(order.delivery_time)}</div>
                <div class="small text-muted">${order.delivery_district}</div>
            </td>
            <td>
                <div>${order.customer_name}</div>
                <div class="small text-muted">${formatPhoneNumber(order.customer_phone)}</div>
            </td>
            <td>
                <div>${order.recipient_name}</div>
                <div class="small text-muted">${formatPhoneNumber(order.recipient_phone)}</div>
            </td>
            <td>${order.items ? order.items.split(',').map(item => 
                `<div class="small">${item.trim()}</div>`
            ).join('') : '-'}</td>
            <td>${getStatusBadge(order.status)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" 
                        onclick="window.location.href='/orders/detail.html?id=${order.id}'">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
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