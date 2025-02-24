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
        // Debug log
        console.log('Loading order detail:', orderId);

        // noOrderSelected'ı gizle
        document.getElementById('noOrderSelected').classList.add('d-none');
        
        // orderDetail'i göster ve loading state'e geç
        const detailContainer = document.getElementById('orderDetail');
        detailContainer.classList.remove('d-none');
        detailContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">Yükleniyor...</p>
            </div>
        `;

        // Sipariş ve ürün bilgilerini al
        const [orderResponse, recipesResponse] = await Promise.all([
            fetchAPI(`/orders/${orderId}/details`),
            fetchAPI(`/materials/products/${orderId}/recipes`)
        ]);

        // Debug log
        console.log('Order:', orderResponse);
        console.log('Recipes:', recipesResponse);

        if (!orderResponse.success) {
            throw new Error(orderResponse.error || 'Sipariş detayları alınamadı');
        }

        const order = orderResponse.order;
        const recipes = recipesResponse.success ? recipesResponse.recipes : [];

        // Detay HTML'ini oluştur
        detailContainer.innerHTML = `
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
                        <span class="badge bg-${getStatusBadgeColor(order.status)}">
                            ${getStatusText(order.status)}
                        </span>
                    </div>
                </div>

                <!-- Ürünler -->
                <div class="card mb-2">
                    <div class="card-body p-2">
                        <div class="table-responsive">
                            <table class="table table-sm mb-0">
                                <thead>
                                    <tr>
                                        <th>Ürün</th>
                                        <th style="width:80px">Adet</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${order.items.map(item => `
                                        <tr>
                                            <td>${item.product_name}</td>
                                            <td class="text-center">${item.quantity}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Malzemeler -->
                <div class="card flex-grow-1">
                    <div class="card-body p-2">
                        <h6 class="card-title mb-2">Malzeme Kullanımı</h6>
                        ${recipes.length > 0 ? `
                            <div class="table-responsive">
                                <table class="table table-sm align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Malzeme</th>
                                            <th style="width:80px">Önerilen</th>
                                            <th style="width:100px">Kullanılan</th>
                                            <th style="width:60px">Birim</th>
                                        </tr>
                                    </thead>
                                    <tbody>
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
                                Bu ürünler için malzeme bilgisi bulunamadı
                            </div>
                        `}
                    </div>
                </div>

                <!-- Alt Butonlar -->
                <div class="border-top pt-2 mt-2">
                    ${order.status === 'new' ? `
                        <button class="btn btn-warning w-100" onclick="startPreparation(${order.id})">
                            <i class="bi bi-play-fill"></i> Hazırlamaya Başla
                        </button>
                    ` : order.status === 'preparing' ? `
                        <div class="row g-2">
                            <div class="col">
                                <input type="number" class="form-control" id="preparationTime" 
                                    placeholder="Süre (dk)">
                            </div>
                            <div class="col-auto">
                                <button class="btn btn-success" onclick="completePreparation(${order.id})">
                                    <i class="bi bi-check-lg"></i> Hazırlamayı Tamamla
                                </button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Order detail error:', error);
        detailContainer.innerHTML = `
            <div class="alert alert-danger">
                Sipariş detayları yüklenemedi: ${error.message}
            </div>
        `;
    }
}
