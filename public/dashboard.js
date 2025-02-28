// Dashboard bileşenlerini yükle
document.addEventListener('DOMContentLoaded', () => {
    // Debug bilgisi
    console.log('Dashboard sayfası yükleniyor...');
    console.log('API URL:', API_URL);
    
    // Sidebar'ı yükle
    loadSideBar();
    
    // Dashboard verilerini yükle
    loadDashboard();

    // Yenileme butonuna olay dinleyici ekle
    document.getElementById('refreshDashboard').addEventListener('click', loadDashboard);
});

// Test verisi - API çalışmadığında kullanılacak
const testData = {
    success: true,
    summary: {
        total_orders: 125,
        new_orders: 15,
        confirmed_orders: 25,
        preparing_orders: 10,
        ready_orders: 5,
        delivering_orders: 8,
        delivered_orders: 62,
        today_orders: 12,
        tomorrow_orders: 8,
        week_orders: 45,
        customer_count: 78,
        new_customers: 12,
        total_revenue: 15750,
        monthly_revenue: 5250,
        low_stock_count: 4
    },
    todayOrders: [
        {
            id: 123,
            status: 'preparing',
            payment_status: 'partial',
            district: 'Kadıköy',
            delivery_time: 'morning',
            customer_name: 'Ali Yılmaz',
            customer_phone: '5551234567',
            recipient_name: 'Ayşe Demir',
            recipient_phone: '5557654321',
            products: 'Papatya Buketi (x1), Özel Çikolata (x2)'
        },
        {
            id: 124,
            status: 'delivering',
            payment_status: 'paid',
            district: 'Beşiktaş',
            delivery_time: 'afternoon',
            customer_name: 'Mehmet Can',
            customer_phone: '5551112233',
            recipient_name: 'Zeynep Kaya',
            recipient_phone: '5554445566',
            products: 'Gül Buketi (x1)'
        }
    ],
    upcomingOrders: [
        {
            id: 125,
            status: 'confirmed',
            delivery_time: 'morning',
            delivery_date: '2023-11-30',
            recipient_name: 'Deniz Aydın'
        },
        {
            id: 126,
            status: 'new',
            delivery_time: 'afternoon',
            delivery_date: '2023-11-30',
            recipient_name: 'Selin Yıldız'
        }
    ],
    lowStockItems: [
        {
            id: 1,
            name: 'Kırmızı Gül',
            stock_level: 3,
            unit_code: 'adet'
        },
        {
            id: 2,
            name: 'Beyaz Kurdele',
            stock_level: 5,
            unit_code: 'metre'
        }
    ],
    recentTransactions: [
        {
            id: 1,
            type: 'in',
            amount: 250,
            date: '2023-11-28',
            account_name: 'Ana Kasa',
            payment_method: 'cash',
            description: 'Sipariş ödemesi'
        },
        {
            id: 2,
            type: 'out',
            amount: 120,
            date: '2023-11-27',
            account_name: 'Banka',
            payment_method: 'bank_transfer',
            description: 'Tedarikçi ödemesi'
        }
    ]
};

async function loadDashboard() {
    showLoading();

    try {
        console.log('Dashboard verileri yükleniyor...');
        let data;
        
        try {
            // API URL'ini konsola yazdır
            console.log('API URL:', `${API_URL}/dashboard`);
            
            // API isteği yapılıyor
            const response = await fetch(`${API_URL}/dashboard`);
            console.log('API yanıt statüsü:', response.status);
            
            if (!response.ok) {
                console.warn('API hatası, test verileri kullanılacak');
                throw new Error(`API yanıt hatası: ${response.status}`);
            }
            
            data = await response.json();
            console.log('API verileri:', data);
        } 
        catch (apiError) {
            console.warn('API bağlantı hatası veya veri işleme hatası:', apiError);
            console.log('Test verileri kullanılacak');
            // API bağlantı hatası durumunda test verilerini kullan
            data = testData;
        }
        
        // Panelleri güncelle
        updateSummaryCards(data.summary);
        renderTodayOrders(data.todayOrders || []);
        renderUpcomingOrders(data.upcomingOrders || []);
        renderLowStockItems(data.lowStockItems || []);
        renderRecentTransactions(data.recentTransactions || []);
        
        // Timestamp ile son güncelleme zamanını göster
        document.getElementById('lastUpdated').textContent = 
            `Son güncelleme: ${new Date().toLocaleTimeString()}`;
        
    } catch (error) {
        console.error('Dashboard yükleme hatası:', error);
        showError('Panel yüklenemedi: ' + error.message);
        
        // Hata durumunda UI'da "veri yüklenemedi" göster
        document.querySelectorAll('.dashboard-panel').forEach(panel => {
            panel.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i> 
                    Veriler yüklenemedi: ${error.message}
                </div>
            `;
        });
    } finally {
        hideLoading();
    }
}

// Özet kartlarını güncelle
function updateSummaryCards(summary) {
    if (!summary) return;

    // Bugünün siparişleri
    document.getElementById('todayOrdersCount').textContent = summary.today_orders || 0;
    
    // Yarının siparişleri
    document.getElementById('tomorrowOrdersCount').textContent = summary.tomorrow_orders || 0;
    
    // Bu haftanın siparişleri
    document.getElementById('weekOrdersCount').textContent = summary.week_orders || 0;
    
    // Toplam müşteri sayısı
    document.getElementById('customerCount').textContent = summary.customer_count || 0;
    
    // Son 30 günün yeni müşterileri
    document.getElementById('newCustomers').textContent = summary.new_customers || 0;
    
    // Düşük stok ürünleri
    document.getElementById('lowStockCount').textContent = summary.low_stock_count || 0;
    
    // Sipariş durumları
    document.getElementById('newOrdersCount').textContent = summary.new_orders || 0;
    document.getElementById('confirmedOrdersCount').textContent = summary.confirmed_orders || 0;
    document.getElementById('preparingOrdersCount').textContent = summary.preparing_orders || 0;
    document.getElementById('readyOrdersCount').textContent = summary.ready_orders || 0;
    document.getElementById('deliveringOrdersCount').textContent = summary.delivering_orders || 0;
    document.getElementById('deliveredOrdersCount').textContent = summary.delivered_orders || 0;
    
    // Finansal metrikler
    document.getElementById('totalRevenue').textContent = formatCurrency(summary.total_revenue || 0);
    document.getElementById('monthlyRevenue').textContent = formatCurrency(summary.monthly_revenue || 0);
    
    // Sipariş durumu grafiğini güncelle
    updateOrdersChart(summary);
}

// Bugünkü siparişler tablosunu oluştur
function renderTodayOrders(orders) {
    const container = document.getElementById('todayOrdersList');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                Bugün için teslimat bulunmuyor
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="card mb-2">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">
                            #${order.id} · 
                            <span class="badge ${getStatusBadgeClass(order.status)}">
                                ${getStatusText(order.status)}
                            </span>
                            <span class="badge ${getPaymentStatusBadgeClass(order.payment_status)}">
                                ${getPaymentStatusText(order.payment_status)}
                            </span>
                        </h6>
                        <div class="small">
                            <i class="bi bi-geo-alt"></i> 
                            ${order.district} - ${formatDeliveryTime(order.delivery_time)}
                        </div>
                    </div>
                    <a href="/orders/order-detail.html?id=${order.id}" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-eye"></i> Detay
                    </a>
                </div>
                <hr class="my-2">
                <div class="row g-2">
                    <div class="col-md-4">
                        <div class="small text-muted">Müşteri</div>
                        <div>${order.customer_name || '-'}</div>
                        <div class="small">${formatPhoneNumber(order.customer_phone) || ''}</div>
                    </div>
                    <div class="col-md-4">
                        <div class="small text-muted">Alıcı</div>
                        <div>${order.recipient_name || '-'}</div>
                        <div class="small">${formatPhoneNumber(order.recipient_phone) || ''}</div>
                    </div>
                    <div class="col-md-4">
                        <div class="small text-muted">Ürünler</div>
                        <div class="small">${formatProducts(order.products)}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Yaklaşan siparişleri göster
function renderUpcomingOrders(orders) {
    const container = document.getElementById('upcomingOrdersList');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                Yaklaşan sipariş bulunmuyor
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <div>
                <div class="fw-medium">
                    #${order.id} - ${order.recipient_name || 'İsimsiz'} 
                    <span class="badge ${getStatusBadgeClass(order.status)}">
                        ${getStatusText(order.status)}
                    </span>
                </div>
                <div class="small text-muted">
                    ${formatDate(order.delivery_date)} - ${formatDeliveryTime(order.delivery_time)}
                </div>
            </div>
            <a href="/orders/order-detail.html?id=${order.id}" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-eye"></i> Detay
            </a>
        </div>
    `).join('');
}

// Düşük stok ürünlerini göster
function renderLowStockItems(items) {
    const container = document.getElementById('lowStockItemsList');
    
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="alert alert-success">
                <i class="bi bi-check-circle me-2"></i>
                Stok seviyeleri normal
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <div>
                <div class="fw-medium">
                    ${item.name} 
                    ${item.stock_level <= 5 ? 
                        '<span class="badge bg-danger">Kritik</span>' : 
                        '<span class="badge bg-warning">Düşük</span>'
                    }
                </div>
                <div class="small text-muted">
                    Stok: ${item.stock_level} ${item.unit_code || 'adet'}
                </div>
            </div>
            <a href="/stock/stock.html" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-plus"></i> Detay
            </a>
        </div>
    `).join('');
}

// Son finansal işlemleri göster
function renderRecentTransactions(transactions) {
    const container = document.getElementById('recentTransactionsList');
    
    if (!transactions || transactions.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                Finansal işlem bulunmuyor
            </div>
        `;
        return;
    }
    
    container.innerHTML = transactions.map(tx => `
        <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <div>
                <div class="fw-medium">
                    <span class="badge ${tx.type === 'in' ? 'bg-success' : 'bg-danger'}">
                        ${tx.type === 'in' ? 'Gelen' : 'Giden'}
                    </span>
                    ${formatCurrency(tx.amount)}
                </div>
                <div class="small text-muted">
                    ${tx.description || '-'} · ${formatDate(tx.date)}
                </div>
            </div>
            <div class="text-end">
                <div>${tx.account_name || '-'}</div>
                <div class="small text-muted">${tx.payment_method || '-'}</div>
            </div>
        </div>
    `).join('');
}

// Sipariş durum grafiğini güncelle
function updateOrdersChart(summary) {
    // Canvas elementi varsa
    const canvas = document.getElementById('ordersStatusChart');
    if (!canvas) return;

    // Chart.js yüklüysa
    if (window.Chart) {
        // Önceki grafiği temizle
        if (window.ordersChart) {
            window.ordersChart.destroy();
        }

        const data = {
            labels: ['Yeni', 'Onaylandı', 'Hazırlanıyor', 'Hazır', 'Taşımada', 'Teslim Edildi'],
            datasets: [{
                data: [
                    summary.new_orders || 0,
                    summary.confirmed_orders || 0,
                    summary.preparing_orders || 0,
                    summary.ready_orders || 0,
                    summary.delivering_orders || 0,
                    summary.delivered_orders || 0
                ],
                backgroundColor: [
                    '#20c997', // Yeni
                    '#0dcaf0', // Onaylandı
                    '#ffc107', // Hazırlanıyor
                    '#0d6efd', // Hazır
                    '#fd7e14', // Taşımada
                    '#198754'  // Teslim Edildi
                ]
            }]
        };
        
        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                },
                cutout: '70%'
            }
        };
        
        window.ordersChart = new Chart(canvas, config);
    }
}

// Helper fonksiyonlar
function formatProducts(productsString) {
    if (!productsString) return '-';
    return productsString.split(',').map(p => `<div>${p}</div>`).join('');
}

function formatDeliveryTime(time) {
    const times = {
        'morning': 'Sabah (09:00-12:00)',
        'afternoon': 'Öğleden Sonra (12:00-17:00)',
        'evening': 'Akşam (17:00-21:00)'
    };
    return times[time] || time;
}