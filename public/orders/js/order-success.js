document.addEventListener('DOMContentLoaded', async () => {
    await loadSideBar();
    await loadOrderDetails();
});

async function loadOrderDetails() {
    try {
        // URL'den sipariş ID'sini al
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('id');
        
        if (!orderId) {
            throw new Error('Sipariş ID bulunamadı');
        }

        // Sipariş detaylarını yükle
        const order = await fetchAPI(`/orders/${orderId}/details`);
        
        // Sipariş ID'sini göster
        document.getElementById('orderId').textContent = `#${orderId}`;

        // Detayları göster
        document.getElementById('orderDetails').innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <p class="mb-1"><strong>Alıcı</strong></p>
                    <p class="mb-0">${order.recipient_name}</p>
                    <p class="mb-0">${formatPhoneNumber(order.recipient_phone)}</p>
                    ${order.recipient_alternative_phone ? 
                      `<p class="mb-0">${formatPhoneNumber(order.recipient_alternative_phone)}</p>` : ''}
                </div>
                <div class="col-md-6">
                    <p class="mb-1"><strong>Teslimat</strong></p>
                    <p class="mb-0">${formatDate(order.delivery_date)}</p>
                    <p class="mb-0">${formatTimeSlot(order.delivery_time_slot)}</p>
                    <p class="mb-0">${order.delivery_address}</p>
                </div>
                <div class="col-12">
                    <p class="mb-1"><strong>Ürünler</strong></p>
                    <p class="mb-0">${order.items}</p>
                </div>
                ${order.card_message ? `
                    <div class="col-12">
                        <p class="mb-1"><strong>Kart Mesajı</strong></p>
                        <p class="mb-0">${order.card_message}</p>
                    </div>
                ` : ''}
                <div class="col-md-6">
                    <p class="mb-1"><strong>Ödeme</strong></p>
                    <p class="mb-0">${formatCurrency(order.total_amount)}</p>
                    <p class="mb-0">${order.payment_method_text}</p>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Sipariş detayları yüklenirken hata:', error);
        showError('Sipariş detayları yüklenemedi');
    }
}

function formatTimeSlot(slot) {
    const slots = {
        'morning': 'Sabah (09:00-12:00)',
        'afternoon': 'Öğlen (12:00-17:00)',
        'evening': 'Akşam (17:00-21:00)'
    };
    return slots[slot] || slot;
}
