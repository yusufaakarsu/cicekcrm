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

// Siparişleri tabloya render et
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
                ${getPaymentStatusBadge(order.payment_status)}
            </td>
            <td>
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-gear"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li>
                            <button class="dropdown-item" onclick="showOrderDetails(${order.id})">
                                <i class="bi bi-eye"></i> Detay
                            </button>
                        </li>
                        
                        <!-- Durum Değiştirme -->
                        ${order.status !== 'delivered' && order.status !== 'cancelled' ? `
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <button class="dropdown-item" onclick="quickUpdateStatus(${order.id}, 'preparing')">
                                    <i class="bi bi-box-seam"></i> Hazırlanıyor
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item" onclick="quickUpdateStatus(${order.id}, 'ready')">
                                    <i class="bi bi-box"></i> Hazır
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item" onclick="quickUpdateStatus(${order.id}, 'delivering')">
                                    <i class="bi bi-truck"></i> Yolda
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item" onclick="quickUpdateStatus(${order.id}, 'delivered')">
                                    <i class="bi bi-check-circle"></i> Teslim Edildi
                                </button>
                            </li>
                            
                            <li><hr class="dropdown-divider"></li>
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