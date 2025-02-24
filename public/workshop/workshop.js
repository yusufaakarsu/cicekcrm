// Global state
let currentFilter = 'new';

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    filterByStatus('new'); // Başlangıçta yeni siparişleri göster
    setupEventListeners();
    startAutoRefresh();

    // Status kartlarına click eventi ekle
    document.querySelectorAll('.status-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const status = e.currentTarget.dataset.status;
            filterByStatus(status);
        });
    });
});

function setupEventListeners() {
    document.getElementById('dateFilter').addEventListener('change', () => loadOrders(currentFilter));
    document.getElementById('timeSlotFilter').addEventListener('change', () => loadOrders(currentFilter));
    document.getElementById('refreshButton').addEventListener('click', () => loadOrders(currentFilter));
}

async function loadOrders(filterStatus = 'new') {
    try {
        const dateFilter = document.getElementById('dateFilter')?.value || 'today';
        const timeSlot = document.getElementById('timeSlotFilter')?.value || '';

        const params = new URLSearchParams({
            date_filter: dateFilter,
            time_slot: timeSlot
        });

        const orders = await fetchAPI(`/orders/workshop?${params}`);
        
        if (!orders.success) {
            throw new Error(orders.error || 'Siparişler yüklenemedi');
        }

        // Tüm siparişleri grupla
        const allOrders = orders.orders || [];
        const grouped = {
            new: allOrders.filter(o => o.status === 'new'),
            preparing: allOrders.filter(o => o.status === 'preparing'),
            ready: allOrders.filter(o => o.status === 'ready')
        };

        // Sayaçları güncelle
        document.getElementById('newOrdersCount').textContent = grouped.new.length;
        document.getElementById('preparingOrdersCount').textContent = grouped.preparing.length;
        document.getElementById('readyOrdersCount').textContent = grouped.ready.length;

        // Seçili durumdaki siparişleri göster
        const filteredOrders = filterStatus ? grouped[filterStatus] : allOrders;
        updateOrderCards(filteredOrders);

    } catch (error) {
        console.error('Orders loading error:', error);
        showError('Siparişler yüklenemedi: ' + error.message);
    }
}

function updateOrderCards(orders) {
    const container = document.getElementById('ordersList');
    
    if (!orders?.length) {
        container.innerHTML = `
            <div class="text-center text-muted p-3">
                Sipariş bulunmuyor
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="card mb-3" onclick="showOrderDetail(${order.id})">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <!-- Sol Üst: Sipariş No ve Alıcı -->
                    <div>
                        <h5 class="card-title mb-1">#${order.id} - ${order.recipient_name}</h5>
                        <p class="text-muted mb-2">${order.items_summary}</p>
                    </div>
                    
                    <!-- Sağ Üst: Durum ve Zaman -->
                    <div class="text-end">
                        <span class="badge bg-${getStatusColor(order.status)} mb-2">
                            ${getStatusText(order.status)}
                        </span>
                        <br>
                        <small class="text-${getTimeSlotColor(order.delivery_time)}">
                            ${formatTimeSlot(order.delivery_time)}
                        </small>
                    </div>
                </div>

                <div class="d-flex justify-content-between align-items-center mt-2">
                    <!-- Sol Alt: Tarih -->
                    <small class="text-muted">
                        ${formatDate(order.delivery_date)}
                    </small>
                    
                    <!-- Sağ Alt: Aksiyonlar -->
                    <div class="btn-group btn-group-sm">
                        ${getActionButtons(order.status, order.id)}
                    </div>
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

// updateOrderStatus fonksiyonunu güncelle
async function updateOrderStatus(orderId, newStatus) {
    try {
        event?.stopPropagation();

        const result = await fetchAPI(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });

        if (result.success) {
            showSuccess('Durum güncellendi');
            loadOrders(currentFilter); // Mevcut filtreyi kullan
            
            // Durum değişikliğinden sonra detayı göster
            showOrderDetail(orderId);
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
        // Debug log ekleyelim
        console.log('Loading order detail:', orderId);

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

        // Debug log ekleyelim
        console.log('Order Response:', orderResponse);
        console.log('Recipes Response:', recipesResponse);

        // API yanıt kontrolü
        if (!orderResponse.success || !orderResponse.order) {
            throw new Error('Sipariş bilgileri alınamadı');
        }

        const order = orderResponse.order;
        const recipes = recipesResponse.success ? (recipesResponse.recipes || []) : [];

        // Status için varsayılan değerler ekle
        order.status = order.status || 'new';
        order.items = order.items || [];
        order.delivery_address = order.delivery_address || order.address?.label || 'Adres bilgisi yok';

        // Sipariş detayı HTML'ini güncelle - daha kompakt
        const detailTemplate = `
            <div class="d-flex flex-column h-100">
                <!-- Üst Bilgi -->
                <div class="border-bottom pb-2 mb-2">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="mb-1">Sipariş #${order.id}</h5>
                            <p class="mb-0 small text-muted">
                                ${formatDate(order.delivery_date)} - 
                                ${formatTimeSlot(order.delivery_time)}
                            </p>
                        </div>
                        <span class="badge bg-${getStatusColor(order.status)}">
                            ${getStatusText(order.status)}
                        </span>
                    </div>
                </div>

                <!-- Ürünler -->
                <div class="card mb-2">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="card-title mb-0">Ürünler</h6>
                        </div>
                        <table class="table table-sm mb-0">
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td>${item.product_name}</td>
                                        <td class="text-end" style="width: 80px">${item.quantity}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Reçete -->
                <div class="card flex-grow-1">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="card-title mb-0">Malzeme Kullanımı</h6>
                            <button type="button" class="btn btn-sm btn-outline-primary" onclick="showNewMaterialModal()">
                                <i class="bi bi-plus-lg"></i> Yeni Malzeme
                            </button>
                        </div>
                        ${recipes.length > 0 ? `
                            <div class="table-responsive">
                                <table class="table table-sm align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Malzeme</th>
                                            <th style="width: 80px">Önerilen</th>
                                            <th style="width: 100px">Kullanılan</th>
                                            <th style="width: 60px">Birim</th>
                                        </tr>
                                    </thead>
                                    <tbody id="materialsList">
                                        ${recipes.map(item => `
                                            <tr>
                                                <td>${item.material_name}</td>
                                                <td class="text-center">${item.suggested_quantity}</td>
                                                <td>
                                                    <input type="number" 
                                                        class="form-control form-control-sm used-quantity"
                                                        data-material-id="${item.material_id}"
                                                        value="${item.suggested_quantity}"
                                                        ${order.status !== 'preparing' ? 'disabled' : ''}>
                                                </td>
                                                <td class="text-center">${item.unit}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <div class="alert alert-info py-2">
                                Bu ürün için tanımlanmış reçete bulunmuyor
                            </div>
                        `}
                    </div>
                </div>

                <!-- Alt Aksiyon Alanı -->
                <div class="border-top pt-2 mt-2">
                    ${getDetailActionButtons(order)}
                </div>
            </div>
        `;

        detailContainer.innerHTML = detailTemplate;

        // Scroll to top
        detailContainer.scrollTop = 0;

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
        // Süre kontrolü
        const prepTime = document.getElementById('preparationTime').value;
        if (!prepTime) {
            showError('Lütfen hazırlama süresini girin');
            return;
        }

        // Kullanılan malzemeleri topla
        const materials = [];
        document.querySelectorAll('.used-quantity').forEach(input => {
            materials.push({
                material_id: input.dataset.materialId,
                quantity: Number(input.value)
            });
        });

        // API isteği
        const result = await fetchAPI(`/orders/${orderId}/preparation/complete`, {
            method: 'POST',
            body: JSON.stringify({
                materials: materials,
                preparation_time: Number(prepTime)
            })
        });

        if (result.success) {
            showSuccess('Hazırlama tamamlandı');
            loadOrders(currentFilter);
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

// Yeni malzeme ekleme modal'ı
function showNewMaterialModal() {
    const modal = `
        <div class="modal fade" id="newMaterialModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Yeni Malzeme Ekle</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Malzeme</label>
                            <select class="form-select" id="newMaterialId">
                                <!-- Malzemeler AJAX ile doldurulacak -->
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Miktar</label>
                            <input type="number" class="form-control" id="newMaterialQuantity">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                        <button type="button" class="btn btn-primary" onclick="addNewMaterial()">Ekle</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Modal'ı ekle ve aç
    document.body.insertAdjacentHTML('beforeend', modal);
    loadAvailableMaterials();
    new bootstrap.Modal('#newMaterialModal').show();
}

// Malzemeleri yükle
async function loadAvailableMaterials() {
    try {
        const response = await fetchAPI('/materials');
        const select = document.getElementById('newMaterialId');
        
        select.innerHTML = response.materials.map(m => 
            `<option value="${m.id}" data-unit="${m.unit}">${m.name}</option>`
        ).join('');
    } catch (error) {
        showError('Malzemeler yüklenemedi');
    }
}

// Yeni malzeme ekle
function addNewMaterial() {
    const materialId = document.getElementById('newMaterialId').value;
    const quantity = document.getElementById('newMaterialQuantity').value;
    const material = document.querySelector(`#newMaterialId option[value="${materialId}"]`);

    if (!quantity) {
        showError('Lütfen miktar girin');
        return;
    }

    // Malzemeyi tabloya ekle
    const tbody = document.getElementById('materialsList');
    const row = `
        <tr>
            <td class="small">${material.text}</td>
            <td class="small text-center">-</td>
            <td>
                <input type="number" 
                    class="form-control form-control-sm used-quantity py-1"
                    data-material-id="${materialId}"
                    value="${quantity}">
            </td>
            <td class="small text-center">${material.dataset.unit}</td>
        </tr>
    `;
    tbody.insertAdjacentHTML('beforeend', row);

    // Modal'ı kapat
    bootstrap.Modal.getInstance(document.getElementById('newMaterialModal')).hide();
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
    if (refreshTimer) clearInterval(refreshTimer);
    // Sadece yeni siparişleri kontrol et
    refreshTimer = setInterval(checkNewOrders, REFRESH_INTERVAL);
}

// Sayfa kapanırken timer'ı temizle
window.addEventListener('beforeunload', () => {
    if (refreshTimer) clearInterval(refreshTimer);
});

// Durum filtreleme fonksiyonu güncellendi
function filterByStatus(status) {
    // Global state'i güncelle
    currentFilter = status;
    
    // Tüm kartlardan active class'ı kaldır
    document.querySelectorAll('.status-card').forEach(card => {
        card.classList.remove('active', 'bg-white');
        card.classList.add('bg-light');
    });
    
    // Seçilen kartı aktif yap
    const selectedCard = document.querySelector(`[data-status="${status}"]`);
    if (selectedCard) {
        selectedCard.classList.remove('bg-light');
        selectedCard.classList.add('active', 'bg-white');
    }

    // Siparişleri filtrele ve göster
    loadOrders(status);
}

// Otomatik yenileme sadece yeni siparişler için
async function checkNewOrders() {
    try {
        const params = new URLSearchParams({
            date_filter: 'today',
            status: 'new'
        });

        const response = await fetchAPI(`/orders/workshop?${params}`);
        
        if (!response.success) return;

        const currentCount = document.getElementById('newOrdersCount').textContent;
        const newCount = response.orders?.filter(o => o.status === 'new').length || 0;

        // Yeni sipariş varsa
        if (newCount > parseInt(currentCount)) {
            // Bildirim göster
            showSuccess(`${newCount - parseInt(currentCount)} yeni sipariş var!`);
            // Listeyi güncelle
            loadOrders(currentFilter);
        }

    } catch (error) {
        console.error('New orders check error:', error);
    }
}
