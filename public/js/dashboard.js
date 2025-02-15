document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        const [dashboardStats, financeStats, topProducts, popularAreas, timeSlots, customerDistribution] = await Promise.all([
            fetch(`${API_URL}/api/dashboard`).then(r => r.json()),
            fetch(`${API_URL}/api/finance/stats`).then(r => r.json()),
            fetch(`${API_URL}/products/top-selling`).then(r => r.json()),
            fetch(`${API_URL}/orders/popular-areas`).then(r => r.json()),
            fetch(`${API_URL}/orders/time-slots`).then(r => r.json()),
            fetch(`${API_URL}/customers/distribution`).then(r => r.json())
        ]);

        // Mevcut güncellemeler
        updateSummaryStats(dashboardStats, financeStats);
        loadLowStockWarnings(dashboardStats.tomorrowNeeds);

        // Yeni bölümleri güncelle
        updateTopProducts(topProducts);
        updatePopularAreas(popularAreas);
        updateTimeSlots(timeSlots);
        updateCustomerDistribution(customerDistribution);

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