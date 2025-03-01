// Global değişkenler
let map;
let deliveryMarkers = {};
let userMarker;
let deliveries = [];
let selectedDeliveryId = null;
let deliveryModal;

document.addEventListener('DOMContentLoaded', async () => {
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
    
    // Navigasyon butonları
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

// Teslimat listesini güncelle - GELİŞTİRİLMİŞ VERSİYON
function updateDeliveryList() {
    const listElement = document.getElementById('deliveryList');
    
    if (deliveries.length === 0) {
        listElement.innerHTML = `
            <div class="text-center p-3">
                <i class="bi bi-inbox text-muted" style="font-size: 2rem;"></i>
                <p class="text-muted">Bugün için teslimat yok</p>
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
            <div class="delivery-time-group">
                <div class="delivery-time-header bg-light p-2 sticky-top">
                    <strong><i class="bi bi-sunrise"></i> Sabah (09:00-12:00)</strong>
                    <span class="badge bg-primary rounded-pill ms-2">${groupedDeliveries.morning.length}</span>
                </div>
                ${renderDeliveryItems(groupedDeliveries.morning)}
            </div>
        `;
    }
    
    // Öğleden sonra teslimatları
    if (groupedDeliveries.afternoon.length > 0) {
        html += `
            <div class="delivery-time-group">
                <div class="delivery-time-header bg-light p-2 sticky-top">
                    <strong><i class="bi bi-sun"></i> Öğleden Sonra (12:00-17:00)</strong>
                    <span class="badge bg-primary rounded-pill ms-2">${groupedDeliveries.afternoon.length}</span>
                </div>
                ${renderDeliveryItems(groupedDeliveries.afternoon)}
            </div>
        `;
    }
    
    // Akşam teslimatları
    if (groupedDeliveries.evening.length > 0) {
        html += `
            <div class="delivery-time-group">
                <div class="delivery-time-header bg-light p-2 sticky-top">
                    <strong><i class="bi bi-moon"></i> Akşam (17:00-21:00)</strong>
                    <span class="badge bg-primary rounded-pill ms-2">${groupedDeliveries.evening.length}</span>
                </div>
                ${renderDeliveryItems(groupedDeliveries.evening)}
            </div>
        `;
    }
    
    listElement.innerHTML = html;
    
    // Teslimat listelerinde bulunan "İncele" butonlarına event listener ekle
    document.querySelectorAll('.btn-view-delivery').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Butonun tıklanmasının parent click olayını tetiklemesini engelle
            const deliveryId = parseInt(btn.getAttribute('data-id'));
            showDeliveryDetails(deliveryId);
        });
    });
}

// Teslimat öğelerini render et
function renderDeliveryItems(deliveryList) {
    return deliveryList.map(delivery => {
        const statusClass = getStatusClass(delivery.status);
        const activeClass = selectedDeliveryId === delivery.id ? 'active' : '';
        const statusBadge = `<span class="badge ${statusClass.badge} me-1">${getStatusShortText(delivery.status)}</span>`;
        
        return `
            <div class="delivery-list-item list-group-item ${activeClass} ${statusClass.item}" 
                 onclick="selectDelivery(${delivery.id})">
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div class="delivery-header">
                        <div class="d-flex align-items-center">
                            ${statusBadge}
                            <strong>${delivery.recipient_name}</strong>
                        </div>
                        <small class="text-muted">${delivery.order_number || `#${delivery.id}`}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-primary btn-view-delivery" data-id="${delivery.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                </div>
                <div class="delivery-content mt-1 small">
                    <div><i class="bi bi-geo-alt text-muted me-1"></i>${delivery.district}, ${delivery.neighborhood}</div>
                    <div class="text-truncate"><i class="bi bi-box text-muted me-1"></i>${delivery.product_summary || 'Ürün detayı yok'}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Durum sınıflarını getir (badge ve item için)
function getStatusClass(status) {
    const classes = {
        'new': { badge: 'bg-primary', item: 'border-start-primary' },
        'confirmed': { badge: 'bg-info', item: 'border-start-info' },
        'preparing': { badge: 'bg-info', item: 'border-start-info' },
        'ready': { badge: 'bg-primary', item: 'border-start-primary' },
        'delivering': { badge: 'bg-warning', item: 'border-start-warning' },
        'delivered': { badge: 'bg-success', item: 'border-start-success' },
        'cancelled': { badge: 'bg-danger', item: 'border-start-danger' }
    };
    
    return classes[status] || { badge: 'bg-secondary', item: '' };
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

// Teslimat detaylarını göster
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
        
        // Detayları modal'a yerleştir
        document.getElementById('deliveryDetails').innerHTML = `
            <div class="mb-3">
                <span class="badge bg-${getStatusBadgeColor(delivery.status)}">${getStatusText(delivery.status)}</span>
                <span class="badge bg-secondary">${formatDeliveryTime(delivery.delivery_time)}</span>
            </div>
            
            <h6>Teslimat Bilgileri</h6>
            <div class="card mb-3">
                <div class="card-body p-2">
                    <div><strong>Alıcı:</strong> ${delivery.recipient_name}</div>
                    <div><strong>Telefon:</strong> <a href="tel:${delivery.recipient_phone}">${formatPhoneNumber(delivery.recipient_phone)}</a></div>
                    <div><strong>Adres:</strong> ${delivery.address}</div>
                </div>
            </div>
            
            <h6>Sipariş İçeriği</h6>
            <div class="card mb-3">
                <div class="card-body p-2">
                    ${delivery.product_summary || 'Ürün bilgisi yok'}
                </div>
            </div>
            
            <h6>Notlar</h6>
            <div class="card">
                <div class="card-body p-2">
                    ${delivery.notes || 'Not yok'}
                </div>
            </div>
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
