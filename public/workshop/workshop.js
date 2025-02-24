let currentFilter = 'new';

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    filterByStatus('new');
    setupEventListeners();
});

function setupEventListeners() {
    // Filter ve refresh butonları
    document.getElementById('dateFilter').addEventListener('change', () => loadOrders(currentFilter));
    document.getElementById('timeSlotFilter').addEventListener('change', () => loadOrders(currentFilter));
    document.getElementById('refreshButton').addEventListener('click', () => loadOrders(currentFilter));

    // Status kartları
    document.querySelectorAll('.status-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const status = e.currentTarget.dataset.status;
            filterByStatus(status);
        });
    });
}

async function loadOrders(status = 'new') {
    try {
        // API'den siparişleri yükle
        const params = new URLSearchParams({
            date_filter: document.getElementById('dateFilter').value || 'today',
            time_slot: document.getElementById('timeSlotFilter').value || ''
        });

        const response = await fetchAPI(`/workshop?${params}`);
        if (!response.success) throw new Error(response.error);

        const orders = response.orders || [];
        updateOrdersList(orders.filter(o => o.status === status));
        updateCountBadges(orders);

    } catch (error) {
        console.error('Orders loading error:', error);
        showError(error.message);
    }
}

// Duruma göre filtreleme
function filterByStatus(status) {
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

    // Siparişleri yükle
    loadOrders(status);
}

// Sipariş listesini güncelle
function updateOrdersList(orders) {
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
        <div class="card mb-2 cursor-pointer" onclick="showOrderDetail(${order.id})">
            <div class="card-body p-2">
                <div class="d-flex justify-content-between">
                    <strong>#${order.id} - ${order.recipient_name}</strong>
                    <span class="badge bg-${getStatusBadgeColor(order.status)}">
                        ${getStatusText(order.status)}
                    </span>
                </div>
                <div class="small text-muted mt-1">
                    ${formatDate(order.delivery_date)} ${formatTimeSlot(order.delivery_time)}
                </div>
                <div class="small">
                    ${order.items_summary || 'Ürün bilgisi yok'}
                </div>
            </div>
        </div>
    `).join('');
}

// Sipariş sayılarını güncelle
function updateCountBadges(orders) {
    document.getElementById('newOrdersCount').textContent = 
        orders.filter(o => o.status === 'new').length;
        
    document.getElementById('preparingOrdersCount').textContent = 
        orders.filter(o => o.status === 'preparing').length;
        
    document.getElementById('readyOrdersCount').textContent = 
        orders.filter(o => o.status === 'ready').length;
}

// Helper fonksiyonlar
function getStatusBadgeColor(status) {
    return {
        'new': 'warning',
        'preparing': 'info',
        'ready': 'success'
    }[status] || 'secondary';
}

function getStatusText(status) {
    return {
        'new': 'Yeni',
        'preparing': 'Hazırlanıyor',
        'ready': 'Hazır'
    }[status] || status;
}

function formatTimeSlot(slot) {
    return {
        'morning': 'Sabah (09:00-12:00)',
        'afternoon': 'Öğlen (12:00-17:00)',
        'evening': 'Akşam (17:00-21:00)'
    }[slot] || slot;
}

function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

async function startPreparation(orderId) {
    try {
        const result = await fetchAPI(`/workshop/${orderId}/start`, {
            method: 'POST'
        });

        if (result.success) {
            showSuccess('Hazırlama başlatıldı');
            loadOrders(currentFilter);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showError('Hazırlama başlatılamadı: ' + error.message);
    }
}

async function completePreparation(orderId) {
    try {
        // Malzeme listesini topla
        const materials = [];
        document.querySelectorAll('.used-quantity').forEach(input => {
            materials.push({
                material_id: Number(input.dataset.materialId),
                quantity: Number(input.value)
            });
        });

        // API'ye gönder
        const result = await fetchAPI(`/workshop/${orderId}/complete`, {
            method: 'POST',
            body: JSON.stringify({ materials })
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

async function showOrderDetail(orderId) {
    try {
        const detailContainer = document.getElementById('orderDetail');
        document.getElementById('noOrderSelected').classList.add('d-none');
        detailContainer.classList.remove('d-none');

        // Loading göster
        detailContainer.innerHTML = `
            <div class="text-center p-4">
                <div class="spinner-border"></div>
            </div>
        `;

        // Sadece sipariş detayını al
        const response = await fetchAPI(`/orders/${orderId}/details`);
        console.log('Order detail response:', response);

        if (!response.success) {
            throw new Error('Sipariş detayları alınamadı');
        }

        const order = response.order;

        // Basit detay gösterimi
        detailContainer.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5>Sipariş #${order.id}</h5>
                    <p>Durum: ${getStatusText(order.status)}</p>
                    <hr>
                    <h6>Ürünler:</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Ürün</th>
                                    <th>Adet</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td>${item.product_name}</td>
                                        <td>${item.quantity}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    ${order.status === 'new' ? `
                        <button class="btn btn-warning mt-3" onclick="startPreparation(${order.id})">
                            Hazırlamaya Başla
                        </button>
                    ` : order.status === 'preparing' ? `
                        <button class="btn btn-success mt-3" onclick="completePreparation(${order.id})">
                            Hazırlamayı Tamamla
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Detay yükleme hatası:', error);
        showError(error.message);
    }
}
