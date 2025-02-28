document.addEventListener('DOMContentLoaded', async () => {
    // Sidebar'ı yükle
    await loadSideBar();
    
    // İsteğe bağlı: Modül istatistiklerini yükle (hata halinde sessizce geçiş yaparak)
    try {
        await loadModuleStats();
    } catch (error) {
        console.log('Settings stats are not available (this is not an error)');
    }
});

// Modül istatistiklerini yükle (opsiyonel işlevsellik)
async function loadModuleStats() {
    try {
        const response = await fetchAPI('/settings/status');
        
        // API başarıyla cevap verdiyse istatistikleri göster
        if (response && response.success) {
            const status = response.status;
            console.log('System status loaded:', status);
            
            // İleride eklenebilecek durum göstergeleri için hazırlık
        }
    } catch (error) {
        console.log('Settings stats could not be loaded:', error);
        // Hata fırlatmadan sessizce devam et - bu kritik bir işlev değil
    }
}

// Ayar sayfasına yönlendirme yap
function navigateToSetting(page) {
    window.location.href = `${page}.html`;
}
