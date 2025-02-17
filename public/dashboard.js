document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadDashboardData();
    // Her 5 dakikada bir güncelle
    setInterval(loadDashboardData, 300000);
});

async function loadDashboardData() {
    try {
        const response = await fetch('http://localhost:8787/api/dashboard');
        
        if (!response.ok) {
            console.error('API Error:', await response.text());
            throw new Error('API Error');
        }
        
        const data = await response.json();
        console.log('Dashboard data:', data); // Debug için

        if (!data.success) {
            throw new Error(data.message || 'API Error');
        }

        // 1. Teslimat Durumu Kartı
        updateDeliveryCard(data.deliveryStats);
        
        // 2. Finansal Durum Kartı
        updateFinanceCard(data.finance);
        
        // 3. Kritik Durumlar Kartı
        updateCriticalCard(data.criticalStats);
        
        // 4. Günlük Hedefler Kartı
        updateTargetsCard(data.targets);

        // Son güncelleme zamanını göster
        document.getElementById('lastUpdate').textContent = 
            `Son güncelleme: ${new Date().toLocaleTimeString()}`;

    } catch (error) {
        console.error('Dashboard hatası:', error);
        showError('Veriler yüklenemedi!');
    }
}

async function loadRecentOrders() {
    const response = await fetch(`${API_URL}/orders/recent`);
    // ...existing code...
}

function updateDeliveryCard(stats) {
    if (!stats) return;
    document.getElementById('totalDeliveries').textContent = stats.total_orders;
    document.getElementById('preparingOrders').textContent = stats.preparing_orders;
    document.getElementById('deliveringOrders').textContent = stats.pending_orders;
    document.getElementById('deliveredOrders').textContent = stats.delivered_orders;
    
    // Dağılım grafiğini güncelle
    updateDeliveryChart([
        stats.preparing_orders,
        stats.pending_orders,
        stats.delivered_orders
    ]);
}

function updateFinanceCard(finance) {
    if (!finance) return;
    document.getElementById('dailyRevenue').textContent = 
        formatCurrency(finance.daily_revenue);
    document.getElementById('avgOrderValue').textContent = 
        formatCurrency(finance.avg_order_value);
    
    // Ödeme dağılımı grafiğini güncelle
    updatePaymentChart(finance.payment_distribution);
}

function updateCriticalCard(stats) {
    if (!stats) return;
    document.getElementById('delayedDeliveries').textContent = stats.delayed_deliveries;
    document.getElementById('complaints').textContent = stats.complaints;
    document.getElementById('potentialCancellations').textContent = stats.cancellations;
    
    // Zaman çizelgesini güncelle
    updateCriticalTimeline(stats.timeline);
}

function updateTargetsCard(targets) {
    // targets verisi undefined ise default değerler kullan
    const defaultTargets = {
        delivered_orders: 0,
        delivery_target: 1,  // 0'a bölme hatasını önlemek için 1
        daily_revenue: 0,
        revenue_target: 1,   // 0'a bölme hatasını önlemek için 1
        satisfaction_rate: 0
    };

    targets = targets || defaultTargets;

    // Güvenli hesaplama
    const deliveryProgress = Math.min(100, Math.round((targets.delivered_orders || 0) / (targets.delivery_target || 1) * 100));
    const revenueProgress = Math.min(100, Math.round((targets.daily_revenue || 0) / (targets.revenue_target || 1) * 100));
    
    // Güvenli güncelleme
    document.getElementById('deliveryProgress').style.width = `${deliveryProgress}%`;
    document.getElementById('revenueProgress').style.width = `${revenueProgress}%`;
    
    // Hedef değerleri göster
    document.getElementById('deliveryTarget').textContent = 
        `${targets.delivered_orders || 0}/${targets.delivery_target || 0}`;
    document.getElementById('revenueTarget').textContent = 
        `${formatCurrency(targets.daily_revenue || 0)}/${formatCurrency(targets.revenue_target || 0)}`;
    document.getElementById('satisfactionRate').textContent = 
        `${(targets.satisfaction_rate || 0).toFixed(1)}/5.0`;
}

// Yardımcı fonksiyonlar
function updateDeliveryChart(data) {
    // Chart.js ile teslimat dağılım grafiği
}

function updatePaymentChart(data) {
    // Chart.js ile ödeme dağılım grafiği
}

function updateCriticalTimeline(data) {
    // Timeline grafiği
}

function showError(message) {
    const toast = `
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div class="toast align-items-center text-bg-danger border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-x-circle"></i> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toast);
    const toastEl = document.querySelector('.toast');
    const bsToast = new bootstrap.Toast(toastEl);
    bsToast.show();
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