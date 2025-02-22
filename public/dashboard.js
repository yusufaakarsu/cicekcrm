// Dashboard ilk yükleme
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});

async function loadDashboard() {
    try {
        console.log('Loading dashboard...');
        const response = await fetch(getApiUrl('/dashboard'));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Dashboard data:', data);

        if (!data.success) {
            throw new Error(data.error || 'API Error');
        }

        // Null check ekle
        if (!data.metrics || !data.todayOrders) {
            throw new Error('Invalid API response format');
        }

        updateMetrics(data.metrics);
        renderTodayOrders(data.todayOrders);

    } catch (error) {
        console.error('Dashboard error:', error);
        showError('Dashboard yüklenemedi: ' + error.message);
        
        // Hata durumunda UI'ı temizle
        clearDashboard();
    }
}

// Hata durumunda UI'ı temizle
function clearDashboard() {
    const metrics = {
        total_orders: '-',
        new_orders: '-',
        active_deliveries: '-',
        today_deliveries: '-',
        total_customers: '-',
        total_revenue: '-',
        today_orders: '-',
        delivered_orders: '-',
        pending_deliveries: '-',
        low_stock_count: '-'
    };
    
    updateMetrics(metrics);
    renderTodayOrders([]);
}

function updateMetrics(metrics) {
    // Her bir metrik güncellemesi için null kontrolü ekle
    const elements = {
        'totalOrders': metrics.total_orders,
        'newOrders': metrics.new_orders,
        'activeDeliveries': metrics.active_deliveries,
        'todayDeliveries': metrics.today_deliveries,
        'totalCustomers': metrics.total_customers,
        'totalRevenue': metrics.total_revenue,
        'ordersToday': metrics.today_orders,
        'deliveredOrders': metrics.delivered_orders,
        'pendingDeliveries': metrics.pending_deliveries,
        'lowStockCount': metrics.low_stock_count
    };

    // Güvenli güncelleme
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value ?? '-';
        }
    });
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