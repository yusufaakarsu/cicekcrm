document.addEventListener('DOMContentLoaded', async () => {
    // Sidebar'ı yükle
    await loadSideBar();
    
    // İsteğe bağlı: Modül istatistiklerini yükle
    loadModuleStats();
});

// Modül istatistiklerini yükle (opsiyonel işlevsellik)
async function loadModuleStats() {
    try {
        const response = await fetchAPI('/settings/stats');
        
        // API başarıyla cevap verdiyse istatistikleri göster
        if (response && response.success) {
            const stats = response.stats;
            
            // Eğer ayarlar sayfasına istatistik kartları eklemek isterseniz
            // burada DOM manipülasyonu yapabilirsiniz
            
            console.log('Settings module stats loaded:', stats);
        }
    } catch (error) {
        // İstatistikler kritik değil, sadece log'a kaydedelim
        console.log('Settings stats could not be loaded:', error);
    }
}

// Ayar sayfasına yönlendirme yap
function navigateToSetting(page) {
    window.location.href = `${page}.html`;
}
