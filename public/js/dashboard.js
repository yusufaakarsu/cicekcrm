document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        // Sadece gerekli API çağrılarını yapalım
        const [dashboardStats, financeStats] = await Promise.all([
            fetch(`${API_URL}/api/dashboard`).then(r => r.json()),
            fetch(`${API_URL}/api/finance/stats`).then(r => r.json())
        ]);

        // Ana sayfa kartlarını güncelle
        updateSummaryStats(dashboardStats, financeStats);
        
        // Stok uyarılarını yükle
        loadLowStockWarnings(dashboardStats.tomorrowNeeds);

    } catch (error) {
        console.error('Dashboard veri yükleme hatası:', error);
    }
}

function updateSummaryStats(dashboard, finance) {
    // Teslimat istatistikleri
    document.getElementById('todayDeliveries').textContent = dashboard.deliveryStats.total_orders;
    document.getElementById('completedDeliveries').textContent = dashboard.deliveryStats.delivered_orders;
    
    // Yarının siparişleri
    document.getElementById('tomorrowOrders').textContent = dashboard.orderSummary[0]?.count || 0;
    document.getElementById('needsAttention').textContent = dashboard.tomorrowNeeds.length;
    
    // Finansal veriler
    document.getElementById('dailyRevenue').textContent = formatCurrency(finance.dailyRevenue);
    document.getElementById('profitMargin').textContent = `%${finance.profitMargin}`;
    
    // Stok durumu
    document.getElementById('lowStock').textContent = dashboard.lowStock;
    document.getElementById('outOfStock').textContent = dashboard.lowStock;
}

async function loadDeliveries() {
    try {
        const response = await fetch(`${API_URL}/orders/today`);
        const deliveries = await response.json();

        document.getElementById('deliveryList').innerHTML = deliveries.map(delivery => `
            <tr>
                <td>${formatTime(delivery.delivery_date)}</td>
                <td>${delivery.recipient_name}</td>
                <td>${delivery.delivery_address}</td>
                <td>${getStatusBadge(delivery.status)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewOrder(${delivery.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Teslimat listesi yükleme hatası:', error);
    }
}

async function loadRecentTransactions() {
    try {
        const response = await fetch(`${API_URL}/api/finance/transactions`);
        const transactions = await response.json();

        document.getElementById('recentTransactions').innerHTML = transactions.map(tx => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold">${tx.customer_name}</div>
                        <small class="text-muted">${formatDate(tx.created_at)}</small>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold ${tx.status === 'paid' ? 'text-success' : 'text-warning'}">
                            ${formatCurrency(tx.amount)}
                        </div>
                        <small class="text-muted">${formatPaymentStatus(tx.status)}</small>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Son işlemler yükleme hatası:', error);
    }
}

function loadLowStockWarnings(items) {
    document.getElementById('lowStockList').innerHTML = items.map(item => `
        <div class="list-group-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <div class="fw-bold">${item.name}</div>
                    <small class="text-muted">Stok: ${item.current_stock}</small>
                </div>
                <div class="text-danger">
                    ${item.needed_quantity} adet gerekli
                </div>
            </div>
        </div>
    `).join('');
}

function updateTopProducts(products) {
    const container = document.querySelector('.top-products');
    if (!container) return;

    container.innerHTML = products.map(product => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <div class="fw-bold">${product.name}</div>
                <small class="text-muted">${product.total_sold} adet satıldı</small>
            </div>
            <span class="text-success">${formatCurrency(product.total_revenue)}</span>
        </div>
    `).join('');
}

function updatePopularAreas(areas) {
    const container = document.querySelector('.delivery-areas');
    if (!container) return;

    container.innerHTML = areas.map(area => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <div class="fw-bold">${area.district}</div>
                <small class="text-muted">${area.delivery_count} teslimat</small>
            </div>
            <span class="badge bg-info">%${area.percentage}</span>
        </div>
    `).join('');
}

function updateTimeSlots(slots) {
    const timeSlotMap = {
        'morning': 'morningCount',
        'afternoon': 'afternoonCount',
        'evening': 'eveningCount'
    };

    slots.forEach(slot => {
        const elementId = timeSlotMap[slot.delivery_time_slot];
        if (elementId) {
            document.getElementById(elementId).textContent = slot.count;
        }
    });
}

function updateCustomerDistribution(distribution) {
    const typeMap = {
        'retail': 'retailCount',
        'corporate': 'corporateCount'
    };

    distribution.forEach(type => {
        const elementId = typeMap[type.customer_type];
        if (elementId) {
            document.getElementById(elementId).textContent = type.count;
        }
    });
}

// Yeni fonksiyonlar
function updateSalesTrend(data) {
    const container = document.getElementById('salesTrendChart');
    if (!container) return;

    let html = data.map(item => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <div class="fw-bold">${formatDate(item.date)}</div>
                <small class="text-muted">${item.total_orders} sipariş</small>
            </div>
            <span class="text-success">${formatCurrency(item.revenue)}</span>
        </div>
    `).join('');

    container.innerHTML = html;
}

function updateTopCustomers(data) {
    const container = document.getElementById('topCustomers');
    if (!container) return;

    let html = data.map(customer => `
        <div class="list-group-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <div class="fw-bold">${customer.name}</div>
                    <small class="text-muted">${customer.order_count} sipariş</small>
                </div>
                <div class="text-end">
                    <div class="fw-bold text-success">${formatCurrency(customer.total_spent)}</div>
                    <small class="text-muted">${formatDate(customer.last_order_date)}</small>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

function updateDeliveryPerformance(data) {
    // Başarı oranını göster
    const successRate = document.getElementById('deliverySuccessRate');
    if (successRate) {
        const rate = data.find(item => item.delivery_status === 'completed')?.success_rate || 0;
        successRate.textContent = `%${rate}`;
    }

    // Durumları listele
    const statsContainer = document.getElementById('deliveryStats');
    if (!statsContainer) return;

    const statusMap = {
        'pending': { label: 'Bekleyen', color: 'warning' },
        'completed': { label: 'Tamamlanan', color: 'success' },
        'failed': { label: 'Başarısız', color: 'danger' }
    };

    let html = data.map(stat => `
        <div class="text-center">
            <div class="h4 mb-0 text-${statusMap[stat.delivery_status]?.color || 'secondary'}">
                ${stat.count}
            </div>
            <small class="text-muted">${statusMap[stat.delivery_status]?.label || stat.delivery_status}</small>
        </div>
    `).join('');

    statsContainer.innerHTML = html;
}

// Helper fonksiyonlar
function formatCurrency(amount) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('tr-TR').format(new Date(date));
}

function formatTime(datetime) {
    return new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(datetime));
}

function getStatusBadge(status) {
    const badges = {
        'new': '<span class="badge bg-primary">Yeni</span>',
        'preparing': '<span class="badge bg-warning">Hazırlanıyor</span>',
        'ready': '<span class="badge bg-info">Hazır</span>',
        'delivering': '<span class="badge bg-warning">Yolda</span>',
        'delivered': '<span class="badge bg-success">Teslim Edildi</span>',
        'cancelled': '<span class="badge bg-danger">İptal</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

function formatPaymentStatus(status) {
    const statusMap = {
        'paid': 'Ödendi',
        'pending': 'Bekliyor',
        'cancelled': 'İptal'
    };
    return statusMap[status] || status;
}

function viewOrder(id) {
    window.location.href = `/orders/${id}`;
}