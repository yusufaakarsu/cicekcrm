// Dashboard bileşenlerini yükle
document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    loadDashboard();

    // Diğer olaylar
    document.getElementById('refreshDashboard').addEventListener('click', loadDashboard);
});

// API'ye bağlantı kurulamadığında geliştirme amaçlı test verisi
const testData = {
    success: true,
    summary: {
        total_orders: 125,: API isteği yapılıyor...');
        new_orders: 15,
        confirmed_orders: 25,console.log('API URL:', `${API_URL}/dashboard`);
        preparing_orders: 10,
        ready_orders: 5,
        delivering_orders: 8,
        delivered_orders: 62,
        today_orders: 12,onsole.log('Dashboard API yanıt durumu:', response.status);
        tomorrow_orders: 8,
        week_orders: 45,
        customer_count: 78,    const errorText = await response.text();
        new_customers: 12,ashboard API Error:', response.status, errorText);
        total_revenue: 15750,t}`);
        monthly_revenue: 5250,
        low_stock_count: 4
    },const data = await response.json();
    todayOrders: [d API yanıtı:', data);
        {
            id: 123,
            status: 'preparing',error:', data.error);
            payment_status: 'partial',eturned unsuccessful response');
            district: 'Kadıköy',
            delivery_time: 'morning',
            customer_name: 'Test Müşteri',
            customer_phone: '5551234567',
            recipient_name: 'Test Alıcı',
            recipient_phone: '5557654321',renderUpcomingOrders(data.upcomingOrders || []);
            products: 'Papatya Buketi (x1), Özel Çikolata (x2)'kItems(data.lowStockItems || []);
        }|| []);
    ],
    // diğer veriler...// Timestamp ile son güncelleme zamanını göster
        document.getElementById('lastUpdated').textContent = 
            `Son güncelleme: ${new Date().toLocaleTimeString()}`;
        {
    } catch (error) {
        console.error('Dashboard loading error:', error);
        showError('Panel yüklenemedi: ' + error.message);
        
        // Hata durumunda UI'da "veri yüklenemedi" göster
        document.querySelectorAll('.dashboard-panel').forEach(panel => {API isteği yap
            panel.innerHTML = `
                <div class="alert alert-danger">onse = await fetch(`${API_URL}/dashboard`);
                    <i class="bi bi-exclamation-triangle me-2"></i>        if (!response.ok) throw new Error(`API Error: ${response.status}`);
                    Veriler yüklenemedi: ${error.message}           data = await response.json();
                </div>        } catch (apiError) {
            `;PI bağlantı hatası, test verisi kullanılıyor:', apiError);
            // API bağlantısı yoksa test verilerini kullan
            data = testData;
        hideLoading();    }
    }
        if (!data.success && !data.summary) {
            throw new Error(data.error || 'API returned unsuccessful response');
        }e
        
        // Panelleri güncelleif (!summary) return;
        updateSummaryCards(data.summary);
        renderTodayOrders(data.todayOrders || []);
        renderUpcomingOrders(data.upcomingOrders || []);document.getElementById('todayOrdersCount').textContent = summary.today_orders || 0;
        renderLowStockItems(data.lowStockItems || []);
        renderRecentTransactions(data.recentTransactions || []);
        document.getElementById('tomorrowOrdersCount').textContent = summary.tomorrow_orders || 0;
        // Timestamp ile son güncelleme zamanını göster
        document.getElementById('lastUpdated').textContent = 
            `Son güncelleme: ${new Date().toLocaleTimeString()}`;document.getElementById('weekOrdersCount').textContent = summary.week_orders || 0;
        
    } catch (error) {
        console.error('Dashboard loading error:', error);document.getElementById('customerCount').textContent = summary.customer_count || 0;
        showError('Panel yüklenemedi: ' + error.message);
        
        // Hata durumunda UI'da "veri yüklenemedi" göster
        document.querySelectorAll('.dashboard-panel').forEach(panel => {
            panel.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i> 
                    Veriler yüklenemedi// Sipariş durumları
                </div>Id('newOrdersCount').textContent = summary.new_orders || 0;
            `;
        });
    } finally {document.getElementById('readyOrdersCount').textContent = summary.ready_orders || 0;
        hideLoading();rdersCount').textContent = summary.delivering_orders || 0;
    }liveredOrdersCount').textContent = summary.delivered_orders || 0;
}   
    // Finansal metrikler
// Özet kartlarını güncelleue').textContent = formatCurrency(summary.total_revenue || 0);
function updateSummaryCards(summary) {Revenue').textContent = formatCurrency(summary.monthly_revenue || 0);
    if (!summary) return;
    // Sipariş durumu grafiğini güncelle
    // Bugünün siparişleri
    document.getElementById('todayOrdersCount').textContent = summary.today_orders || 0;
    
    // Yarının siparişleri
    document.getElementById('tomorrowOrdersCount').textContent = summary.tomorrow_orders || 0;
    r = document.getElementById('todayOrdersList');
    // Bu haftanın siparişleri
    document.getElementById('weekOrdersCount').textContent = summary.week_orders || 0; || orders.length === 0) {
       container.innerHTML = `
    // Toplam müşteri sayısı        <div class="alert alert-info">
    document.getElementById('customerCount').textContent = summary.customer_count || 0;2"></i>
    imat bulunmuyor
    // Son 30 günün yeni müşterileri
    document.getElementById('newCustomers').textContent = summary.new_customers || 0;
    
    // Düşük stok ürünleri
    document.getElementById('lowStockCount').textContent = summary.low_stock_count || 0;
    
    // Sipariş durumları
    document.getElementById('newOrdersCount').textContent = summary.new_orders || 0;-3">
    document.getElementById('confirmedOrdersCount').textContent = summary.confirmed_orders || 0;
    document.getElementById('preparingOrdersCount').textContent = summary.preparing_orders || 0;
    document.getElementById('readyOrdersCount').textContent = summary.ready_orders || 0;mb-1">
    document.getElementById('deliveringOrdersCount').textContent = summary.delivering_orders || 0;${order.id} · 
    document.getElementById('deliveredOrdersCount').textContent = summary.delivered_orders || 0;dge ${getStatusBadgeClass(order.status)}">
    us)}
    // Finansal metrikler
    document.getElementById('totalRevenue').textContent = formatCurrency(summary.total_revenue || 0);pan class="badge ${getPaymentStatusBadgeClass(order.payment_status)}">
    document.getElementById('monthlyRevenue').textContent = formatCurrency(summary.monthly_revenue || 0);      ${getPaymentStatusText(order.payment_status)}
    
    // Sipariş durumu grafiğini güncelle
    updateOrdersChart(summary);<div class="small">
}      <i class="bi bi-geo-alt"></i> 
            ${order.district} - ${formatDeliveryTime(order.delivery_time)}
// Bugünkü siparişler tablosunu oluştur
function renderTodayOrders(orders) {    </div>
    const container = document.getElementById('todayOrdersList');order-detail.html?id=${order.id}" class="btn btn-sm btn-outline-primary">
    e"></i> Detay
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>"my-2">
                Bugün için teslimat bulunmuyor
            </div>
        `;
        return;
    }iv>${order.customer_name || '-'}</div>
    >${formatPhoneNumber(order.customer_phone) || ''}</div>
    container.innerHTML = orders.map(order => `
        <div class="card mb-2">
            <div class="card-body p-3">iv class="small text-muted">Alıcı</div>
                <div class="d-flex justify-content-between align-items-center">  <div>${order.recipient_name || '-'}</div>
                    <div>      <div class="small">${formatPhoneNumber(order.recipient_phone) || ''}</div>
                        <h6 class="mb-1">      </div>
                            #${order.id} ·     <div class="col-md-4">
                            <span class="badge ${getStatusBadgeClass(order.status)}">                       <div class="small text-muted">Ürünler</div>
                                ${getStatusText(order.status)}                        <div class="small">${formatProducts(order.products)}</div>
                            </span>
                            <span class="badge ${getPaymentStatusBadgeClass(order.payment_status)}">
                                ${getPaymentStatusText(order.payment_status)}
                            </span>    </div>
                        </h6>
                        <div class="small">
                            <i class="bi bi-geo-alt"></i> 
                            ${order.district} - ${formatDeliveryTime(order.delivery_time)}
                        </div>
                    </div>r = document.getElementById('upcomingOrdersList');
                    <a href="/orders/order-detail.html?id=${order.id}" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-eye"></i> Detay || orders.length === 0) {
                    </a>   container.innerHTML = `
                </div>        <div class="alert alert-info">
                2"></i>
                <hr class="my-2">
                >
                <div class="row g-2">
                    <div class="col-md-4">
                        <div class="small text-muted">Müşteri</div>
                        <div>${order.customer_name || '-'}</div>
                        <div class="small">${formatPhoneNumber(order.customer_phone) || ''}</div>rders.map(order => `
                    </div>flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                    <div class="col-md-4">
                        <div class="small text-muted">Alıcı</div>
                        <div>${order.recipient_name || '-'}</div>{order.id} - ${order.recipient_name || 'İsimsiz'} 
                        <div class="small">${formatPhoneNumber(order.recipient_phone) || ''}</div>  <span class="badge ${getStatusBadgeClass(order.status)}">
                    </div>
                    <div class="col-md-4">
                        <div class="small text-muted">Ürünler</div></div>
                        <div class="small">${formatProducts(order.products)}</div>  <div class="small text-muted">
                    </div>    ${formatDate(order.delivery_date)} - ${formatDeliveryTime(order.delivery_time)}
                </div>               </div>
            </div>            </div>
        </div>der-detail.html?id=${order.id}" class="btn btn-sm btn-outline-primary">
    `).join('');</i>
}
    </div>
// Yaklaşan siparişleri göster
function renderUpcomingOrders(orders) {
    const container = document.getElementById('upcomingOrdersList');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `r = document.getElementById('lowStockItemsList');
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>|| items.length === 0) {
                Yaklaşan sipariş bulunmuyor   container.innerHTML = `
            </div>        <div class="alert alert-success">
        `;me-2"></i>
        return;
    }>
    
    container.innerHTML = orders.map(order => `
        <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <div>
                <div class="fw-medium">
                    #${order.id} - ${order.recipient_name || 'İsimsiz'} -flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                    <span class="badge ${getStatusBadgeClass(order.status)}">
                        ${getStatusText(order.status)}
                    </span>
                </div>item.stock_level <= 5 ? 
                <div class="small text-muted">      '<span class="badge bg-danger">Kritik</span>' : 
                    ${formatDate(order.delivery_date)} - ${formatDeliveryTime(order.delivery_time)}
                </div>
            </div></div>
            <a href="/orders/order-detail.html?id=${order.id}" class="btn btn-sm btn-outline-primary">  <div class="small text-muted">
                <i class="bi bi-eye"></i>    Stok: ${item.stock_level} ${item.unit_code || 'adet'}
            </a>               </div>
        </div>            </div>
    `).join('');k.html" class="btn btn-sm btn-outline-primary">
}

// Düşük stok ürünlerini göster    </div>
function renderLowStockItems(items) {
    const container = document.getElementById('lowStockItemsList');
    
    if (!items || items.length === 0) {
        container.innerHTML = `tions) {
            <div class="alert alert-success">r = document.getElementById('recentTransactionsList');
                <i class="bi bi-check-circle me-2"></i>
                Stok seviyeleri normalctions || transactions.length === 0) {
            </div>   container.innerHTML = `
        `;        <div class="alert alert-info">
        return;</i>
    }
    >
    container.innerHTML = items.map(item => `
        <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <div>
                <div class="fw-medium">
                    ${item.name} `
                    ${item.stock_level <= 5 ? flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                        '<span class="badge bg-danger">Kritik</span>' : 
                        '<span class="badge bg-warning">Düşük</span>'
                    }pan class="badge ${tx.type === 'in' ? 'bg-success' : 'bg-danger'}">
                </div>      ${tx.type === 'in' ? 'Gelen' : 'Giden'}
                <div class="small text-muted">
                    Stok: ${item.stock_level} ${item.unit_code || 'adet'}
                </div>
            </div>iv class="small text-muted">
            <a href="/stock/stock.html" class="btn btn-sm btn-outline-primary">      ${tx.description || '-'} · ${formatDate(tx.date)}
                <i class="bi bi-plus"></i></div>
            </a>           </div>
        </div>            <div class="text-end">
    `).join('');ame || '-'}</div>
}t-muted">${tx.payment_method || '-'}</div>

// Son finansal işlemleri göster
function renderRecentTransactions(transactions) {
    const container = document.getElementById('recentTransactionsList');
    
    if (!transactions || transactions.length === 0) {ini güncelle
        container.innerHTML = `y) {
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>d('ordersStatusChart');
                Finansal işlem bulunmuyorcanvas) return;
            </div>
        `;se
        return;
    }i temizle
    rsChart) {
    container.innerHTML = transactions.map(tx => `
        <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <div>
                <div class="fw-medium">
                    <span class="badge ${tx.type === 'in' ? 'bg-success' : 'bg-danger'}">ıyor', 'Hazır', 'Taşımada', 'Teslim Edildi'],
                        ${tx.type === 'in' ? 'Gelen' : 'Giden'}
                    </span>ta: [
                    ${formatCurrency(tx.amount)}ders || 0,
                </div>orders || 0,
                <div class="small text-muted">s || 0,
                    ${tx.description || '-'} · ${formatDate(tx.date)}
                </div>orders || 0,
            </div>rs || 0
            <div class="text-end">
                <div>${tx.account_name || '-'}</div>ackgroundColor: [
                <div class="small text-muted">${tx.payment_method || '-'}</div>      '#20c997', // Yeni
            </div>          '#0dcaf0', // Onaylandı
        </div>            '#ffc107', // Hazırlanıyor
    `).join('');6efd', // Hazır
}, // Taşımada
98754'  // Teslim Edildi
// Sipariş durum grafiğini güncelle
function updateOrdersChart(summary) {
    // Canvas elementi varsa
    const canvas = document.getElementById('ordersStatusChart');
    if (!canvas) return;
    ughnut',
    // Chart.js yüklüysedata,
    if (window.Chart) {
        // Önceki grafiği temizle   responsive: true,
        if (window.ordersChart) {      plugins: {
            window.ordersChart.destroy();            legend: {
        }
                       }
        const data = {               },
            labels: ['Yeni', 'Onaylandı', 'Hazırlanıyor', 'Hazır', 'Taşımada', 'Teslim Edildi'],                cutout: '70%'
            datasets: [{
                data: [
                    summary.new_orders || 0,
                    summary.confirmed_orders || 0,
                    summary.preparing_orders || 0,   }
                    summary.ready_orders || 0,}
                    summary.delivering_orders || 0,
                    summary.delivered_orders || 0lar
                ],
                backgroundColor: [
                    '#20c997', // Yeni(p => `<div>${p}</div>`).join('');
                    '#0dcaf0', // Onaylandı
                    '#ffc107', // Hazırlanıyor
                    '#0d6efd', // Hazırunction formatDeliveryTime(time) {
                    '#fd7e14', // Taşımada    const times = {
                    '#198754'  // Teslim Edildi)',
                ] 'Öğle (12:00-17:00)',
            }] (17:00-21:00)'
        };
        
        const config = {
            type: 'doughnut',
            data: data,s) {
            options: {
                responsive: true,  'new': 'bg-info',
                plugins: {
                    legend: {       'preparing': 'bg-warning',
                        position: 'bottom'        'ready': 'bg-success',
                    }',
                },: 'bg-success',
                cutout: '70%'bg-dark'
            }
        };ondary';
        
        window.ordersChart = new Chart(canvas, config);
    }
}
  'new': 'Yeni',
// Helper fonksiyonlar
function formatProducts(productsString) {       'preparing': 'Hazırlanıyor',
    if (!productsString) return '-';        'ready': 'Hazır',
    return productsString.split(',').map(p => `<div>${p}</div>`).join('');
} 'Teslim Edildi',

function formatDeliveryTime(time) {
    const times = {tatus;
        'morning': 'Sabah (09:00-12:00)',
        'afternoon': 'Öğle (12:00-17:00)',
        'evening': 'Akşam (17:00-21:00)'{
    };   const badges = {
    return times[time] || time;        'pending': 'bg-warning text-dark',
}
-success',
function getStatusBadgeClass(status) {
    const badges = {
        'new': 'bg-info', || 'bg-secondary';
        'confirmed': 'bg-primary',
        'preparing': 'bg-warning',
        'ready': 'bg-success',s) {
        'delivering': 'bg-danger',   const texts = {






































}    return texts[status] || status;    };        'cancelled': 'İptal'        'paid': 'Ödendi',        'partial': 'Kısmi',        'pending': 'Bekliyor',    const texts = {function getPaymentStatusText(status) {}    return badges[status] || 'bg-secondary';    };        'cancelled': 'bg-dark'        'paid': 'bg-success',        'partial': 'bg-info',        'pending': 'bg-warning text-dark',    const badges = {function getPaymentStatusBadgeClass(status) {}    return texts[status] || status;    };        'cancelled': 'İptal'        'delivered': 'Teslim Edildi',        'delivering': 'Taşınıyor',        'ready': 'Hazır',        'preparing': 'Hazırlanıyor',        'confirmed': 'Onaylandı',        'new': 'Yeni',    const texts = {function getStatusText(status) {}    return badges[status] || 'bg-secondary';    };        'cancelled': 'bg-dark'        'delivered': 'bg-success',        'pending': 'Bekliyor',
        'partial': 'Kısmi',
        'paid': 'Ödendi',
        'cancelled': 'İptal'
    };
    return texts[status] || status;
}