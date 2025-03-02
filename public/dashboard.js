// Global değişkenler
let salesPerformanceChart = null;
let categoryChart = null;
let orderStatusChart = null;
let deliveryChart = null;
let currentTimeRange = '30days'; // Varsayılan zaman aralığı
let currentDeliveryDay = 'today'; // Varsayılan teslimat günü filtresi

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    // Sidebar'ı yükle
    await loadSideBar();
    
    // Ana dashboard verilerini yükle
    try {
        await loadMainDashboardData();
        await loadDashboardData();
        await loadOrderStatusData();
        await loadDeliveryTimeData('today');
    } catch (error) {
        console.error('Dashboard data error:', error);
        showError('Bazı dashboard verileri yüklenemedi');
    }
    
    // Event listeners
    setupEventListeners();
    
    // Zaman aralığı butonunu aktif yap
    document.getElementById('timeRange30Days').classList.add('active');
    
    // Ek event listener'ları ekle
    document.getElementById('deliveryDayFilter')?.addEventListener('change', (e) => {
        currentDeliveryDay = e.target.value;
        loadDeliveryTimeData(currentDeliveryDay);
    });
    
    // Yeni grafikleri yükle
    try {
        await loadOrderStatusData();
        await loadDeliveryTimeData('today');
    } catch (error) {
        console.error('Additional charts error:', error);
    }
});

// Event listener'ları ayarla
function setupEventListeners() {
    // Zaman aralığı butonları
    document.getElementById('timeRange30Days').addEventListener('click', () => changeTimeRange('30days'));
    document.getElementById('timeRangeThisMonth').addEventListener('click', () => changeTimeRange('thismonth'));
    document.getElementById('timeRangeThisYear').addEventListener('click', () => changeTimeRange('thisyear'));
    
    // Teslimat günü filtresi
    document.getElementById('deliveryDayFilter')?.addEventListener('change', (e) => {
        currentDeliveryDay = e.target.value;
        loadDeliveryTimeData(currentDeliveryDay);
    });
}

// Ana dashboard bilgilerini yükle
async function loadMainDashboardData() {
    try {
        const response = await fetchAPI('/dashboard');
        
        if (response.success) {
            // Burada response.dashboard yerine doğrudan response'a erişmemiz gerekiyor
            // Backend, verileri {success: true, dashboard: {...}} formatında dönüyor
            const data = response.dashboard;
            
            // Üst kartlar
            document.getElementById('todaysDeliveryCount').textContent = formatNumber(data.today_deliveries);
            document.getElementById('newOrdersCount').textContent = formatNumber(data.new_orders);
            document.getElementById('lowStockCount').textContent = formatNumber(data.low_stock);
            document.getElementById('monthlyRevenue').textContent = formatCurrency(data.monthly_revenue);
        } else {
            console.error('Dashboard main data error:', response.error);
        }
        
    } catch (error) {
        console.error('Main dashboard data loading error:', error);
        throw error;
    }
}

// Dashboard verilerini yükle - her bir API isteği için ayrı try-catch ile
async function loadDashboardData() {
    showLoading();
    
    try {
        // Özet verileri
        try {
            const summaryData = await fetchAPI(`/dashboard/summary?timeRange=${currentTimeRange}`);
            if (summaryData.success) {
                updateSummaryCards(summaryData);
            }
        } catch (error) {
            console.error('Summary data error:', error);
            // Özet verisi hatası - sessiz geç
        }
        
        // Trend verileri - daha iyi hata yönetimi ekleyelim
        try {
            console.log(`Fetching trend data with timeRange: ${currentTimeRange}`);
            const trendData = await fetchAPI(`/dashboard/trends?timeRange=${currentTimeRange}`);
            console.log('Trend data response:', trendData);
            if (trendData.success) {
                updateSalesChart(trendData);
            } else {
                console.error('Trend data not successful:', trendData.error);
            }
        } catch (error) {
            console.error('Trend data error:', error);
        }
        
        // Kategori verileri
        try {
            const categoryData = await fetchAPI(`/dashboard/categories?timeRange=${currentTimeRange}`);
            if (categoryData.success) {
                updateCategoryChart(categoryData);
            }
        } catch (error) {
            console.error('Category data error:', error);
            // Kategori verisi hatası - sessiz geç
        }
        
        // Hedefler
        try {
            const targetData = await fetchAPI(`/dashboard/targets`);
            if (targetData.success) {
                updateTargets(targetData);
            }
        } catch (error) {
            console.error('Targets data error:', error);
            // Hedefler hatası - sessiz geç
        }
    } catch (error) {
        console.error('Dashboard data loading error:', error);
        throw error; // Ana hata - yukarıya ilet
    } finally {
        hideLoading();
    }
}

// Sipariş durumu verilerini yükle ve grafiği oluştur
async function loadOrderStatusData() {
    try {
        const response = await fetchAPI('/dashboard/order-status');
        if (!response.success) {
            throw new Error(response.error || 'Veri alınamadı');
        }
        
        updateOrderStatusChart(response.orderStatus);
        // Durum sayılarını güncelle
        updateOrderStatusCounts(response.orderStatus);
    } catch (error) {
        console.error('Order status data error:', error);
    }
}

// Sipariş durumları sayılarını güncelle
function updateOrderStatusCounts(data) {
    // İndeksleri bul
    const newIndex = data.statuses.indexOf('new');
    const preparingIndex = data.statuses.indexOf('preparing');
    const deliveringIndex = data.statuses.indexOf('delivering');
    
    // Sayıları güncelle
    if (newIndex !== -1) {
        document.getElementById('newStatusCount').textContent = formatNumber(data.counts[newIndex]);
    }
    
    if (preparingIndex !== -1) {
        document.getElementById('preparingStatusCount').textContent = formatNumber(data.counts[preparingIndex]);
    }
    
    if (deliveringIndex !== -1) {
        document.getElementById('deliveringStatusCount').textContent = formatNumber(data.counts[deliveringIndex]);
    }
}

// Teslimat zamanı verilerini yükle ve grafiği oluştur
async function loadDeliveryTimeData(dayFilter) {
    try {
        const response = await fetchAPI(`/dashboard/delivery-times?day=${dayFilter}`);
        if (!response.success) {
            throw new Error(response.error || 'Veri alınamadı');
        }
        
        updateDeliveryTimeChart(response.deliveryTimes);
    } catch (error) {
        console.error('Delivery time data error:', error);
    }
}

// Özet kartları güncelle
function updateSummaryCards(data) {
    if (!data || !data.success) {
        showError('Özet verileri yüklenemedi');
        return;
    }
    
    const summary = data.summary;
    
    // Toplam sipariş
    document.getElementById('totalOrdersCount').textContent = formatNumber(summary.orders.total);
    const ordersTrend = summary.orders.trend;
    updateTrendBadge('ordersTrendBadge', ordersTrend);
    
    // Toplam gelir
    document.getElementById('totalRevenueAmount').textContent = formatCurrency(summary.revenue.total);
    const revenueTrend = summary.revenue.trend;
    updateTrendBadge('revenueTrendBadge', revenueTrend);
    
    // Ortalama sipariş tutarı
    document.getElementById('averageOrderAmount').textContent = formatCurrency(summary.average_order.total);
    const avgOrderTrend = summary.average_order.trend;
    updateTrendBadge('avgOrderTrendBadge', avgOrderTrend);
    
    // Yeni müşteriler
    document.getElementById('newCustomersCount').textContent = formatNumber(summary.new_customers.total);
    const customersTrend = summary.new_customers.trend;
    updateTrendBadge('customersTrendBadge', customersTrend);
}

// Trend badge'ini güncelle (artış/azalış)
function updateTrendBadge(elementId, trendValue) {
    const badge = document.getElementById(elementId);
    
    if (trendValue > 0) {
        badge.className = 'badge bg-success me-1';
        badge.textContent = `+${trendValue}%`;
    } else if (trendValue < 0) {
        badge.className = 'badge bg-danger me-1';
        badge.textContent = `${trendValue}%`;
    } else {
        badge.className = 'badge bg-secondary me-1';
        badge.textContent = `0%`;
    }
}

// Satış grafiğini güncelle - veri işleme iyileştirmeleri
function updateSalesChart(data) {
    if (!data || !data.success) {
        console.error('Trend verileri eksik veya hatalı:', data);
        return;
    }
    
    const trendsData = data.trends;
    if (!trendsData || !trendsData.labels || !trendsData.orders || !trendsData.revenue) {
        console.error('Trend verileri eksik:', trendsData);
        return;
    }
    
    console.log('Trend data for chart:', {
        labels: trendsData.labels,
        orders: trendsData.orders,
        revenue: trendsData.revenue
    });
    
    const ctx = document.getElementById('salesPerformanceChart')?.getContext('2d');
    if (!ctx) {
        console.error('Sales chart canvas not found');
        return;
    }
    
    // Varsa mevcut grafiği temizle
    if (salesPerformanceChart) {
        salesPerformanceChart.destroy();
    }
    
    // Yeni grafik oluştur
    salesPerformanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trendsData.labels,
            datasets: [
                {
                    label: 'Siparişler',
                    data: trendsData.orders,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#3498db'
                },
                {
                    label: 'Gelir',
                    data: trendsData.revenue,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#2ecc71',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Sipariş Sayısı'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Gelir (₺)'
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

// Kategori grafiğini güncelle
function updateCategoryChart(data) {
    if (!data || !data.success) {
        showError('Kategori verileri yüklenemedi');
        return;
    }
    
    const categoriesData = data.categories;
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // Varsa mevcut grafiği temizle
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    // Rastgele renkler oluştur
    const backgroundColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        '#8AC249', '#EA526F', '#63B7AF', '#D499B9', '#2D4059', '#EA9010'
    ];
    
    // Yeni grafik oluştur
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categoriesData.labels,
            datasets: [{
                data: categoriesData.data,
                backgroundColor: backgroundColors.slice(0, categoriesData.data.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${context.label}: ${percentage}% (${formatCurrency(value)})`;
                        }
                    }
                }
            }
        }
    });
}

// Sipariş durumu grafiğini güncelle
function updateOrderStatusChart(data) {
    const ctx = document.getElementById('orderStatusChart');
    
    if (!ctx) {
        console.error('Order status chart canvas not found');
        return;
    }
    
    if (orderStatusChart) {
        orderStatusChart.destroy();
    }
    
    // Status verilerini formatla
    const statuses = data.statuses.map(status => {
        switch(status) {
            case 'new': return 'Yeni';
            case 'confirmed': return 'Onaylandı';
            case 'preparing': return 'Hazırlanıyor';
            case 'ready': return 'Hazır';
            case 'delivering': return 'Teslimat';
            default: return status;
        }
    });
    
    // Renk atamaları
    const backgroundColors = [
        '#FF6384', // new
        '#36A2EB', // confirmed
        '#FFCE56', // preparing
        '#4BC0C0', // ready
        '#9966FF', // delivering
    ];
    
    orderStatusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: statuses,
            datasets: [{
                data: data.counts,
                backgroundColor: backgroundColors.slice(0, data.counts.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} sipariş (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Teslimat zamanı grafiğini güncelle
function updateDeliveryTimeChart(data) {
    const ctx = document.getElementById('deliveryChart');
    
    if (!ctx) {
        console.error('Delivery chart canvas not found');
        return;
    }
    
    if (deliveryChart) {
        deliveryChart.destroy();
    }
    
    // Zaman dilimlerini formatla
    const times = data.times.map(time => {
        switch(time) {
            case 'morning': return 'Sabah';
            case 'afternoon': return 'Öğle';
            case 'evening': return 'Akşam';
            default: return time;
        }
    });
    
    // Gün etiketini güncelle
    const dateLabel = document.getElementById('deliveryDateLabel');
    if (dateLabel) {
        switch(data.dayFilter) {
            case 'today':
                dateLabel.textContent = 'Bugünün teslimat dağılımı';
                break;
            case 'tomorrow':
                dateLabel.textContent = 'Yarının teslimat dağılımı';
                break;
            case 'week':
                dateLabel.textContent = 'Bu haftanın teslimat dağılımı';
                break;
        }
    }
    
    deliveryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: times,
            datasets: [{
                label: 'Sipariş Sayısı',
                data: data.counts,
                backgroundColor: [
                    'rgba(255, 159, 64, 0.7)',  // Sabah - turuncu
                    'rgba(54, 162, 235, 0.7)',  // Öğle - mavi
                    'rgba(153, 102, 255, 0.7)'  // Akşam - mor
                ],
                borderColor: [
                    'rgb(255, 159, 64)',
                    'rgb(54, 162, 235)',
                    'rgb(153, 102, 255)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Hedefleri güncelle
function updateTargets(data) {
    if (!data || !data.success) {
        showError('Hedef verileri yüklenemedi');
        return;
    }
    
    const targets = data.targets;
    
    // Sipariş hedefi
    const ordersTarget = targets.orders;
    document.getElementById('currentOrdersCount').textContent = formatNumber(ordersTarget.current);
    document.getElementById('orderTarget').textContent = formatNumber(ordersTarget.target);
    const ordersPercentage = Math.min(100, Math.round((ordersTarget.current / ordersTarget.target) * 100));
    document.getElementById('ordersProgressBar').style.width = `${ordersPercentage}%`;
    
    // Gelir hedefi
    const revenueTarget = targets.revenue;
    document.getElementById('currentRevenue').textContent = formatCurrency(revenueTarget.current);
    document.getElementById('revenueTarget').textContent = formatCurrency(revenueTarget.target);
    const revenuePercentage = Math.min(100, Math.round((revenueTarget.current / revenueTarget.target) * 100));
    document.getElementById('revenueProgressBar').style.width = `${revenuePercentage}%`;
    
    // Müşteri hedefi
    const customerTarget = targets.new_customers;
    document.getElementById('currentNewCustomers').textContent = formatNumber(customerTarget.current);
    document.getElementById('customerTarget').textContent = formatNumber(customerTarget.target);
    const customerPercentage = Math.min(100, Math.round((customerTarget.current / customerTarget.target) * 100));
    document.getElementById('customersProgressBar').style.width = `${customerPercentage}%`;
}

// Zaman aralığını değiştir
function changeTimeRange(range) {
    // Eski butonun aktif halini kaldır
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Yeni butonu aktif yap
    switch (range) {
        case '30days':
            document.getElementById('timeRange30Days').classList.add('active');
            break;
        case 'thismonth':
            document.getElementById('timeRangeThisMonth').classList.add('active');
            break;
        case 'thisyear':
            document.getElementById('timeRangeThisYear').classList.add('active');
            break;
    }
    
    currentTimeRange = range;
    loadDashboardData();
}

// Satış grafiği gruplandırmasını değiştir
function changeSalesChartGrouping(grouping) {
    // Eski butonun aktif halini kaldır
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        if (btn.id.startsWith('salesChart')) {
            btn.classList.remove('active');
        }
    });
    
    // Yeni butonu aktif yap
    document.getElementById(`salesChart${grouping.charAt(0).toUpperCase() + grouping.slice(1)}`).classList.add('active');
    
    // API çağrısı ve grafik güncelleme
    fetchAPI(`/dashboard/trends?timeRange=${currentTimeRange}&grouping=${grouping}`)
        .then(data => {
            updateSalesChart(data);
        })
        .catch(error => {
            console.error('Chart grouping change error:', error);
            showError('Grafik verileri yüklenemedi');
        });
}
