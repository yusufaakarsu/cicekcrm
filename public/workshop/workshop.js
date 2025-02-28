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
                Bu durumda sipariş bulunmuyor
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="card mb-2 cursor-pointer" onclick="showOrderDetail(${order.id})">
            <div class="card-body p-2">
                <div class="d-flex justify-content-between">
                    <strong>#${order.id} - ${order.recipient_name}</strong>
                    <span class="badge ${getStatusBadgeColor(order.status)}">
                        ${getStatusText(order.status)}
                    </span>
                </div>
                <div class="small text-muted mt-1">
                    ${formatDate(order.delivery_date)} ${formatTimeSlot(order.delivery_time)}
                </div>
                <div class="small">
                    ${order.items_summary || 'Ürün bilgisi yok'}
                </div>
                <div class="small text-muted">
                    <i class="bi bi-geo-alt"></i> ${order.district}
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
        'new': 'bg-primary',
        'preparing': 'bg-warning',
        'ready': 'bg-success'
    }[status] || 'bg-secondary';
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
        showLoading();
        
        const result = await fetchAPI(`/workshop/${orderId}/start`, {
            method: 'POST'
        });

        if (result.success) {
            showSuccess('Hazırlama başlatıldı');
            loadOrders(currentFilter);
            
            if (orderId === currentOrderId) {
                showOrderDetail(orderId);
            }
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showError('Hazırlama başlatılamadı: ' + error.message);
    } finally {
        hideLoading();
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

        const detailContainer = document.getElementById('orderDetail');
        const noOrderSelected = document.getElementById('noOrderSelected');

        if (!detailContainer || !noOrderSelected) {
            console.error('Required elements not found');
            return;
        }

        // noOrderSelected'ı gizle
        noOrderSelected.classList.add('d-none');
        
        // orderDetail'i göster ve loading state'e geç
        detailContainer.classList.remove('d-none');
        detailContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">Yükleniyor...</p>
            </div>
        `;

        // Sipariş ve reçete bilgilerini al
        console.log('Fetching order details and recipes...');
        const [orderResponse, recipesResponse] = await Promise.all([
            fetchAPI(`/orders/${orderId}/details`),
            fetchAPI(`/products/recipes/${orderId}`)
        ]);

        console.log('API Responses:', {orderResponse, recipesResponse});

        if (!orderResponse.success) throw new Error('Sipariş detayları alınamadı');
        
        const order = orderResponse.order;
        const recipes = recipesResponse.success ? recipesResponse.recipes : [];

        // Detay HTML'i
        detailContainer.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <!-- Üst bilgi -->
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h5 class="mb-1">Sipariş #${order.id}</h5>
                            <p class="mb-0 text-muted">
                                ${formatDate(order.delivery_date)} ${formatTimeSlot(order.delivery_time)}
                            </p>
                        </div>
                        <span class="badge bg-${getStatusBadgeColor(order.status)}">
                            ${getStatusText(order.status)}
                        </span>
                    </div>

                    <!-- Ürünler -->
                    <div class="mb-4">
                        <h6 class="border-bottom pb-2">Sipariş Ürünleri</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Ürün</th>
                                        <th width="80">Adet</th>
                                        <th width="120">Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${order.items.map(item => `
                                        <tr>
                                            <td>${item.product_name}</td>
                                            <td class="text-center">${item.quantity}</td>
                                            <td>
                                                <span class="badge bg-${getStatusBadgeColor(order.status)}">
                                                    ${getStatusText(order.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Malzeme Kullanımı -->
                    <div class="mb-4">
                        <h6 class="border-bottom pb-2">Malzeme Kullanımı</h6>
                        ${recipes.length > 0 ? `
                            <div class="table-responsive">
                                <table class="table table-sm align-middle">
                                    <thead>
                                        <tr>
                                            <th>Malzeme</th>
                                            <th width="100">Önerilen</th>
                                            <th width="120">Kullanılan</th>
                                            <th width="80">Birim</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${recipes.map(recipe => `
                                            <tr>
                                                <td>${recipe.material_name}</td>
                                                <td class="text-center">${recipe.suggested_quantity}</td>
                                                <td>
                                                    <input type="number" 
                                                        class="form-control form-control-sm used-quantity"
                                                        data-material-id="${recipe.material_id}"
                                                        value="${recipe.suggested_quantity}"
                                                        ${order.status !== 'preparing' ? 'disabled' : ''}>
                                                </td>
                                                <td class="text-center">${recipe.unit_code}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <div class="alert alert-warning py-2">
                                Bu ürünler için malzeme bilgisi bulunamadı
                            </div>
                        `}
                    </div>

                    <!-- Butonlar -->
                    <div class="border-top pt-3">
                        ${order.status === 'new' ? `
                            <button class="btn btn-warning" onclick="startPreparation(${order.id})">
                                <i class="bi bi-play-fill"></i> Hazırlamaya Başla
                            </button>
                        ` : order.status === 'preparing' ? `
                            <button class="btn btn-success" onclick="completePreparation(${order.id})">
                                <i class="bi bi-check-lg"></i> Hazırlamayı Tamamla
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Detail loading error:', error);
        
        const detailContainer = document.getElementById('orderDetail');
        if (detailContainer) {
            detailContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Sipariş detayları yüklenemedi: ${error.message}
                </div>
            `;
        }
    }
}
