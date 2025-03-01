// Global değişkenler
let map;
let deliveryMarkers = {};
let userMarker;
let deliveries = [];
let selectedDeliveryId = null;
let deliveryModal;

document.addEventListener('DOMContentLoaded', async () => {
    // Sidebar yükleme işlemini devre dışı bırak
    // common.js dosyasının loadSideBar çağrısını geçersiz kılmak için
    window.loadSideBar = function() {
        console.log('Teslimat haritası için sidebar gerekmiyor');
        return Promise.resolve();
    };
    
    // Bootstrap modal'ını başlat
    deliveryModal = new bootstrap.Modal(document.getElementById('deliveryModal'));
    
    // Bugünün tarihini göster
    document.getElementById('todayDate').textContent = new Date().toLocaleDateString('tr-TR');
    
    // Haritayı başlat
    map = await initMap('map');
    
    // Teslimatları yükle
    await loadDeliveries();
    
    // Kullanıcı konumunu takip et
    initLocationTracking(map, position => {
        updateUserLocation(position.coords.latitude, position.coords.longitude);
    });
    
    // Event listeners
    document.getElementById('togglePanelBtn').addEventListener('click', toggleDeliveryPanel);
    document.getElementById('btnRefresh').addEventListener('click', loadDeliveries);
    document.getElementById('btnMyLocation').addEventListener('click', centerOnUserLocation);
    
    // Navigasyon butonlarını kaldır
    
    document.getElementById('btnGoogleMaps').addEventListener('click', () => {
        if (selectedDeliveryId) {
            const delivery = getDeliveryById(selectedDeliveryId);
            if (delivery) {
                openGoogleMapsNavigation(delivery.lat, delivery.lng, delivery.address);
            }
        }
    });
    
    document.getElementById('btnAppleMaps').addEventListener('click', () => {
        if (selectedDeliveryId) {
            const delivery = getDeliveryById(selectedDeliveryId);
            if (delivery) {
                openAppleMapsNavigation(delivery.lat, delivery.lng);
            }
        }
    });
    
    document.getElementById('btnYandexMaps').addEventListener('click', () => {
        if (selectedDeliveryId) {
            const delivery = getDeliveryById(selectedDeliveryId);
            if (delivery) {
                openYandexMapsNavigation(delivery.lat, delivery.lng);
            }
        }
    });
    
});

// Teslimat panelini aç/kapat
function toggleDeliveryPanel() {
    const panel = document.querySelector('.delivery-panel');
    panel.classList.toggle('collapsed');
    
    const icon = document.querySelector('#togglePanelBtn i');
    if (panel.classList.contains('collapsed')) {
        icon.classList.replace('bi-chevron-down', 'bi-chevron-up');
    } else {
        icon.classList.replace('bi-chevron-up', 'bi-chevron-down');
    }
}

// Kullanıcı konumunu güncelle
function updateUserLocation(lat, lng) {
    if (!userMarker) {
        // Kullanıcı marker'ını oluştur
        userMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'user-location-marker',
                html: '<i class="bi bi-person-fill"></i>',
                iconSize: [30, 30]
            })
        }).addTo(map);
    } else {
        // Marker konumunu güncelle
        userMarker.setLatLng([lat, lng]);
    }
    
    document.getElementById('locationStatus').innerHTML = 
        `<i class="bi bi-geo-alt-fill text-success"></i> Konum aktif`;
}

// Kullanıcı konumuna git
function centerOnUserLocation() {
    if (userMarker) {
        map.setView(userMarker.getLatLng(), 15);
    } else {
        showError('Konum bilgisi henüz alınamadı');
    }
}

// Teslimatları yükle
async function loadDeliveries() {
    try {
        showLoading();
        
        // API'den gerçek verileri yükle
        const response = await fetchAPI('/delivery/today');
        if (!response.success) {
            throw new Error(response.error || 'Veriler yüklenemedi');
        }
        
        deliveries = response.deliveries || [];
        
        // Hiçbir veri yoksa örnek verileri kullan (test/geliştirme için)
        if (deliveries.length === 0) {
            console.log('API\'den veri gelmedi, örnek veriler kullanılıyor');
            deliveries = [
                {
                    id: 1,
                    order_number: "#0001",
                    recipient_name: "Ahmet Yılmaz",
                    recipient_phone: "05551234567",
                    district: "Kadıköy",
                    neighborhood: "Caferağa",
                    address: "Caferağa Mh, Moda Cd. No:5, Kadıköy/İstanbul",
                    delivery_time: "morning",
                    delivery_date: "2023-04-03",
                    status: "ready",
                    lat: 40.9867,
                    lng: 29.0287,
                    product_summary: "Kırmızı Gül Buketi (x1)"
                },
                {
                    id: 2,
                    order_number: "#0002",
                    recipient_name: "Zeynep Demir",
                    recipient_phone: "05559876543",
                    district: "Beşiktaş",
                    neighborhood: "Levent",
                    address: "Levent Mh, Çarşı Cd. No:12, Beşiktaş/İstanbul",
                    delivery_time: "afternoon",
                    delivery_date: "2023-04-03",
                    status: "delivering",
                    lat: 41.0876,
                    lng: 29.0112,
                    product_summary: "Orkide Saksı Çiçeği (x1), Çikolata (x2)"
                },
                {
                    id: 3,
                    order_number: "#0003",
                    recipient_name: "Mehmet Kaya",
                    recipient_phone: "05553456789",
                    district: "Şişli",
                    neighborhood: "Mecidiyeköy",
                    address: "Mecidiyeköy Mh, Büyükdere Cd. No:58, Şişli/İstanbul",
                    delivery_time: "evening",
                    delivery_date: "2023-04-03",
                    status: "new",
                    lat: 41.0677,
                    lng: 28.9879,
                    product_summary: "Karışık Buket (x1)"
                }
            ];
        }
        
        document.getElementById('deliveryCount').textContent = `${deliveries.length} teslimat`;
        
        // Marker'ları haritaya yerleştir
        updateDeliveryMarkers();
        
        // Teslimat listesini güncelle
        updateDeliveryList();
        
        if (deliveries.length > 0) {
            // İlk teslimat konumuna odaklan
            const bounds = getBoundsFromDeliveries(deliveries);
            map.fitBounds(bounds);
        }
        
    } catch (error) {
        console.error('Teslimat yükleme hatası:', error);
        showError('Teslimatlar yüklenemedi: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Teslimat marker'larını güncelle
function updateDeliveryMarkers() {
    // Önce eski marker'ları temizle
    Object.values(deliveryMarkers).forEach(marker => {
        map.removeLayer(marker);
    });
    deliveryMarkers = {};
    
    // Yeni marker'lar ekle
    deliveries.forEach(delivery => {
        if (delivery.lat && delivery.lng) {
            // Marker'ı oluştur
            const marker = createDeliveryMarker(delivery);
            
            // Popup ekle
            marker.bindPopup(createDeliveryPopup(delivery));
            
            // Click event ekle
            marker.on('click', () => {
                selectDelivery(delivery.id);
            });
            
            deliveryMarkers[delivery.id] = marker;
        }
    });
}

// Teslimat marker'ı oluştur
function createDeliveryMarker(delivery) {
    const statusClass = delivery.status === 'delivered' ? 'completed' : 
                        (delivery.status === 'delivering' ? 'pending' : '');
    
    const markerHtml = `<div class="delivery-marker ${statusClass}">${delivery.order_number || '#'}</div>`;
    
    const markerIcon = L.divIcon({
        html: markerHtml,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
    });
    
    return L.marker([delivery.lat, delivery.lng], { icon: markerIcon }).addTo(map);
}

// Teslimat popup içeriği oluştur
function createDeliveryPopup(delivery) {
    return `
        <div class="delivery-popup">
            <h5>Teslimat #${delivery.order_number || delivery.id}</h5>
            <div class="address">${delivery.address}</div>
            <div class="customer">
                <strong>Alıcı:</strong> ${delivery.recipient_name}<br>
                <strong>Tel:</strong> ${formatPhoneNumber(delivery.recipient_phone)}
            </div>
            <div class="nav-buttons">
                <button class="btn btn-sm btn-primary" onclick="showDeliveryDetails(${delivery.id})">
                    <i class="bi bi-info-circle"></i> Detaylar
                </button>
            </div>
        </div>
    `;
}

// Teslimat listesini güncelle - BOOTSTRAP ODAKLI
function updateDeliveryList() {
    const listElement = document.getElementById('deliveryList');
    
    if (deliveries.length === 0) {
        listElement.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
                <p class="text-muted mt-3">Bugün için teslimat yok</p>
            </div>
        `;
        return;
    }
    
    // Teslimatları zaman dilimine göre grupla
    const groupedDeliveries = {
        morning: deliveries.filter(d => d.delivery_time === 'morning'),
        afternoon: deliveries.filter(d => d.delivery_time === 'afternoon'),
        evening: deliveries.filter(d => d.delivery_time === 'evening')
    };
    
    // Gruplandırılmış teslimatları HTML olarak render et
    let html = '';
    
    // Sabah teslimatları
    if (groupedDeliveries.morning.length > 0) {
        html += `
            <div class="mb-2">
                <div class="delivery-time-header bg-light px-3 py-2 d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-sunrise text-warning me-1"></i> 
                        <span class="fw-medium">Sabah</span>
                        <span class="text-muted small ms-1">(09:00-12:00)</span>
                    </div>
                    <span class="badge rounded-pill bg-primary">${groupedDeliveries.morning.length}</span>
                </div>
                ${renderDeliveryItems(groupedDeliveries.morning)}
            </div>
        `;
    }
    
    // Öğleden sonra teslimatları
    if (groupedDeliveries.afternoon.length > 0) {
        html += `
            <div class="mb-2">
                <div class="delivery-time-header bg-light px-3 py-2 d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-sun text-warning me-1"></i> 
                        <span class="fw-medium">Öğleden Sonra</span>
                        <span class="text-muted small ms-1">(12:00-17:00)</span>
                    </div>
                    <span class="badge rounded-pill bg-primary">${groupedDeliveries.afternoon.length}</span>
                </div>
                ${renderDeliveryItems(groupedDeliveries.afternoon)}
            </div>
        `;
    }
    
    // Akşam teslimatları
    if (groupedDeliveries.evening.length > 0) {
        html += `
            <div class="mb-2">
                <div class="delivery-time-header bg-light px-3 py-2 d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-moon text-primary me-1"></i> 
                        <span class="fw-medium">Akşam</span>
                        <span class="text-muted small ms-1">(17:00-21:00)</span>
                    </div>
                    <span class="badge rounded-pill bg-primary">${groupedDeliveries.evening.length}</span>
                </div>
                ${renderDeliveryItems(groupedDeliveries.evening)}
            </div>
        `;
    }
    
    listElement.innerHTML = html;
    
    // Event listener'ları ekle
    document.querySelectorAll('.btn-view-delivery').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const deliveryId = parseInt(btn.getAttribute('data-id'));
            showDeliveryDetails(deliveryId);
        });
    });
}

// Teslimat öğelerini render et - BOOTSTRAP ODAKLI
function renderDeliveryItems(deliveryList) {
    return deliveryList.map(delivery => {
        const statusClass = getStatusBootstrapClass(delivery.status);
        const activeClass = selectedDeliveryId === delivery.id ? 'active bg-light' : '';
        
        return `
            <div class="list-group-item list-group-item-action ${activeClass} p-2 border-start border-4 ${statusClass.border}" 
                 onclick="selectDelivery(${delivery.id})">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex flex-column">
                        <div class="d-flex align-items-center">
                            <span class="badge ${statusClass.badge} me-1">${getStatusShortText(delivery.status)}</span>
                            <span class="fw-medium">${delivery.recipient_name}</span>
                        </div>
                        <small class="text-muted mt-1">${delivery.order_number || `#${delivery.id}`}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-primary ms-2 btn-view-delivery" data-id="${delivery.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                </div>
                <div class="mt-2 small">
                    <div class="text-muted"><i class="bi bi-geo-alt me-1"></i>${delivery.district}, ${delivery.neighborhood}</div>
                    <div class="text-truncate mt-1"><i class="bi bi-box me-1"></i>${delivery.product_summary || 'Ürün detayı yok'}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Bootstrap sınıflarını kullanarak durum stilleri
function getStatusBootstrapClass(status) {
    const classes = {
        'new': { 
            badge: 'bg-primary', 
            border: 'border-primary' 
        },
        'confirmed': { 
            badge: 'bg-info', 
            border: 'border-info' 
        },
        'preparing': { 
            badge: 'bg-info', 
            border: 'border-info' 
        },
        'ready': { 
            badge: 'bg-primary', 
            border: 'border-primary' 
        },
        'delivering': { 
            badge: 'bg-warning', 
            border: 'border-warning' 
        },
        'delivered': { 
            badge: 'bg-success', 
            border: 'border-success' 
        },
        'cancelled': { 
            badge: 'bg-danger', 
            border: 'border-danger' 
        }
    };
    
    return classes[status] || { badge: 'bg-secondary', border: 'border-secondary' };
}

// Teslimat seç
function selectDelivery(id) {
    selectedDeliveryId = id;
    
    // Listedeki active class'ları güncelle
    document.querySelectorAll('.delivery-list-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Seçili olan item'a active class ekle
    document.querySelectorAll(`.delivery-list-item[onclick="selectDelivery(${id})"]`).forEach(item => {
        item.classList.add('active');
    });
    
    // Marker'a odaklan
    const marker = deliveryMarkers[id];
    if (marker) {
        map.setView(marker.getLatLng(), 16);
        marker.openPopup();
    }
}

// Teslimat detaylarını göster - BOOTSTRAP ODAKLI
async function showDeliveryDetails(id) {
    try {
        selectedDeliveryId = id;
        
        // Modal başlığını güncelle
        document.getElementById('deliveryId').textContent = id;
        
        // Detay verilerini yükle
        const delivery = getDeliveryById(id);
        
        if (!delivery) {
            throw new Error('Teslimat bulunamadı');
        }
        
        // Durum renk ve metni
        const statusStyle = getStatusBootstrapClass(delivery.status);
        
        // Detayları modal'a yerleştir
        document.getElementById('deliveryDetails').innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <span class="badge ${statusStyle.badge}">${getStatusText(delivery.status)}</span>
                    <span class="badge bg-secondary">${formatDeliveryTime(delivery.delivery_time)}</span>
                </div>
                <div class="text-muted small">${delivery.delivery_date}</div>
            </div>
            
            <h6 class="border-bottom pb-2 mb-3">Teslimat Bilgileri</h6>
            <div class="card bg-light mb-3">
                <div class="card-body p-3">
                    <div class="mb-1">
                        <i class="bi bi-person me-2 text-primary"></i>
                        <strong>Alıcı:</strong> ${delivery.recipient_name}
                    </div>
                    <div class="mb-1">
                        <i class="bi bi-telephone me-2 text-primary"></i>
                        <strong>Telefon:</strong> 
                        <a href="tel:${delivery.recipient_phone}" class="text-decoration-none">
                            ${formatPhoneNumber(delivery.recipient_phone)}
                        </a>
                    </div>
                    <div>
                        <i class="bi bi-geo-alt me-2 text-primary"></i>
                        <strong>Adres:</strong> ${delivery.address}
                    </div>
                </div>
            </div>
            
            <h6 class="border-bottom pb-2 mb-3">Sipariş İçeriği</h6>
            <div class="card bg-light mb-3">
                <div class="card-body p-3">
                    <i class="bi bi-box me-2 text-primary"></i>
                    ${delivery.product_summary || 'Ürün bilgisi yok'}
                </div>
            </div>
            
            ${delivery.notes ? `
                <h6 class="border-bottom pb-2 mb-3">Notlar</h6>
                <div class="card bg-light">
                    <div class="card-body p-3">
                        <i class="bi bi-sticky me-2 text-primary"></i>
                        ${delivery.notes}
                    </div>
                </div>
            ` : ''}
        `;
        
        // Modal'ı göster
        deliveryModal.show();
        
    } catch (error) {
        console.error('Teslimat detay hatası:', error);
        showError('Teslimat detayları yüklenemedi: ' + error.message);
    }
}

// ID'ye göre teslimat verisini getir
function getDeliveryById(id) {
    return deliveries.find(d => d.id === id);
}

// Teslimat listesinden sınırları belirle
function getBoundsFromDeliveries(deliveryList) {
    const validDeliveries = deliveryList.filter(d => d.lat && d.lng);
    
    if (validDeliveries.length === 0) {
        // İstanbul merkezi
        return L.latLngBounds(
            [41.0082, 28.9784], 
            [41.0082, 28.9784]
        ).pad(0.1);
    }
    
    const points = validDeliveries.map(d => [d.lat, d.lng]);
    return L.latLngBounds(points);
}

// Durum rengini belirle
function getStatusBadgeColor(status) {
    const colors = {
        'new': 'primary',
        'confirmed': 'info',
        'preparing': 'info',
        'ready': 'primary',
        'delivering': 'warning',
        'delivered': 'success',
        'cancelled': 'danger'
    };
    
    return colors[status] || 'secondary';
}

// Kısa durum metni getir
function getStatusShortText(status) {
    const texts = {
        'new': 'Yeni',
        'confirmed': 'Onay',
        'preparing': 'Hazır',
        'ready': 'Hazır',
        'delivering': 'Yolda',
        'delivered': 'Tamam',
        'cancelled': 'İptal'
    };
    
    return texts[status] || status;
}

// Durum metnini belirle
function getStatusText(status) {
    const texts = {
        'new': 'Yeni',
        'confirmed': 'Onaylandı',
        'preparing': 'Hazırlanıyor',
        'ready': 'Hazır',
        'delivering': 'Yolda',
        'delivered': 'Teslim Edildi',
        'cancelled': 'İptal'
    };
    
    return texts[status] || status;
}

// Teslimat zamanı formatı
function formatDeliveryTime(time) {
    switch(time) {
        case 'morning':
            return '📅 Sabah (09:00-12:00)';
        case 'afternoon':
            return '🌞 Öğleden Sonra (12:00-17:00)';
        case 'evening':
            return '🌙 Akşam (17:00-21:00)';
        default:
            return time;
    }
}

// Telefon numarası formatla
function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // 10 haneli (5XX XXX XXXX) formata dönüştür
    if (phone.length === 10) {
        return `${phone.substring(0, 3)} ${phone.substring(3, 6)} ${phone.substring(6)}`;
    }
    
    // 11 haneli (0 5XX XXX XXXX) formata dönüştür
    if (phone.length === 11 && phone.startsWith('0')) {
        return `${phone.substring(0, 1)} ${phone.substring(1, 4)} ${phone.substring(4, 7)} ${phone.substring(7)}`;
    }
    
    return phone;
}
