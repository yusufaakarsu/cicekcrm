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
        
        // Doğru API endpoint'ini kullan
        const order = await fetchAPI(`/orders/${orderId}/details`);
        
        if (!order) {
            throw new Error('Sipariş bulunamadı');
        }

        document.getElementById('orderDetail').innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Sipariş #${order.id}</h2>
                <a href="/orders" class="btn btn-outline-secondary">
                    <i class="bi bi-arrow-left"></i> Siparişlere Dön
                </a>
            </div>

            <div class="row">
                <div class="col-md-8">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Sipariş Detayları</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-sm-4">
                                    <strong>Müşteri</strong><br>
                                    ${order.customer_name}
                                </div>
                                <div class="col-sm-4">
                                    <strong>Telefon</strong><br>
                                    ${formatPhoneNumber(order.customer_phone)}
                                </div>
                                <div class="col-sm-4">
                                    <strong>Durum</strong><br>
                                    ${getStatusBadge(order.status)}
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-sm-4">
                                    <strong>Teslimat Tarihi</strong><br>
                                    ${formatDate(order.delivery_date)}
                                </div>
                                <div class="col-sm-4">
                                    <strong>Teslimat Saati</strong><br>
                                    ${formatDeliveryTime(order.delivery_time_slot)}
                                </div>
                                <div class="col-sm-4">
                                    <strong>Toplam Tutar</strong><br>
                                    ${formatCurrency(order.total_amount)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Teslimat Bilgileri</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-sm-6">
                                    <strong>Alıcı Adı</strong><br>
                                    ${order.recipient_name}
                                </div>
                                <div class="col-sm-6">
                                    <strong>Alıcı Telefon</strong><br>
                                    ${formatPhoneNumber(order.recipient_phone)}
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <strong>Teslimat Adresi</strong><br>
                                ${order.delivery_district}, ${order.delivery_street} No:${order.building_no}<br>
                                ${order.delivery_city}
                            </div>

                            ${order.recipient_note ? `
                                <div class="mb-3">
                                    <strong>Alıcı Notu</strong><br>
                                    ${order.recipient_note}
                                </div>
                            ` : ''}

                            ${order.card_message ? `
                                <div class="mb-3">
                                    <strong>Kart Mesajı</strong><br>
                                    ${order.card_message}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Ürünler</h5>
                        </div>
                        <div class="card-body">
                            ${order.items.split(',').map(item => `
                                <div class="d-flex justify-content-between mb-2">
                                    <span>${item}</span>
                                </div>
                            `).join('')}
                            <hr>
                            <div class="d-flex justify-content-between">
                                <strong>Toplam</strong>
                                <strong>${formatCurrency(order.total_amount)}</strong>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Ödeme Bilgileri</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-2">
                                <strong>Ödeme Yöntemi</strong><br>
                                ${order.payment_method_text}
                            </div>
                            <div class="mb-2">
                                <strong>Ödeme Durumu</strong><br>
                                ${order.payment_status === 'paid' ? 
                                    '<span class="badge bg-success">Ödendi</span>' : 
                                    '<span class="badge bg-warning">Bekliyor</span>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Sipariş detayı yüklenemedi:', error);
        showError('Sipariş detayları yüklenirken bir hata oluştu');
    }
}
