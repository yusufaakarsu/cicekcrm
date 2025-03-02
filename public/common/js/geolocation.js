/**
 * Konum Takip Servisi
 * Kullanıcı konumunu takip eden ve harita üzerinde gösteren işlevler
 */

let watchId = null;
let lastKnownLocation = null;

// Konum izlemeyi başlat
function initLocationTracking(map, callback) {
    if (!navigator.geolocation) {
        console.error("Tarayıcınız konum özelliğini desteklemiyor.");
        return false;
    }
    
    // Konum izleme seçenekleri
    const options = {
        enableHighAccuracy: true, // Yüksek doğruluk
        timeout: 10000,          // 10 saniye zaman aşımı
        maximumAge: 30000        // 30 saniyelik eski konum kabul edilebilir
    };
    
    // Konum değişikliklerini izle
    watchId = navigator.geolocation.watchPosition(
        // Başarılı konum alındığında
        (position) => {
            // Konum bilgilerini al
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            
            // Son konumu sakla
            lastKnownLocation = { lat: latitude, lng: longitude, accuracy: accuracy };
            
            // Callback fonksiyonu varsa çağır
            if (typeof callback === 'function') {
                callback(position);
            }
        },
        // Hata durumunda
        (error) => {
            let errorMessage = '';
            
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Konum erişim izni reddedildi.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Konum bilgisi kullanılamıyor.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Konum isteği zaman aşımına uğradı.';
                    break;
                default:
                    errorMessage = 'Bilinmeyen bir konum hatası oluştu.';
            }
            
            console.error(`Konum hatası: ${errorMessage}`);
        },
        options
    );
    
    return watchId;
}

// Konum izlemeyi durdur
function stopLocationTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        return true;
    }
    
    return false;
}

// Tek seferlik konum al
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Tarayıcınız konum özelliğini desteklemiyor."));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                
                lastKnownLocation = { lat: latitude, lng: longitude, accuracy: accuracy };
                resolve(position);
            },
            (error) => {
                let errorMessage = '';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Konum erişim izni reddedildi.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Konum bilgisi kullanılamıyor.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Konum isteği zaman aşımına uğradı.';
                        break;
                    default:
                        errorMessage = 'Bilinmeyen bir konum hatası oluştu.';
                }
                
                reject(new Error(errorMessage));
            }
        );
    });
}

// Son bilinen konumu al
function getLastKnownLocation() {
    return lastKnownLocation;
}

// Konum izni durumunu kontrol et
function checkLocationPermission() {
    return new Promise((resolve) => {
        if (!navigator.permissions || !navigator.permissions.query) {
            // Permissions API desteklenmiyorsa, geolocation'ı deneyerek kontrol et
            navigator.geolocation.getCurrentPosition(
                () => resolve('granted'),
                (error) => {
                    if (error.code === error.PERMISSION_DENIED) {
                        resolve('denied');
                    } else {
                        resolve('prompt');
                    }
                }
            );
            return;
        }
        
        navigator.permissions.query({ name: 'geolocation' })
            .then((permissionStatus) => {
                resolve(permissionStatus.state);
            })
            .catch(() => {
                resolve('prompt');
            });
    });
}

// Konum izni iste (UI etkileşimi gerektirir)
function requestLocationPermission() {
    return getCurrentPosition()
        .then(() => true)
        .catch(() => false);
}
