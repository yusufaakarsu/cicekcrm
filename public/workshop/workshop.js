let currentFilter = 'new';

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    filterByStatus('new');
    setupEventListeners();
});

function setupEventListeners() {
    // Filter ve refresh butonları
    document.getElementById('dateFilter').addEventListener('change', () => loadOrders(currentFilter));
    document.getElementById('timeSlotFilter').addEventListener('change', () => loadOrders(currentFilter));
    document.getElementById('refreshButton').addEventListener('click', () => loadOrders(currentFilter));

    // Status kartları
    document.querySelectorAll('.status-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const status = e.currentTarget.dataset.status;
            filterByStatus(status);
        });
    });
}

async function loadOrders(status = 'new') {
    try {
        // API'den siparişleri yükle
        const params = new URLSearchParams({
            date_filter: document.getElementById('dateFilter').value || 'today',
            time_slot: document.getElementById('timeSlotFilter').value || ''
        });

        const response = await fetchAPI(`/workshop?${params}`);
        if (!response.success) throw new Error(response.error);

        const orders = response.orders || [];
        updateOrdersList(orders.filter(o => o.status === status));
        updateCountBadges(orders);

    } catch (error) {
        console.error('Orders loading error:', error);
        showError(error.message);
    }
}

async function startPreparation(orderId) {
    try {
        const result = await fetchAPI(`/workshop/${orderId}/start`, {
            method: 'POST'
        });

        if (result.success) {
            showSuccess('Hazırlama başlatıldı');
            loadOrders(currentFilter);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showError('Hazırlama başlatılamadı: ' + error.message);
    }
}

async function completePreparation(orderId) {
    try {
        // Malzeme listesini topla
        const materials = [];
        document.querySelectorAll('.used-quantity').forEach(input => {
            materials.push({
                material_id: Number(input.dataset.materialId),
                quantity: Number(input.value)
            });
        });

        // API'ye gönder
        const result = await fetchAPI(`/workshop/${orderId}/complete`, {
            method: 'POST',
            body: JSON.stringify({ materials })
        });

        if (result.success) {
            showSuccess('Hazırlama tamamlandı');
            loadOrders(currentFilter);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showError('Hazırlama tamamlanamadı: ' + error.message);
    }
}
