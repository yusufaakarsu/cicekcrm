document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        console.log('Dashboard verisi yükleniyor...');
        const response = await fetch(`${API_URL}/api/dashboard`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || 'API yanıt vermedi');
        }
        
        const data = await response.json();
        console.log('Gelen veri:', data);

        // Teslimat İstatistikleri
        document.getElementById('todayDeliveries').textContent = data.deliveryStats.total_orders;
        document.getElementById('completedDeliveries').textContent = `${data.deliveryStats.delivered_orders} tamamlandı`;
        document.getElementById('onRouteCount').textContent = data.deliveryStats.pending_orders;
        document.getElementById('preparingCount').textContent = data.deliveryStats.preparing_orders;
        
        // Finansal İstatistikler
        document.getElementById('dailyRevenue').textContent = formatCurrency(data.finance.daily_revenue);
        document.getElementById('monthlyIncome').textContent = formatCurrency(data.finance.monthly_income);
        document.getElementById('pendingPayments').textContent = formatCurrency(data.finance.pending_payments);
        document.getElementById('profitMargin').textContent = `${data.finance.profit_margin}%`;
        
        // Müşteri İstatistikleri
        document.getElementById('newCustomers').textContent = data.customers.new_count;
        document.getElementById('repeatCustomers').textContent = data.customers.repeat_count;
        document.getElementById('avgBasket').textContent = formatCurrency(data.customers.avg_basket);
        
        // Stok İstatistikleri
        document.getElementById('lowStock').textContent = data.lowStock;
        document.getElementById('stockAlert').textContent = `${data.lowStock} ürün kritik`;

    } catch (error) {
        console.error('Dashboard veri yükleme hatası:', error);
        // Hata mesajını göster
        document.querySelectorAll('[id$="Count"],[id$="Revenue"],[id$="Income"],[id$="Margin"],[id$="Stock"]')
            .forEach(el => el.textContent = '-');
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

function updateSummaryStats(data) {
    // Teslimat istatistikleri
    document.getElementById('todayDeliveries').textContent = data.delivery.today_total;
    document.getElementById('completedDeliveries').textContent = `${data.delivery.delivered} tamamlandı`;
    document.getElementById('deliveredCount').textContent = data.delivery.delivered;
    document.getElementById('deliveryRate').textContent = `${Math.round(data.delivery.delivered / data.delivery.today_total * 100)}%`;
    document.getElementById('onRouteCount').textContent = data.delivery.on_route;
    document.getElementById('routeStatus').textContent = `${data.delivery.on_route} kuryede`;
    document.getElementById('preparingCount').textContent = data.delivery.preparing;
    document.getElementById('prepStatus').textContent = `hazırlanıyor`;

    // Finansal istatistikler
    document.getElementById('dailyRevenue').textContent = formatCurrency(data.finance.daily_revenue);
    document.getElementById('monthlyIncome').textContent = formatCurrency(data.finance.monthly_income);
    document.getElementById('pendingPayments').textContent = formatCurrency(data.finance.pending_payments);
    document.getElementById('profitMargin').textContent = `${data.finance.avg_margin}%`;

    // Müşteri istatistikleri
    document.getElementById('newCustomers').textContent = data.customers.new_customers;
    document.getElementById('repeatCustomers').textContent = data.customers.repeat_customers;
    document.getElementById('avgBasket').textContent = formatCurrency(data.customers.avg_basket);

    // Stok istatistikleri
    document.getElementById('lowStock').textContent = data.stock.critical_count;
    document.getElementById('stockAlert').textContent = `${data.stock.critical_count} ürün kritik`;
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