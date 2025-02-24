document.addEventListener('DOMContentLoaded', async () => {
    loadSideBar();
    await loadOrderDetails();
});

async function loadOrderDetails() {
    try {
        // URL'den sipariş ID'sini al
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get('id');

        if (!orderId) {
            throw new Error('Sipariş ID bulunamadı');
        }

        // Sipariş ID'sini göster
        document.getElementById('orderId').textContent = orderId;

        // Siparişi yükle
        const response = await fetchAPI(`/orders/${orderId}/details`);

        if (!response.success) {
            throw new Error(response.error || 'Sipariş yüklenemedi');
        }

        const order = response.order;

        // Sipariş detaylarını göster
        document.getElementById('orderDetail').innerHTML = `
            <div class="row">
                <!-- Müşteri & Alıcı Bilgileri -->
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Müşteri & Alıcı Bilgileri</h5>
                        </div>
                        <div class="card-body">
                            <h6>Müşteri</h6>
                            <p class="mb-3">
                                ${order.customer_name}<br>
                                <small class="text-muted">${formatPhoneNumber(order.customer_phone)}</small>
                            </p>
                            
                            <h6>Alıcı</h6>
                            <p class="mb-0">
                                ${order.recipient_name}<br>
                                <small class="text-muted">${formatPhoneNumber(order.recipient_phone)}</small>
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Teslimat Bilgileri -->
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Teslimat Bilgileri</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <strong>Teslimat Adresi:</strong><br>
                                ${order.delivery_address}<br>
                                ${order.district}
                                ${order.delivery_directions ? `<br><small class="text-muted">${order.delivery_directions}</small>` : ''}
                            </div>
                            
                            <div>
                                <strong>Teslimat Tarihi:</strong> ${formatDate(order.delivery_date)}<br>
                                <strong>Teslimat Saati:</strong> ${formatTimeSlot(order.delivery_time)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sipariş Kalemleri -->
            <div class="card mb-3">
                <div class="card-header">
                    <h5 class="card-title mb-0">Sipariş Detayları</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Ürün</th>
                                    <th class="text-end">Adet</th>
                                    <th class="text-end">Birim Fiyat</th>
                                    <th class="text-end">Toplam</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td>${item.product_name}</td>
                                        <td class="text-end">${item.quantity}</td>
                                        <td class="text-end">${formatCurrency(item.unit_price)}</td>
                                        <td class="text-end">${formatCurrency(item.total_amount)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3" class="text-end fw-bold">Ara Toplam:</td>
                                    <td class="text-end fw-bold">${formatCurrency(order.subtotal)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Notlar ve Mesajlar -->
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">Notlar & Mesajlar</h5>
                </div>
                <div class="card-body">
                    ${order.card_message ? `
                        <div class="mb-3">
                            <strong>Kart Mesajı:</strong><br>
                            ${order.card_message}
                        </div>
                    ` : ''}
                    
                    ${order.recipient_note ? `
                        <div>
                            <strong>Alıcı Notu:</strong><br>
                            ${order.recipient_note}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Sipariş detayı yükleme hatası:', error);
        document.getElementById('orderDetail').innerHTML = `
            <div class="alert alert-danger">
                Sipariş detayları yüklenirken hata oluştu: ${error.message}
            </div>
        `;
    }
}

// Zaman dilimi formatla
function formatTimeSlot(slot) {
    const slots = {
        'morning': 'Sabah (09:00-12:00)',
        'afternoon': 'Öğlen (12:00-17:00)',
        'evening': 'Akşam (17:00-21:00)'
    };
    return slots[slot] || slot;
}
