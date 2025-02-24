document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    loadOrders();
    setupEventListeners();
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
        const dateFilter = document.getElementById('dateFilter').value;
        const timeSlot = document.getElementById('timeSlotFilter').value;
        const status = document.getElementById('statusFilter').value;

        // URL parametrelerini oluştur
        const params = new URLSearchParams({
            date_filter: dateFilter,
            time_slot: timeSlot,
            status: status
        });

        const orders = await fetchAPI(`/orders/workshop?${params}`);
        
        if (!orders.success) {
            throw new Error(orders.error || 'Siparişler yüklenemedi');
        }

        // Siparişleri durumlarına göre grupla
        const grouped = {
            new: orders.orders.filter(o => o.status === 'new'),
            preparing: orders.orders.filter(o => o.status === 'preparing'),
            ready: orders.orders.filter(o => o.status === 'ready')
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
        showError('Siparişler yüklenemedi');
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
                        onclick="updateOrderStatus(${orderId}, 'preparing')">
                    <i class="bi bi-play-fill"></i> Hazırlamaya Başla
                </button>
            `;
        case 'preparing':
            return `
                <button class="btn btn-sm btn-success"
                        onclick="updateOrderStatus(${orderId}, 'ready')">
                    <i class="bi bi-check-lg"></i> Hazır
                </button>
            `;
        case 'ready':
            return `
                <button class="btn btn-sm btn-outline-primary"
                        onclick="printOrderDetail(${orderId})">
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

async function showOrderDetail(orderId) {
    try {
        const response = await fetchAPI(`/orders/${orderId}/details`);
        
        if (!response.success) {
            throw new Error(response.error || 'Sipariş detayları yüklenemedi');
        }

        const order = response.order;

        // Null check ekleyelim
        const items = order.items || [];

        // Ürünlerin reçetelerini al
        const recipes = await fetchAPI(`/orders/${orderId}/recipes`);
        
        // Modal içeriğini doldur
        document.getElementById('modalOrderId').textContent = orderId;
        document.getElementById('modalContent').innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Teslimat Bilgileri</h6>
                    <p>
                        <strong>Tarih:</strong> ${formatDate(order.delivery_date)}<br>
                        <strong>Saat:</strong> ${formatTimeSlot(order.delivery_time)}<br>
                        <strong>Adres:</strong> ${order.delivery_address || ''}
                    </p>
                </div>
                <div class="col-md-6">
                    <h6>Alıcı Bilgileri</h6>
                    <p>
                        <strong>İsim:</strong> ${order.recipient_name || ''}<br>
                        <strong>Telefon:</strong> ${formatPhoneNumber(order.recipient_phone)}
                    </p>
                </div>
            </div>
            <hr>
            <h6>Ürünler</h6>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Ürün</th>
                            <th class="text-end">Adet</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td>${item.product_name || ''}</td>
                                <td class="text-end">${item.quantity}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${order.card_message ? `
                <hr>
                <h6>Kart Mesajı</h6>
                <p class="mb-0">${order.card_message}</p>
            ` : ''}

            <!-- Tavsiye Reçete -->
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">Tavsiye Reçete</h6>
                    <button class="btn btn-sm btn-primary" onclick="startPreparation(${orderId})">
                        Hazırlamaya Başla
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Malzeme</th>
                                    <th>Önerilen Miktar</th>
                                    <th>Kullanılan</th>
                                    <th>Birim</th>
                                    <th>Maliyet</th>
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
                                                   data-material-id="${item.material_id}"
                                                   value="${item.suggested_quantity}">
                                        </td>
                                        <td>${item.unit}</td>
                                        <td>${formatCurrency(item.unit_price)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- İşçilik -->
            <div class="card mb-3">
                <div class="card-header">
                    <h6 class="mb-0">İşçilik</h6>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Hazırlama Süresi (dk)</label>
                            <input type="number" class="form-control" id="preparationTime">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">İşçilik Maliyeti</label>
                            <input type="number" class="form-control" id="laborCost">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tamamlama -->
            <div class="card">
                <div class="card-body">
                    <button class="btn btn-success w-100" onclick="completePreparation(${orderId})">
                        <i class="bi bi-check-lg"></i> Hazırlamayı Tamamla
                    </button>
                </div>
            </div>
        `;

        // Modal'ı göster
        const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
        modal.show();

    } catch (error) {
        console.error('Order detail error:', error);
        showError('Sipariş detayları yüklenemedi');
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

// 30 saniyede bir otomatik yenile
setInterval(loadOrders, 30000);
