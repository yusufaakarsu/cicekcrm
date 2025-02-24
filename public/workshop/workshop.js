document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    loadOrders();
    setupEventListeners();
    startAutoRefresh();
});

function setupEventListeners() {
    // Filtre değişikliklerini dinle
    document.getElementById('dateFilter').addEventListener('change', loadOrders);
    document.getElementById('timeSlotFilter').addEventListener('change', loadOrders);
    document.getElementById('statusFilter').addEventListener('change', loadOrders);
    
    // Yenile butonu
    document.getElementById('refreshButton').addEventListener('click', loadOrders);
}

async function loadOrders() {
    try {
        // Filtre değerlerini al ve null kontrolü yap
        const dateFilter = document.getElementById('dateFilter')?.value || 'today';
        const timeSlot = document.getElementById('timeSlotFilter')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';

        // Debug için
        console.log('Loading with filters:', { dateFilter, timeSlot, status });

        // URL parametrelerini oluştur
        const params = new URLSearchParams({
            date_filter: dateFilter,
            time_slot: timeSlot,
            status: status
        });

        console.log('Loading orders with params:', params.toString());

        const orders = await fetchAPI(`/orders/workshop?${params}`);
        
        if (!orders.success) {
            throw new Error(orders.error || 'Siparişler yüklenemedi');
        }

        // Debug log
        console.log('Received orders:', orders);

        // Siparişleri durumlarına göre grupla
        const grouped = {
            new: orders.orders.filter(o => o.status === 'new') || [],
            preparing: orders.orders.filter(o => o.status === 'preparing') || [],
            ready: orders.orders.filter(o => o.status === 'ready') || []
        };

        // Her kolonu güncelle
        updateOrdersList('new', grouped.new);
        updateOrdersList('preparing', grouped.preparing);
        updateOrdersList('ready', grouped.ready);

        // Sayaçları güncelle
        document.getElementById('newOrdersCount').textContent = grouped.new.length;
        document.getElementById('preparingOrdersCount').textContent = grouped.preparing.length;
        document.getElementById('readyOrdersCount').textContent = grouped.ready.length;

    } catch (error) {
        console.error('Orders loading error:', error);
        showError('Siparişler yüklenemedi: ' + error.message);
    }
}

function updateOrdersList(status, orders) {
    const container = document.getElementById(`${status}OrdersList`);
    
    if (!orders.length) {
        container.innerHTML = `
            <div class="text-center text-muted p-3">
                Sipariş bulunmuyor
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="list-group-item list-group-item-action" 
             onclick="showOrderDetail(${order.id})">
            <div class="d-flex justify-content-between align-items-center">
                <h6 class="mb-1">
                    #${order.id} - ${order.recipient_name}
                </h6>
                <small class="text-${getTimeSlotColor(order.delivery_time)}">
                    ${formatTimeSlot(order.delivery_time)}
                </small>
            </div>
            <p class="mb-1 small">
                ${order.items_summary}
            </p>
            <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">
                    ${formatDate(order.delivery_date)}
                </small>
                <div class="btn-group btn-group-sm">
                    ${getActionButtons(status, order.id)}
                </div>
            </div>
        </div>
    `).join('');
}

function getTimeSlotColor(slot) {
    return {
        'morning': 'warning',
        'afternoon': 'info',
        'evening': 'success'
    }[slot] || 'primary';
}

function getActionButtons(status, orderId) {
    switch (status) {
        case 'new':
            return `
                <button class="btn btn-sm btn-warning" 
                        onclick="event.stopPropagation(); updateOrderStatus(${orderId}, 'preparing')">
                    <i class="bi bi-play-fill"></i> Hazırlamaya Başla
                </button>
            `;
        case 'preparing':
            return `
                <button class="btn btn-sm btn-success"
                        onclick="event.stopPropagation(); updateOrderStatus(${orderId}, 'ready')">
                    <i class="bi bi-check-lg"></i> Hazır
                </button>
            `;
        case 'ready':
            return `
                <button class="btn btn-sm btn-outline-primary"
                        onclick="event.stopPropagation(); printOrderDetail(${orderId})">
                    <i class="bi bi-printer"></i> Yazdır
                </button>
            `;
        default:
            return '';
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        event.stopPropagation(); // Modal'ın açılmasını engelle

        const result = await fetchAPI(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });

        if (result.success) {
            showSuccess('Durum güncellendi');
            loadOrders(); // Listeyi yenile
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Status update error:', error);
        showError('Durum güncellenemedi');
    }
}

// Sipariş seçimini göster
async function showOrderDetail(orderId) {
    try {
        // noOrderSelected'ı gizle
        document.getElementById('noOrderSelected').classList.add('d-none');
        
        // orderDetail'i göster ve loading state'e geç
        const detailContainer = document.getElementById('orderDetail');
        detailContainer.classList.remove('d-none');
        detailContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">Sipariş bilgileri yükleniyor...</p>
            </div>
        `;

        // API çağrıları
        const [orderResponse, recipesResponse] = await Promise.all([
            fetchAPI(`/orders/${orderId}/details`),
            fetchAPI(`/orders/${orderId}/recipes`)
        ]);

        if (!orderResponse.success) {
            throw new Error(orderResponse.error || 'Sipariş detayları yüklenemedi');
        }

        // ...API response validations...

        const order = orderResponse.order;
        const recipes = recipesResponse.recipes || [];

        // Detay içeriğini güncelle
        detailContainer.innerHTML = `
            <div class="d-flex flex-column h-100">
                <!-- Üst Bilgi -->
                <div class="border-bottom pb-3 mb-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h3 class="mb-1">Sipariş #${order.id}</h3>
                            <p class="mb-0 text-muted">
                                ${formatDate(order.delivery_date)} - 
                                ${formatTimeSlot(order.delivery_time)}
                            </p>
                        </div>
                        <span class="badge bg-${getStatusColor(order.status)} fs-6">
                            ${getStatusText(order.status)}
                        </span>
                    </div>
                </div>

                <!-- Scrollable Content -->
                <div class="flex-grow-1 overflow-auto">
                    <!-- Teslimat & Alıcı -->
                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Teslimat Bilgileri</h5>
                                    <p class="card-text">
                                        <strong>Adres:</strong><br>
                                        ${order.delivery_address}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Alıcı Bilgileri</h5>
                                    <p class="card-text">
                                        <strong>${order.recipient_name}</strong><br>
                                        ${formatPhoneNumber(order.recipient_phone)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Ürünler -->
                    <div class="card mb-4">
                        <div class="card-body">
                            <h5 class="card-title">Ürünler</h5>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Ürün</th>
                                            <th class="text-end">Adet</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${order.items.map(item => `
                                            <tr>
                                                <td>${item.product_name}</td>
                                                <td class="text-end">${item.quantity}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Reçete -->
                    <div class="card mb-4">
                        <div class="card-body">
                            <h5 class="card-title">Malzeme Kullanımı</h5>
                            ${recipes.length > 0 ? `
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Malzeme</th>
                                                <th>Önerilen</th>
                                                <th>Kullanılan</th>
                                                <th>Birim</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${recipes.map(item => `
                                                <tr>
                                                    <td>${item.material_name}</td>
                                                    <td>${item.suggested_quantity}</td>
                                                    <td>
                                                        <input type="number" 
                                                               class="form-control form-control-sm used-quantity"
                                                               style="width: 80px"
                                                               data-material-id="${item.material_id}"
                                                               value="${item.suggested_quantity}"
                                                               ${order.status !== 'preparing' ? 'disabled' : ''}>
                                                    </td>
                                                    <td>${item.unit}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : `
                                <div class="alert alert-info">
                                    Bu ürün için tanımlanmış reçete bulunmuyor
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Notlar -->
                    ${order.card_message ? `
                        <div class="card mb-4">
                            <div class="card-body">
                                <h5 class="card-title">Kart Mesajı</h5>
                                <p class="card-text">${order.card_message}</p>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Alt Aksiyon Alanı -->
                <div class="border-top pt-3 mt-3">
                    ${getDetailActionButtons(order)}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Order detail error:', error);
        showError('Sipariş detayları yüklenemedi: ' + error.message);
        
        // Hata durumunda detay alanını gizle
        document.getElementById('orderDetail').classList.add('d-none');
        document.getElementById('noOrderSelected').classList.remove('d-none');
    }
}

// Durum butonları
function getDetailActionButtons(order) {
    switch (order.status) {
        case 'new':
            return `
                <button type="button" class="btn btn-primary btn-lg w-100" 
                        onclick="startPreparation(${order.id})">
                    <i class="bi bi-play-fill"></i> Hazırlamaya Başla
                </button>
            `;
        case 'preparing':
            return `
                <div class="row g-2">
                    <div class="col">
                        <input type="number" class="form-control" 
                               id="preparationTime" placeholder="Süre (dk)">
                    </div>
                    <div class="col-auto">
                        <button type="button" class="btn btn-success btn-lg"
                                onclick="completePreparation(${order.id})">
                            <i class="bi bi-check-lg"></i> Hazırlamayı Tamamla
                        </button>
                    </div>
                </div>
            `;
        case 'ready':
            return `
                <button type="button" class="btn btn-outline-primary btn-lg w-100"
                        onclick="printOrderDetail(${order.id})">
                    <i class="bi bi-printer"></i> Yazdır
                </button>
            `;
        default:
            return '';
    }
}

// Hazırlamaya başla
async function startPreparation(orderId) {
    try {
        const result = await fetchAPI(`/orders/${orderId}/preparation/start`, {
            method: 'POST'
        });

        if (result.success) {
            showSuccess('Hazırlama başlatıldı');
            loadOrders();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showError('Hazırlama başlatılamadı: ' + error.message);
    }
}

// Hazırlamayı tamamla
async function completePreparation(orderId) {
    try {
        // Kullanılan malzemeleri topla
        const materials = [];
        document.querySelectorAll('.used-quantity').forEach(input => {
            materials.push({
                material_id: input.dataset.materialId,
                quantity: Number(input.value)
            });
        });

        // Hazırlama detaylarını gönder
        const result = await fetchAPI(`/orders/${orderId}/preparation/complete`, {
            method: 'POST',
            body: JSON.stringify({
                materials: materials,
                preparation_time: Number(document.getElementById('preparationTime').value),
                labor_cost: Number(document.getElementById('laborCost').value)
            })
        });

        if (result.success) {
            // Modal'ı kapat
            bootstrap.Modal.getInstance(document.getElementById('orderDetailModal')).hide();
            showSuccess('Hazırlama tamamlandı');
            loadOrders();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showError('Hazırlama tamamlanamadı: ' + error.message);
    }
}

function printOrderDetail(orderId) {
    // Print functionality will be implemented
    event.stopPropagation();
    console.log('Print order:', orderId);
}

// Zaman dilimlerini formatlayan fonksiyon
function formatTimeSlot(slot) {
    const slots = {
        'morning': 'Sabah (09:00-12:00)',
        'afternoon': 'Öğlen (12:00-17:00)',
        'evening': 'Akşam (17:00-21:00)'
    };
    return slots[slot] || slot;
}

// Tarihi formatlayan fonksiyon
function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('tr-TR');
}

// Sipariş durumuna göre renk
function getStatusColor(status) {
    return {
        'new': 'warning',
        'preparing': 'info',
        'ready': 'success',
        'delivering': 'primary',
        'delivered': 'success',
        'cancelled': 'danger'
    }[status] || 'secondary';
}

// Sipariş durumuna göre metin
function getStatusText(status) {
    return {
        'new': 'Yeni',
        'preparing': 'Hazırlanıyor',
        'ready': 'Hazır',
        'delivering': 'Teslimatta',
        'delivered': 'Teslim Edildi',
        'cancelled': 'İptal'
    }[status] || 'Bilinmiyor';
}

// Otomatik yenileme süresini artır (30sn -> 60sn)
const REFRESH_INTERVAL = 60000;
let refreshTimer;

// Yenileme fonksiyonu
function startAutoRefresh() {
    // Varsa önceki timer'ı temizle
    if (refreshTimer) clearInterval(refreshTimer);
    
    // Yeni timer başlat
    refreshTimer = setInterval(loadOrders, REFRESH_INTERVAL);
}

// Sayfa kapanırken timer'ı temizle
window.addEventListener('beforeunload', () => {
    if (refreshTimer) clearInterval(refreshTimer);
});

// Durum filtreleme fonksiyonu
function filterByStatus(status) {
    document.getElementById('statusFilter').value = status;
    loadOrders();
}
