document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadOrders();
});

async function loadOrders() {
    try {
        const orders = await fetchAPI('/orders');
        const tbody = document.getElementById('ordersList');
        
        if (!orders.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">Henüz sipariş bulunmuyor</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.recipient_name}</td>
                <td>${formatDate(order.delivery_date)}<br>
                    <small class="text-muted">${order.delivery_address}</small>
                </td>
                <td>${formatCurrency(order.total_amount)}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editOrder('${order.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Siparişler yüklenemedi:', error);
    }
}
