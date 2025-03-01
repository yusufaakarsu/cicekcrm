// Dashboard için gerekli değişkenler
let salesChart = null;
let categoryChart = null;
let currentTimeRange = '30days'; // Varsayılan zaman aralığı

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    // Sidebar'ı yükle
    await loadSideBar();
    
    // Dashboard verilerini yükle - hatalar sessizce yakalanacak
    try {
        await loadDashboardData();
    } catch (error) {
        console.error('Dashboard data error:', error);
        showError('Bazı dashboard verileri yüklenemedi - Sayfayı yenileyin veya desteğe başvurun');
    }
    
    // Event listeners
    setupEventListeners();
    
    // Zaman aralığı butonunu aktif yap
    document.getElementById('timeRange30Days').classList.add('active');
});

// Event listener'ları ayarla
function setupEventListeners() {
    // Zaman aralığı butonları
    document.getElementById('timeRange30Days').addEventListener('click', () => changeTimeRange('30days'));
    document.getElementById('timeRangeThisMonth').addEventListener('click', () => changeTimeRange('thismonth'));
    document.getElementById('timeRangeThisYear').addEventListener('click', () => changeTimeRange('thisyear'));
    
    // Grafik gruplandırma butonları
    document.getElementById('salesChartDaily').addEventListener('click', () => changeSalesChartGrouping('daily'));
    document.getElementById('salesChartWeekly').addEventListener('click', () => changeSalesChartGrouping('weekly'));
    document.getElementById('salesChartMonthly').addEventListener('click', () => changeSalesChartGrouping('monthly'));
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
        
        // Trend verileri
        try {
            const trendData = await fetchAPI(`/dashboard/trends?timeRange=${currentTimeRange}`);
            if (trendData.success) {
                updateSalesChart(trendData);
            }
        } catch (error) {
            console.error('Trend data error:', error);
            // Trend verisi hatası - sessiz geç
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
        
        // Son siparişler
        try {
            const recentOrders = await fetchAPI(`/dashboard/recent-orders`);
            if (recentOrders.success) {
                updateRecentOrders(recentOrders);
            }
        } catch (error) {
            console.error('Recent orders error:', error);
            // Son siparişler hatası - sessiz geç
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

// Satış grafiğini güncelle
function updateSalesChart(data) {
    if (!data || !data.success) {
        showError('Trend verileri yüklenemedi');
        return;
    }
    
    const trendsData = data.trends;
    const ctx = document.getElementById('salesTrendChart').getContext('2d');
    
    // Varsa mevcut grafiği temizle
    if (salesChart) {
        salesChart.destroy();
    }
    
    // Yeni grafik oluştur
    salesChart = new Chart(ctx, {
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

// Son siparişleri güncelle
function updateRecentOrders(data) {
    if (!data || !data.success) {
        showError('Son siparişler yüklenemedi');
        return;
    }
    
    const recentOrders = data.orders || [];
    const tbody = document.getElementById('recentOrdersTable');
    
    if (recentOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3">Sipariş bulunamadı</td></tr>';
        return;
    }
    
    tbody.innerHTML = recentOrders.map(order => `
        <tr onclick="window.location='/orders/detail.html?id=${order.id}';" style="cursor:pointer">
            <td>${formatDate(order.created_at)}</td>
            <td>${order.customer_name}</td>
            <td>${formatCurrency(order.total_amount)}</td>
            <td>${getStatusBadge(order.status)}</td>
        </tr>
    `).join('');
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
