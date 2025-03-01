// Harita başlatma
async function initMap(elementId, options = {}) {
    try {
        // Varsayılan ayarlar
        const defaultOptions = {
            center: [41.0082, 28.9784], // İstanbul
            zoom: 12,
            maxZoom: 19,
            minZoom: 5
        };
        
        // Ayarları birleştir
        const mapOptions = { ...defaultOptions, ...options };
        
        // Haritayı oluştur
        const map = L.map(elementId, mapOptions);
        
        // Harita katmanı ekle (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        /* Geolocation kontrolünü kaldırdık çünkü eklenti yüklü değil 
        // Geolocation kontrolünü ekle
        L.control.locate({
            position: 'bottomright',
            strings: {
                title: "Konumumu göster"
            },
            locateOptions: {
                enableHighAccuracy: true,
                watch: true
            }
        }).addTo(map);
        */
        
        return map;
    } catch (error) {
        console.error('Harita başlatma hatası:', error);
        showError('Harita başlatılamadı: ' + error.message);
        throw error;
    }
}

// Marker popupları için HTML template fonksiyonu
function createMarkerPopup(delivery) {
    const statusBadge = getStatusBadge(delivery.status);
    
    return `
        <div class="map-popup">
            <h6 class="mb-1">Teslimat #${delivery.order_number || delivery.id}</h6>
            <div class="mb-1">${statusBadge} ${formatDeliveryTime(delivery.delivery_time)}</div>
            <div class="mb-2">
                <strong>Alıcı:</strong> ${delivery.recipient_name}<br>
                <strong>Adres:</strong> ${delivery.address}
            </div>
            <div class="d-flex gap-1">
                <button class="btn btn-sm btn-primary w-100" onclick="showDeliveryDetails(${delivery.id})">
                    Detaylar
                </button>
                <button class="btn btn-sm btn-success w-100" onclick="startNavigation(${delivery.id})">
                    <i class="bi bi-map"></i> Yol Tarifi
                </button>
            </div>
        </div>
    `;
}

// Teslimat durum badge'i
function getStatusBadge(status) {
    const badges = {
        'new': '<span class="badge bg-primary">Yeni</span>',
        'confirmed': '<span class="badge bg-info">Onaylandı</span>', 
        'preparing': '<span class="badge bg-info">Hazırlanıyor</span>',
        'ready': '<span class="badge bg-primary">Hazır</span>',
        'delivering': '<span class="badge bg-warning">Yolda</span>',
        'delivered': '<span class="badge bg-success">Teslim Edildi</span>',
        'cancelled': '<span class="badge bg-danger">İptal</span>'
    };
    
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

// Özel marker ikonu oluştur
function createCustomMarker(status, text) {
    // Durum rengini belirle
    let color;
    switch(status) {
        case 'delivered': color = '#28a745'; break;
        case 'delivering': color = '#ffc107'; break;
        case 'ready': color = '#007bff'; break;
        default: color = '#6c757d';
    }
    
    // Özel HTML içeriği oluştur
    const html = `
        <div class="custom-marker" style="background-color: ${color}">
            <span>${text}</span>
        </div>
    `;
    
    // DivIcon olarak döndür
    return L.divIcon({
        className: '',
        html: html,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
}

// Harita merkezi ve zoom seviyesini belirle
function centerMapOnDeliveries(map, deliveries) {
    if (!deliveries || deliveries.length === 0) {
        // İstanbul'un merkezi
        map.setView([41.0082, 28.9784], 11);
        return;
    }
    
    // Koordinat listesi oluştur
    const points = [];
    deliveries.forEach(delivery => {
        if (delivery.lat && delivery.lng) {
            points.push([parseFloat(delivery.lat), parseFloat(delivery.lng)]);
        }
    });
    
    if (points.length === 0) {
        // İstanbul'un merkezi
        map.setView([41.0082, 28.9784], 11);
        return;
    }
    
    if (points.length === 1) {
        // Tek nokta varsa
        map.setView(points[0], 14);
        return;
    }
    
    // Tüm noktaları içine alan bir sınır oluştur
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50] });
}

// Kullanıcı konum izleme
function initLocationTracking(map, onLocationUpdate) {
    if (!navigator.geolocation) {
        console.log('Tarayıcı konum özelliğini desteklemiyor');
        document.getElementById('locationStatus').innerHTML = 
            '<i class="bi bi-exclamation-triangle text-warning"></i> Konum özelliği desteklenmiyor';
        return;
    }
    
    // Konum değişikliğini izle
    const watchId = navigator.geolocation.watchPosition(
        position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Callback fonksiyonu çağır
            if (typeof onLocationUpdate === 'function') {
                onLocationUpdate(position);
            }
        },
        error => {
            console.error('Konum izleme hatası:', error);
            document.getElementById('locationStatus').innerHTML = 
                '<i class="bi bi-x-circle text-danger"></i> Konum alınamadı';
                
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    showError('Konum izni reddedildi');
                    break;
                case error.POSITION_UNAVAILABLE:
                    showError('Konum bilgisi kullanılamıyor');
                    break;
                case error.TIMEOUT:
                    showError('Konum isteği zaman aşımına uğradı');
                    break;
                default:
                    showError('Konum izleme hatası');
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
        }
    );
    
    return watchId;
}

// Mesafe hesaplama (Haversine formülü)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // km cinsinden
    
    return distance;
}

// En yakın teslimatları bul
function findNearbyDeliveries(lat, lng, deliveries, maxDistance = 5) {
    if (!deliveries || !Array.isArray(deliveries)) return [];
    
    return deliveries.filter(delivery => {
        if (!delivery.lat || !delivery.lng) return false;
        
        const distance = calculateDistance(
            lat, lng,
            parseFloat(delivery.lat),
            parseFloat(delivery.lng)
        );
        
        delivery.distance = distance; // Mesafeyi ekle
        return distance <= maxDistance;
    }).sort((a, b) => a.distance - b.distance);
}

// Rotayı görüntüle
function showRoute(map, startLat, startLng, endLat, endLng) {
    // NOT: Bu fonksiyon bir rota servisi gerektiriyor (OSRM, GraphHopper vs.)
    // Bu örnek için basitleştirilmiş doğrusal bir rota çiziyoruz
    
    // Rota çizgisi
    const routePoints = [
        [startLat, startLng],
        [endLat, endLng]
    ];
    
    const routeLine = L.polyline(routePoints, {
        color: 'blue',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
        lineJoin: 'round'
    }).addTo(map);
    
    // Çizilen rotaya odaklan
    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
    
    return routeLine;
}

// Kümeleme özellikli marker'lar
function initClusteredMarkers(map, deliveries) {
    // Marker kümeleme grubu oluştur
    const markers = L.markerClusterGroup();
    
    // Her teslimat için marker ekle
    deliveries.forEach(delivery => {
        if (delivery.lat && delivery.lng) {
            const marker = createDeliveryMarker(delivery);
            marker.bindPopup(createMarkerPopup(delivery));
            markers.addLayer(marker);
        }
    });
    
    // Kümeleme grubunu haritaya ekle
    map.addLayer(markers);
    
    return markers;
}

// Geolocation API'yi destekliyor mu?
function isGeolocationSupported() {
    return 'geolocation' in navigator;
}

// Harita durumunu yerel depolamaya kaydet
function saveMapState(map) {
    if (!map) return;
    
    const center = map.getCenter();
    const zoom = map.getZoom();
    
    const state = {
        lat: center.lat,
        lng: center.lng,
        zoom: zoom,
        timestamp: new Date().getTime()
    };
    
    localStorage.setItem('deliveryMapState', JSON.stringify(state));
}

// Harita durumunu yerel depolamadan yükle
function loadMapState() {
    const stateJson = localStorage.getItem('deliveryMapState');
    if (!stateJson) return null;
    
    try {
        const state = JSON.parse(stateJson);
        
        // Son 24 saat içinde kaydedildiyse kullan
        const now = new Date().getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 saat
        
        if (now - state.timestamp < maxAge) {
            return {
                center: [state.lat, state.lng],
                zoom: state.zoom
            };
        }
        
        return null;
    } catch (error) {
        console.error('Harita durumu yüklenemedi:', error);
        return null;
    }
}