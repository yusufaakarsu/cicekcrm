/**
 * Sistem ayarları yönetimi için JavaScript 
 * Ayarları yükler, gösterir ve değişiklikleri kaydeder
 */

// Global değişkenler
let settingsData = {};
let changedSettings = new Set();

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    await loadSideBar();
    await loadSettings();
    setupEventListeners();
});

// Event listener'ları kur
function setupEventListeners() {
    // Tüm ayar inputları için change event listener ekle
    const allInputs = document.querySelectorAll('input');
    allInputs.forEach(input => {
        input.addEventListener('change', () => {
            settingChanged(input.id);
        });
    });

    // Kaydetme butonuna tıklama işlemi
    document.getElementById('saveAllSettings').addEventListener('click', saveSettings);
}

// Ayarları API'den yükle
async function loadSettings() {
    try {
        showLoading();
        const response = await fetchAPI('/settings/all');
        hideLoading();

        if (response.success) {
            settingsData = response.settings.reduce((obj, item) => {
                obj[item.setting_key] = item.setting_value;
                return obj;
            }, {});

            // Form alanlarını güncel değerlerle doldur
            populateFormFields();
        } else {
            showError('Ayarlar yüklenemedi: ' + response.error);
        }
    } catch (error) {
        hideLoading();
        showError('Ayarlar yüklenirken hata oluştu: ' + error.message);
    }
}

// Form alanlarını ayarlarla doldur
function populateFormFields() {
    for (const [key, value] of Object.entries(settingsData)) {
        const input = document.getElementById(key);
        if (input) {
            // Eğer input bir sayı alanıysa, number olarak ayarla
            if (input.type === 'number') {
                input.value = parseFloat(value);
            } else {
                input.value = value;
            }
        }
    }
}

// Bir ayar değiştiğinde çağrılır
function settingChanged(settingKey) {
    changedSettings.add(settingKey);
    
    // Değişikliğin olduğunu göstermek için kaydetme butonunu vurgula
    const saveButton = document.getElementById('saveAllSettings');
    saveButton.classList.add('btn-success');
    saveButton.classList.remove('btn-primary');
    saveButton.innerHTML = '<i class="bi bi-save"></i> Değişiklikleri Kaydet';
}

// Değişen ayarları kaydet
async function saveSettings() {
    // Değişiklik yoksa hiçbir şey yapma
    if (changedSettings.size === 0) {
        showError('Herhangi bir değişiklik yapılmadı.');
        return;
    }

    try {
        showLoading();
        
        // Değiştirilen ayarları topla
        const updateData = Array.from(changedSettings).map(key => {
            const input = document.getElementById(key);
            return {
                setting_key: key,
                setting_value: input.value
            };
        });
        
        // Değişiklikleri API'ye gönder
        const response = await fetchAPI('/settings/update', {
            method: 'POST',
            body: JSON.stringify({
                settings: updateData
            })
        });
        
        hideLoading();
        
        if (response.success) {
            showSuccess('Ayarlar başarıyla güncellendi.');
            
            // Kaydet butonu stilini sıfırla
            const saveButton = document.getElementById('saveAllSettings');
            saveButton.classList.remove('btn-success');
            saveButton.classList.add('btn-primary');
            saveButton.innerHTML = '<i class="bi bi-save"></i> Tüm Değişiklikleri Kaydet';
            
            // Değişen ayarları sıfırla
            changedSettings.clear();
            
            // Güncel ayarları tekrar yükle
            await loadSettings();
        } else {
            showError('Ayarlar kaydedilemedi: ' + response.error);
        }
    } catch (error) {
        hideLoading();
        showError('Ayarlar kaydedilirken hata oluştu: ' + error.message);
    }
}

// Yeni ayar eklemek için bir modal göster
function showAddSettingModal() {
    // Burada yeni ayar eklemek için bir modal gösterebilirsiniz
}
