/**
 * Teslimat Navigasyon İşlevleri
 * Bu dosya, farklı harita uygulamalarına navigasyon linklerini yönetir
 */

// Google Maps'te navigasyon başlat
function openGoogleMapsNavigation(lat, lng, address = '') {
    if (!lat || !lng) {
        showError('Navigasyon için geçerli koordinatlar gerekli');
        return;
    }
    
    // URL'i oluştur
    let url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    
    // Adres varsa, URL'ye ekle (yedek olarak)
    if (address) {
        url += `&destination_place_id=${encodeURIComponent(address)}`;
    }
    
    // Yeni sekmede aç
    window.open(url, '_blank');
}

// Apple Maps'te navigasyon başlat
function openAppleMapsNavigation(lat, lng) {
    if (!lat || !lng) {
        showError('Navigasyon için geçerli koordinatlar gerekli');
        return;
    }
    
    // URL'i oluştur
    const url = `maps://maps.apple.com/?daddr=${lat},${lng}`;
    
    // Cihazı kontrol et
    const isIOS = /iPad|iPhone|iPod/.test(navigator.platform) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOS) {
        window.location.href = url; // Doğrudan açmayı dene
    } else {
        showInfo('Apple Maps, yalnızca iOS cihazlarında kullanılabilir');
        // Alternatif olarak Google Maps'i açalım
        openGoogleMapsNavigation(lat, lng);
    }
}

// Yandex Maps'te navigasyon başlat
function openYandexMapsNavigation(lat, lng) {
    if (!lat || !lng) {
        showError('Navigasyon için geçerli koordinatlar gerekli');
        return;
    }
    
    // URL'i oluştur
    // Not: Yandex Maps'te enlem ve boylamın sırası Google'dan farklıdır
    const url = `https://yandex.com/maps/?ll=${lng},${lat}&z=16&pt=${lng},${lat}`;
    
    // Mobil cihazlarda önce uygulamayı deneyip, olmazsa web tarayıcısını açma
    const mobileUrl = `yandexmaps://maps.yandex.com/?ll=${lng},${lat}&z=16&pt=${lng},${lat}`;
    
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // Önce uygulamayı açmaya çalış
        setTimeout(() => {
            window.location.href = url; // Uygulama yüklü değilse web sitesini aç
        }, 500);
        window.location.href = mobileUrl;
    } else {
        // Masaüstünde web sitesini aç
        window.open(url, '_blank');
    }
}

// Cihaz türüne göre navigasyon başlat
function startNavigation(deliveryId) {
    // Teslimat verisini bul
    const delivery = getDeliveryById(deliveryId);
    if (!delivery || !delivery.lat || !delivery.lng) {
        showError('Bu teslimat için konum bilgisi bulunamadı');
        return;
    }
    
    // Cihaz türünü tespit et
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // iOS için
    if (/iPad|iPhone|iPod/.test(userAgent)) {
        openAppleMapsNavigation(delivery.lat, delivery.lng);
        return;
    }
    
    // Android için
    if (/android/i.test(userAgent)) {
        openGoogleMapsNavigation(delivery.lat, delivery.lng, delivery.address);
        return;
    }
    
    // Diğer cihazlar için Google Maps (varsayılan)
    openGoogleMapsNavigation(delivery.lat, delivery.lng, delivery.address);
}

// Cihazın konum iznini kontrol et
async function checkLocationPermission() {
    if (!navigator.permissions) {
        return 'unknown'; // Permissions API desteklenmiyor
    }
    
    try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state; // 'granted', 'denied' veya 'prompt'
    } catch (error) {
        console.error('Konum izni kontrolü hatası:', error);
        return 'unknown';
    }
}

// Konum izni varsa konumu al
async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Tarayıcı konum özelliğini desteklemiyor'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            position => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            error => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000
            }
        );
    });
}

// Konum trafiği hesaplama
function getEstimatedTravelTime(lat1, lng1, lat2, lng2) {
    // Basit bir hesaplama: 1 km yaklaşık 2 dakika sürüyor varsayalım
    const distance = calculateDistance(lat1, lng1, lat2, lng2);
    const timeInMinutes = Math.ceil(distance * 2); // Dakika olarak
    
    return {
        distance: distance,
        time: timeInMinutes,
        formattedTime: formatTravelTime(timeInMinutes)
    };
}

// Seyahat süresini formatla
function formatTravelTime(minutes) {
    if (minutes < 60) {
        return `${minutes} dk`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours} sa ${remainingMinutes} dk`;
}

// Geolocation API'yi destekliyor mu?
function isGeolocationSupported() {
    return 'geolocation' in navigator;
}
