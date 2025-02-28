document.addEventListener('DOMContentLoaded', () => {
    console.log('Siparişler sayfası yükleniyor...');
    initializePage();
    
    // API URL'i debug etmek için kontrol et
    console.log('API_URL:', API_URL);
    
    // Test API çağrısı yap
    testApiConnection();
});

// API bağlantısını test et
function testApiConnection() {
    console.log('API bağlantısı test ediliyor...');
    fetch(`${API_URL}/orders`)
        .then(res => {
            console.log('API yanıt status:', res.status);
            return res.json();
        })
        .then(data => {
            console.log('API test yanıtı:', data);
        })
        .catch(err => {
            console.error('API test hatası:', err);
        });
}

// Sayfa başlangıç durumu
function initializePage() {
    // Hidden inputları ekle
    addHiddenInputs();
    
    // Header'ı yükle
    loadSideBar();
    
    // Filtre dinleyicilerini ayarla
    setupFilterListeners();
    
    // Varsayılan filtreleri ayarla ve siparişleri yükle
    resetToDefaultFilters();
}

// Hidden inputları ekle
function addHiddenInputs() {
    // Page input
    if (!document.querySelector('[name="page"]')) {
        const pageInput = document.createElement('input');
        pageInput.type = 'hidden';
        pageInput.name = 'page';
        pageInput.value = '1';
        document.body.appendChild(pageInput);
    }

    // Per page input
    if (!document.querySelector('[name="per_page"]')) {
        const perPageInput = document.createElement('input');
        perPageInput.type = 'hidden';
        perPageInput.name = 'per_page';
        perPageInput.value = '10';
        document.body.appendChild(perPageInput);
    }
}

// Varsayılan filtrelere dön
function resetToDefaultFilters() {
    // Filtreleri varsayılan değerlere ayarla
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFilter').value = 'today';
    document.getElementById('sortFilter').value = 'id_desc';
    document.getElementById('customDateRange').style.display = 'none';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.querySelector('[name="page"]').value = '1';

    // Siparişleri yükle
    loadOrders(true); // true = ilk yükleme
}

// Filtre dinleyicilerini ayarla
function setupFilterListeners() {
    // Durum filtresi
    document.getElementById('statusFilter').addEventListener('change', () => {
        document.querySelector('[name="page"]').value = '1';
        loadOrders();
    });
    
    // Tarih filtresi
    document.getElementById('dateFilter').addEventListener('change', (e) => {
        const customDateRange = document.getElementById('customDateRange');
        const isCustomDate = e.target.value === 'custom';
        customDateRange.style.display = isCustomDate ? 'block' : 'none';
        
        // Eğer özel tarih değilse hemen yükle
        if (!isCustomDate) {
            document.querySelector('[name="page"]').value = '1';
            loadOrders();
        }
    });
    
    // Özel tarih aralığı butonu
    document.getElementById('applyDateFilter').addEventListener('click', () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            showError('Lütfen tarih aralığı seçin');
            return;
        }
        
        document.querySelector('[name="page"]').value = '1';
        loadOrders();
    });
    
    // Sıralama
    document.getElementById('sortFilter').addEventListener('change', () => {
        document.querySelector('[name="page"]').value = '1';
        loadOrders();
    });
}

// Filtreleri sıfırla
function resetFilters() {
    resetToDefaultFilters();
}

// Temel veri yükleme fonksiyonu - basitleştirildi
async function loadOrders(isInitialLoad = false) {
    try {
        console.log('Siparişler yükleniyor...');
        
        // Basit URL kullan
        const url = `${API_URL}/orders`;
        console.log('API çağrısı URL:', url);
        
        const response = await fetch(url);
        console.log('API yanıt status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error('API Error: ' + response.status);
        }
        
        const data = await response.json();
        console.log('API yanıtı:', data);
        
        // Yanıt başarılıysa, siparişleri render et
        if (data && data.success && data.orders) {
            renderOrders(data.orders);
        } else {
            console.error('API yanıtında orders verisi bulunamadı');
            document.getElementById('ordersTable').innerHTML = 
                '<tr><td colspan="9" class="text-center">Sipariş verisi alınamadı.</td></tr>';
        }
    } catch (error) {
        console.error('Sipariş yükleme hatası:', error);
        showError('Siparişler yüklenemedi: ' + error.message);
    }
}

// Siparişleri tabloya render et - ödeme bilgilerini ekle
function renderOrders(orders) {
    const tbody = document.getElementById('ordersTable');
    
    if (!orders.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">Sipariş bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => {
        // Alternatif alan adlarını kontrol et
        const deliveryTime = order.delivery_time || order.delivery_time_slot || '';
        const items = order.items_summary || order.items || '';
        const totalAmount = order.total_amount || 0;
        const paidAmount = order.paid_amount || 0;
        const remainingAmount = totalAmount - paidAmount;
        
        // İptal durumundaysa ödeme durumunu iptal göster
        const paymentStatus = order.status === 'cancelled' ? 'cancelled' : order.payment_status;

        return `
        <tr>
            <td>#${order.id}</td>
            <td>${formatDate(order.created_at)}</td>
            <td>
                <div>${order.customer_name || '-'}</div>
                <small class="text-muted">${formatPhoneNumber(order.customer_phone) || ''}</small>
            </td>
            <td>
                ${formatDate(order.delivery_date)}<br>
                <small class="text-muted">${formatTimeSlot(deliveryTime)}</small>
            </td>
            <td>
                <div>${order.recipient_name || '-'}</div>
                <small class="text-muted">${formatPhoneNumber(order.recipient_phone) || ''}</small>
                ${order.card_message ? `<small class="d-block text-info">"${order.card_message}"</small>` : ''}
            </td>
            <td class="text-wrap" style="max-width:200px;">
                ${typeof items === 'string' ? items.split(',').map(item => 
                    `<div class="small">${item.trim()}</div>`
                ).join('') : '-'}
            </td>
            <td>${getStatusBadge(order.status)}</td>
            <td>
                <div class="fw-bold">${formatCurrency(totalAmount)}</div>
                ${getPaymentStatusBadge(paymentStatus)}
                
                ${paidAmount > 0 && paymentStatus !== 'cancelled' ? `
                    <div class="mt-1 small">
                        <span class="text-success">Ödenen: ${formatCurrency(paidAmount)}</span>
                        ${remainingAmount > 0 ? `
                            <br><span class="text-danger">Kalan: ${formatCurrency(remainingAmount)}</span>
                        ` : ''}
                    </div>
                ` : ''}
            </td>
            <td>
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-gear"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <!-- Sipariş detayları -->
                        <li>
                            <button class="dropdown-item" onclick="showOrderDetails(${order.id})">
                                <i class="bi bi-eye"></i> Detay
                            </button>
                        </li>
                        
                        <!-- Sadece ödeme ve iptal işlemleri olacak -->
                        <li><hr class="dropdown-divider"></li>
                        
                        <!-- Ödeme Alma -->
                        ${paymentStatus !== 'paid' && paymentStatus !== 'cancelled' ? `
                            <li>
                                <button class="dropdown-item" onclick="showPaymentModal(${order.id}, ${totalAmount})">
                                    <i class="bi bi-cash-coin"></i> Ödeme Al
                                </button>
                            </li>
                        ` : ''}
                        
                        <!-- İptal İşlemi -->
                        ${order.status !== 'delivered' && order.status !== 'cancelled' ? `
                            <li>
                                <button class="dropdown-item text-danger" onclick="confirmCancelOrder(${order.id})">
                                    <i class="bi bi-x-circle"></i> İptal Et
                                </button>
                            </li>
                        ` : ''}
                    </ul>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

// Global değişken tanımı
let currentOrderId = null;

// Sipariş detaylarını göster
async function showOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/details`);
        
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        console.log('Sipariş detay verileri:', data);
        
        if (!data.success) {
            throw new Error(data.error || 'Veri alınamadı');
        }
        
        const order = data.order;
        const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
        
        // Global değişkene kaydet
        currentOrderId = order.id;
        
        // Teslimatı Geri Al butonunu göster/gizle
        const revertBtn = document.getElementById('revertDeliveryBtn');
        revertBtn.classList.toggle('d-none', order.status !== 'delivering' && order.status !== 'delivered');
        
        // Buton metnini duruma göre güncelle
        if (order.status === 'delivering') {
            revertBtn.innerHTML = '<i class="bi bi-arrow-counterclockwise"></i> Teslimatı Geri Al';
        } else if (order.status === 'delivered') {
            revertBtn.innerHTML = '<i class="bi bi-arrow-counterclockwise"></i> Teslimattan Geri Al';
        }
        
        // Modal içeriğini doldur
        fillOrderDetails(order);
        
        modal.show();
    } catch (error) {
        console.error('Sipariş detayları yüklenirken hata:', error);
        showError('Sipariş detayları yüklenemedi!');
    }
}

// Modal içeriğini doldur
function fillOrderDetails(order) {
    // Header bilgileri
    document.getElementById('order-detail-id').textContent = order.id;
    document.getElementById('order-detail-created_at').textContent = `Oluşturulma: ${formatDate(order.created_at)}`;
    
    // Durum kartı
    document.getElementById('order-detail-status').innerHTML = getStatusBadge(order.status);
    document.getElementById('order-detail-payment_status').innerHTML = getPaymentStatusBadge(order.payment_status);
    document.getElementById('order-detail-total_amount').textContent = formatCurrency(order.total_amount);
    
    // Müşteri bilgileri
    document.getElementById('order-detail-customer_name').textContent = order.customer_name || '-';
    document.getElementById('order-detail-customer_phone').textContent = formatPhoneNumber(order.customer_phone) || '-';
    
    // Teslimat bilgileri
    document.getElementById('order-detail-delivery_date').textContent = formatDate(order.delivery_date) + ' ' + formatTimeSlot(order.delivery_time || order.delivery_time_slot) || '-';
    document.getElementById('order-detail-delivery_address').textContent = order.delivery_address || '-';
    
    // Alıcı bilgileri
    document.getElementById('order-detail-recipient_name').textContent = order.recipient_name || '-';
    document.getElementById('order-detail-recipient_phone').textContent = formatPhoneNumber(order.recipient_phone) || '-';
    document.getElementById('order-detail-recipient_note').textContent = order.recipient_note || '-';
    document.getElementById('order-detail-card_message').textContent = order.card_message || '-';
    
    // Ürün listesi
    const itemsList = document.getElementById('order-detail-items');
    if (order.items && typeof order.items === 'string') {
        // String ise virgülle ayrılmış ürün listesi
        itemsList.innerHTML = order.items.split(',').map(item => `
            <div class="list-group-item px-0">
                <div class="d-flex justify-content-between align-items-center">
                    <span>${item.trim()}</span>
                </div>
            </div>
        `).join('');
    } else if (order.items && Array.isArray(order.items)) {
        // Array ise detaylı ürün bilgisi
        let itemsHtml = '';
        let total = 0;
        
        order.items.forEach(item => {
            const itemTotal = item.quantity * item.unit_price;
            total += itemTotal;
            
            itemsHtml += `
                <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div>
                        <div class="fw-bold">${item.product_name}</div>
                        <div class="small">${item.quantity} x ${formatCurrency(item.unit_price)}</div>
                    </div>
                    <div class="fw-bold">${formatCurrency(itemTotal)}</div>
                </div>
            `;
        });
        
        // Toplam satırı
        itemsHtml += `
            <div class="d-flex justify-content-between align-items-center pt-2">
                <div class="fw-bold">Toplam</div>
                <div class="fw-bold">${formatCurrency(total)}</div>
            </div>
        `;
        
        itemsList.innerHTML = itemsHtml;
    } else {
        itemsList.innerHTML = '<div class="list-group-item px-0 text-muted">Ürün bilgisi bulunamadı</div>';
    }
}

// Hızlı durum güncelleme
async function quickUpdateStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('API Hatası');

        // Toast mesajı göster
        showSuccess(`Sipariş durumu güncellendi: ${getStatusText(newStatus)}`);

        // Tabloyu yenile
        await loadOrders();
    } catch (error) {
        console.error('Durum güncellenirken hata:', error);
        showError('Durum güncellenemedi!');
    }
}

// İptal onayı
function confirmCancelOrder(orderId) {
    if (confirm('Bu siparişi iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
        cancelOrder(orderId);
    }
}

// Sipariş iptal
async function cancelOrder(orderId) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
            method: 'PUT'
        });

        if (!response.ok) throw new Error('API Hatası');

        showSuccess('Sipariş iptal edildi');
        await loadOrders(); // Tabloyu yenile
    } catch (error) {
        console.error('Sipariş iptal edilirken hata:', error);
        showError('Sipariş iptal edilemedi!');
    }
}

// Teslimatı geri al
async function revertDeliveryStatus() {
    if (!currentOrderId) return;
    
    try {
        const response = await fetch(`${API_URL}/orders/${currentOrderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'ready' })
        });

        if (!response.ok) throw new Error('API Hatası');

        // Toast mesajı göster
        showSuccess('Sipariş durumu "Hazır" olarak güncellendi');
        
        // Modalı kapat ve tabloyu yenile
        bootstrap.Modal.getInstance(document.getElementById('orderDetailModal')).hide();
        await loadOrders();
    } catch (error) {
        console.error('Durum güncellenirken hata:', error);
        showError('Durum güncellenemedi!');
    }
}

// Ödeme modalı göster - daha detaylı hale getirildi
function showPaymentModal(orderId, totalAmount) {
    try {
        // Önce siparişin güncel detaylarını API'den al (ödenen tutarı doğru göstermek için)
        fetch(`${API_URL}/orders/${orderId}/details`)
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    throw new Error('API Hatası');
                }

                const order = data.order;
                const paidAmount = parseFloat(order.paid_amount || 0);
                const remainingAmount = parseFloat(order.total_amount) - paidAmount;
                
                // Modal HTML dinamik olarak oluştur
                const modalHTML = `
                    <div class="modal fade" id="paymentModal" tabindex="-1" aria-labelledby="paymentModalLabel" aria-hidden="true">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="paymentModalLabel">Sipariş #${orderId} - Ödeme Al</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
                                </div>
                                <div class="modal-body">
                                    <form id="paymentForm">
                                        <!-- Ödeme özeti bilgileri -->
                                        <div class="card mb-3">
                                            <div class="card-body bg-light">
                                                <div class="row">
                                                    <div class="col-6">
                                                        <p class="mb-1"><strong>Toplam Tutar:</strong></p>
                                                        <h5 class="mb-0">${formatCurrency(order.total_amount)}</h5>
                                                    </div>
                                                    <div class="col-6">
                                                        <p class="mb-1"><strong>Ödenen Tutar:</strong></p>
                                                        <h5 class="mb-0 ${paidAmount > 0 ? 'text-success' : ''}">${formatCurrency(paidAmount)}</h5>
                                                    </div>
                                                </div>
                                                <hr>
                                                <div class="row">
                                                    <div class="col-12">
                                                        <p class="mb-1"><strong>Kalan Tutar:</strong></p>
                                                        <h5 class="mb-0 text-primary">${formatCurrency(remainingAmount)}</h5>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="paymentAmount" class="form-label">Ödeme Tutarı</label>
                                            <div class="input-group">
                                                <input type="text" class="form-control" id="paymentAmount" name="amount" value="${remainingAmount.toFixed(2)}">
                                                <span class="input-group-text">₺</span>
                                            </div>
                                            <div class="form-text">Maksimum: ${formatCurrency(remainingAmount)}</div>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="accountId" class="form-label">Hesap</label>
                                            <select class="form-select" id="accountId" name="account_id">
                                                <option value="1">Ana Kasa</option>
                                                <option value="2">Kredi Kartı POS</option>
                                                <option value="3">Banka</option>
                                            </select>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="paymentMethod" class="form-label">Ödeme Yöntemi</label>
                                            <select class="form-select" id="paymentMethod" name="payment_method">
                                                <option value="cash">Nakit</option>
                                                <option value="credit_card">Kredi Kartı</option>
                                                <option value="bank_transfer">Havale/EFT</option>
                                            </select>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="paymentNote" class="form-label">Not</label>
                                            <textarea class="form-control" id="paymentNote" name="notes" rows="2"></textarea>
                                        </div>
                                    </form>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                                    <button type="button" class="btn btn-primary" onclick="processPayment(${orderId}, ${remainingAmount})">
                                        Ödemeyi Kaydet
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Eğer varsa eski modalı temizle
                const oldModal = document.getElementById('paymentModal');
                if (oldModal) oldModal.remove();
                
                // Yeni modalı ekle ve göster
                document.body.insertAdjacentHTML('beforeend', modalHTML);
                const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
                paymentModal.show();
            })
            .catch(error => {
                console.error('Sipariş detayları yüklenirken hata:', error);
                showError('Sipariş detayları yüklenemedi');
            });
    } catch (error) {
        console.error('Ödeme modalı oluşturma hatası:', error);
        showError('Ödeme modalı oluşturulamadı');
    }
}

// Ödeme işlemi - geliştirildi
async function processPayment(orderId, maxAmount) {
    try {
        // Form verilerini al ve doğrula
        const form = document.getElementById('paymentForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Form verilerini topla
        const formData = new FormData(form);
        const amount = parseFloat(formData.get('amount').replace(/\./g, '').replace(',', '.'));
        const paymentMethod = formData.get('payment_method');
        const accountId = parseInt(formData.get('account_id'));
        const notes = formData.get('notes');
        
        // Validasyonlar
        if (isNaN(amount) || amount <= 0) {
            showError('Lütfen geçerli bir ödeme tutarı girin');
            return;
        }
        
        if (amount > maxAmount) {
            showError(`Ödeme tutarı kalan tutardan (${formatCurrency(maxAmount)}) fazla olamaz`);
            return;
        }
        
        // API isteği gönder
        const response = await fetch(`${API_URL}/orders/${orderId}/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount,
                payment_method: paymentMethod,
                account_id: accountId,
                notes
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ödeme işlemi başarısız');
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Modal kapat
            const modal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
            modal.hide();
            
            // Başarı mesajı göster
            showSuccess('Ödeme başarıyla kaydedildi');
            
            // Listeyi yenile
            loadOrders();
        } else {
            throw new Error(result.error || 'Ödeme işlemi başarısız');
        }
        
    } catch (error) {
        console.error('Ödeme işlemi hatası:', error);
        showError('Ödeme kaydedilemedi: ' + error.message);
    }
}

// Helper fonksiyonlar
function getStatusBadge(status) {
    const statusMap = {
        'new': '<span class="badge status-new">Yeni</span>',
        'confirmed': '<span class="badge status-confirmed">Onaylandı</span>',
        'preparing': '<span class="badge status-preparing">Hazırlanıyor</span>',
        'ready': '<span class="badge status-ready">Hazır</span>',
        'delivering': '<span class="badge status-delivering">Yolda</span>',
        'delivered': '<span class="badge status-delivered">Teslim Edildi</span>',
        'cancelled': '<span class="badge status-cancelled">İptal</span>'
    };
    return statusMap[status] || `<span class="badge bg-secondary">${status || 'Belirsiz'}</span>`;
}

function getStatusText(status) {
    const statusMap = {
        'new': 'Yeni',
        'confirmed': 'Onaylandı',
        'preparing': 'Hazırlanıyor',
        'ready': 'Hazır',
        'delivering': 'Yolda',
        'delivered': 'Teslim Edildi',
        'cancelled': 'İptal'
    };
    return statusMap[status] || status;
}

function getPaymentStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge payment-pending">Bekliyor</span>',
        'partial': '<span class="badge payment-partial">Kısmi</span>',
        'paid': '<span class="badge payment-paid">Ödendi</span>',
        'cancelled': '<span class="badge payment-cancelled">İptal</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status || ''}</span>`;
}

function getPaymentStatusClass(status) {
    const classes = {
        'pending': 'payment-pending',
        'partial': 'payment-partial',
        'paid': 'payment-paid',
        'cancelled': 'payment-cancelled'
    };
    return classes[status] || 'bg-secondary';
}

function getPaymentStatusText(status) {
    const texts = {
        'pending': 'Bekliyor',
        'partial': 'Kısmi Ödeme',
        'paid': 'Ödendi',
        'cancelled': 'İptal'
    };
    return texts[status] || status || 'Belirsiz';
}

function formatPaymentMethod(method) {
    const methods = {
        'cash': 'Nakit',
        'credit_card': 'Kredi Kartı',
        'bank_transfer': 'Banka Havalesi',
        'online': 'Online Ödeme'
    };
    return methods[method] || method;
}

function formatTimeSlot(slot) {
    if (!slot) return 'Belirtilmemiş';
    
    const slots = {
        'morning': 'Sabah (09:00-12:00)',
        'afternoon': 'Öğlen (12:00-17:00)',
        'evening': 'Akşam (17:00-21:00)'
    };
    return slots[slot] || slot;
}