let map;
let markers = [];
let deliveryModal;
const ISTANBUL_CENTER = [41.0082, 28.9784];

document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    initMap();
    initModal();
    loadDeliveries();
    
    // Event listeners
    document.getElementById('refreshMap').addEventListener('click', loadDeliveries);
    document.getElementById('centerMap').addEventListener('click', () => map.setView(ISTANBUL_CENTER, 11));
    
    // Her 5 dakikada bir güncelle
    setInterval(loadDeliveries, 300000);
});

function initMap() {
    map = L.map('deliveryMap').setView(ISTANBUL_CENTER, 11);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

function initModal() {
    deliveryModal = new bootstrap.Modal(document.getElementById('deliveryModal'));
    
    document.getElementById('updateStatus').addEventListener('click', async () => {
        const orderId = deliveryModal._element.dataset.orderId;
        const newStatus = document.querySelector('input[name="deliveryStatus"]:checked')?.value;
        
        if (orderId && newStatus) {
            await updateDeliveryStatus(orderId, newStatus);
            deliveryModal.hide();
            loadDeliveries();
        }
    });
}

async function loadDeliveries() {
    try {
        const response = await fetch(`${API_URL}/orders/today`);
        const deliveries = await response.json();
        
        updateStats(deliveries);
        updateMarkers(deliveries);
        updateDeliveryList(deliveries);
        
    } catch (error) {
        console.error('Teslimat verisi yüklenirken hata:', error);
    }
}

function updateStats(deliveries) {
    const stats = deliveries.reduce((acc, delivery) => {
        acc.total++;
        acc[delivery.status]++;
        return acc;
    }, { total: 0, delivered: 0, delivering: 0, preparing: 0 });

    document.getElementById('todayCount').textContent = stats.total;
    document.getElementById('deliveredCount').textContent = stats.delivered;
    document.getElementById('onWayCount').textContent = stats.delivering;
    document.getElementById('preparingCount').textContent = stats.preparing;
}

function updateMarkers(deliveries) {
    // Mevcut işaretçileri temizle
    markers.forEach(marker => marker.remove());
    markers = [];
    
    deliveries.forEach(delivery => {
        // Rastgele konum üret (gerçek veriler API'den gelecek)
        const lat = ISTANBUL_CENTER[0] + (Math.random() - 0.5) * 0.1;
        const lng = ISTANBUL_CENTER[1] + (Math.random() - 0.5) * 0.1;
        
        const marker = L.marker([lat, lng], {
            icon: getMarkerIcon(delivery.status)
        }).addTo(map);
        
        marker.bindPopup(getMarkerPopup(delivery));
        marker.on('click', () => showDeliveryModal(delivery));
        
        markers.push(marker);
    });
}

function updateDeliveryList(deliveries) {
    const list = document.getElementById('deliveryList');
    
    list.innerHTML = deliveries.map(delivery => `
        <div class="list-group-item list-group-item-action" onclick="showDeliveryModal(${JSON.stringify(delivery).replace(/"/g, '&quot;')})">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">${delivery.recipient_name}</h6>
                    <small class="text-muted">${delivery.delivery_time_slot} - ${delivery.delivery_district}</small>
                </div>
                ${getStatusBadge(delivery.status)}
            </div>
            <small class="d-block mt-1">${delivery.delivery_address}</small>
        </div>
    `).join('');
}

function showDeliveryModal(delivery) {
    const modal = document.getElementById('deliveryModal');
    modal.dataset.orderId = delivery.id;
    
    modal.querySelector('.modal-body').innerHTML = `
        <div class="mb-3">
            <h6>Alıcı Bilgileri</h6>
            <p class="mb-1"><strong>${delivery.recipient_name}</strong></p>
            <p class="mb-1"><i class="bi bi-telephone"></i> ${delivery.recipient_phone}</p>
            <p class="mb-1"><i class="bi bi-geo-alt"></i> ${delivery.delivery_address}</p>
            ${delivery.card_message ? `<p class="mb-1"><i class="bi bi-chat-quote"></i> ${delivery.card_message}</p>` : ''}
        </div>
        <div class="mb-3">
            <h6>Teslimat Durumu</h6>
            <div class="btn-group-vertical w-100" role="group">
                ${getStatusRadios(delivery.status)}
            </div>
        </div>
    `;
    
    deliveryModal.show();
}

async function updateDeliveryStatus(orderId, status) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) throw new Error('Güncelleme başarısız');
        
    } catch (error) {
        console.error('Durum güncellenirken hata:', error);
        alert('Durum güncellenirken bir hata oluştu');
    }
}

// Helper fonksiyonlar
function getMarkerIcon(status) {
    const colors = {
        'new': '#0d6efd',
        'preparing': '#ffc107',
        'delivering': '#fd7e14',
        'delivered': '#198754',
        'cancelled': '#dc3545'
    };
    
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${colors[status] || '#6c757d'};" class="marker-pin"></div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
    });
}

function getMarkerPopup(delivery) {
    return `
        <div class="delivery-popup">
            <h6>${delivery.recipient_name}</h6>
            <p class="mb-1"><small>${delivery.delivery_time_slot}</small></p>
            <p class="mb-1">${delivery.delivery_address}</p>
            ${getStatusBadge(delivery.status)}
        </div>
    `;
}

function getStatusBadge(status) {
    const badges = {
        'new': '<span class="badge bg-primary">Yeni</span>',
        'preparing': '<span class="badge bg-warning">Hazırlanıyor</span>',
        'delivering': '<span class="badge bg-info">Yolda</span>',
        'delivered': '<span class="badge bg-success">Teslim Edildi</span>',
        'cancelled': '<span class="badge bg-danger">İptal</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

function getStatusRadios(currentStatus) {
    const statuses = [
        { value: 'new', label: 'Yeni', color: 'primary' },
        { value: 'preparing', label: 'Hazırlanıyor', color: 'warning' },
        { value: 'delivering', label: 'Yolda', color: 'info' },
        { value: 'delivered', label: 'Teslim Edildi', color: 'success' }
    ];
    
    return statuses.map(status => `
        <input type="radio" class="btn-check" name="deliveryStatus" id="status_${status.value}" 
               value="${status.value}" ${currentStatus === status.value ? 'checked' : ''}>
        <label class="btn btn-outline-${status.color}" for="status_${status.value}">
            ${status.label}
        </label>
    `).join('');
}
