// Dashboard ilk yükleme
document.addEventListener('DOMContentLoaded', async () => {
    // Header'ı yükle
    await loadSideBar();
    
    // Header yüklendikten sonra içeriği doğru konumlandır
    document.querySelector('.ms-lg-200').style.marginLeft = '200px';
    
    await loadDashboardData();
    await loadRecentOrders();
});