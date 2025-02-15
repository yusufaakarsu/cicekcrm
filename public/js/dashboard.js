document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        const [dashboardStats, deliveryStats, areaStats, salesData, stockWarnings] = await Promise.all([
            fetch(`${API_URL}/api/dashboard/summary`).then(r => r.json()),
            fetch(`${API_URL}/api/dashboard/delivery-stats`).then(r => r.json()),
            fetch(`${API_URL}/api/dashboard/area-stats`).then(r => r.json()),
            fetch(`${API_URL}/api/dashboard/recent-sales`).then(r => r.json()),
            fetch(`${API_URL}/api/dashboard/stock-warnings`).then(r => r.json())
        ]);

        updateSummaryCards(dashboardStats);
        updateDeliveryStats(deliveryStats);
        updateAreaStats(areaStats);
        updateRecentSales(salesData);
        updateStockWarnings(stockWarnings);

    } catch (error) {
        console.error('Dashboard veri yükleme hatası:', error);
    }
}

function updateSummaryCards(data) {
    document.getElementById('todayDeliveries').textContent = data.deliveries.total;
    document.getElementById('completedDeliveries').textContent = `${data.deliveries.completed} tamamlandı`;
    
    document.getElementById('dailyRevenue').textContent = formatCurrency(data.revenue.total);
    document.getElementById('profitMargin').textContent = `${data.revenue.margin}% kar`;
    
    document.getElementById('tomorrowOrders').textContent = data.tomorrow.total;
    document.getElementById('needsAttention').textContent = `${data.tomorrow.preparing} hazırlanacak`;
    
    document.getElementById('lowStock').textContent = data.stock.low;
    document.getElementById('criticalStock').textContent = `${data.stock.critical} kritik`;
}

function updateDeliveryStats(data) {
    const container = document.getElementById('deliveryStats');
    
    const html = `
        <div class="d-flex justify-content-around text-center">
            ${data.stats.map(stat => `
                <div>
                    <h3 class="text-${stat.color}">${stat.count}</h3>
                    <div class="small text-muted">${stat.label}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = html;
}

function updateAreaStats(data) {
    const container = document.getElementById('areaStats');
    
    const html = data.areas.map(area => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <div class="fw-bold">${area.name}</div>
                <small class="text-muted">${area.count} teslimat</small>
            </div>
            <span class="badge bg-primary">${area.percentage}%</span>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function updateRecentSales(data) {
    const container = document.getElementById('recentSales');
    
    const html = data.sales.map(sale => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <div class="fw-bold">${sale.customer}</div>
                <small class="text-muted">${formatDate(sale.date)}</small>
            </div>
            <span class="text-success">${formatCurrency(sale.amount)}</span>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function updateStockWarnings(data) {
    const container = document.getElementById('stockWarnings');
    
    const html = data.warnings.map(item => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <div class="fw-bold">${item.name}</div>
                <small class="text-muted">Stok: ${item.current}</small>
            </div>
            <span class="text-danger">Min: ${item.minimum}</span>
        </div>
    `).join('');
    
    container.innerHTML = html;
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