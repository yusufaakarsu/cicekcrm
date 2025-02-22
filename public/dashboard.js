// Dashboard ilk yükleme
document.addEventListener('DOMContentLoaded', async () => {
    // Header'ı yükle
    await loadHeader();
    await loadDashboardData();
    await loadRecentOrders();
});