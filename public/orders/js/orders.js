document.addEventListener('DOMContentLoaded', () => {
    initializePage();
});

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

// Temel veri yükleme fonksiyonu güncellendi
async function loadOrders(isInitialLoad = false) {
    try {
        const params = new URLSearchParams({
            page: document.querySelector('[name="page"]').value,
            per_page: document.querySelector('[name="per_page"]').value,
            sort: document.getElementById('sortFilter').value
        });

        // Durum filtresi
        const status = document.getElementById('statusFilter').value;
        if (status) {
            params.append('status', status);
        }

        // Tarih filtresi - düzeltildi
        const dateFilter = document.getElementById('dateFilter').value;
        if (dateFilter && dateFilter !== 'all') {
            params.append('date_filter', dateFilter);
            
            if (dateFilter === 'custom') {
                const startDate = document.getElementById('startDate').value;
                const endDate = document.getElementById('endDate').value;
                
                if (startDate && endDate) {
                    // Tarihleri doğru formatta gönder
                    params.append('start_date', startDate);
                    params.append('end_date', endDate);
                }
            }
        }

        // URL yapısını düzelt ve debug log ekle
        const url = getApiUrl('/orders/filtered') + '?' + params.toString();
        console.log('Loading orders from:', url);

        const response = await fetch(url);
        
        // Response içeriğini kontrol et
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error('API Error: ' + response.status);
        }

        const data = await response.json();
        console.log('API Response:', data); // Debug için

        if (!data.success) {
            throw new Error(data.error || 'API Error');
        }

        renderOrders(data.orders || []);
        updatePagination(data);

    } catch (error) {
        console.error('Orders error:', error);
        showError('Siparişler yüklenemedi: ' + error.message);
    }
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

// Siparişleri tabloya render et
function renderOrders(orders) {
    const tbody = document.getElementById('ordersTable');
    
    if (!orders.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">Sipariş bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${formatDate(order.created_at)}</td>
            <td>
                <div>${order.customer_name || '-'}</div>
                <small class="text-muted">${formatPhoneNumber(order.customer_phone) || ''}</small>
            </td>
            <td>
                ${formatDate(order.delivery_date)}<br>
                <small class="text-muted">${formatTimeSlot(order.delivery_time_slot)}</small>
            </td>
            <td>
                <div>${order.recipient_name}</div>
                <small class="text-muted">${formatPhoneNumber(order.recipient_phone)}</small>
                ${order.card_message ? `<small class="d-block text-info">"${order.card_message}"</small>` : ''}
            </td>
            <td class="text-wrap" style="max-width:200px;">
                ${order.items ? order.items.split(',').map(item => 
                    `<div class="small">${item.trim()}</div>`
                ).join('') : '-'}
            </td>
            <td>${getStatusBadge(order.status)}</td>
            <td>
                <div class="fw-bold">${formatCurrency(order.total_amount)}</div>
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
                        
                        <li><hr class="dropdown-divider"></li>
                        
                        <!-- Hızlı Durum Değiştirme -->
                        ${order.status !== 'delivered' && order.status !== 'cancelled' ? `
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
                        ` : ''}
                        
                        <!-- Düzenleme ve İptal -->
                        <li>
                            <button class="dropdown-item" onclick="editOrder(${order.id})">
                                <i class="bi bi-pencil"></i> Düzenle
                            </button>
                        </li>
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
    `).join('');
}

// Global değişken tanımı ekle
let currentOrderId = null;

// Sipariş detaylarını göster
async function showOrderDetails(orderId) {
    try {
        const response = await fetch(getApiUrl(`/orders/${orderId}/details`));
        if (!response.ok) throw new Error('API Hatası');
        
        const order = await response.json();
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
    document.getElementById('order-detail-payment_method').textContent = formatPaymentMethod(order.payment_method) || '-';
    
    // Teslimat bilgileri
    document.getElementById('order-detail-delivery_date').textContent = formatDate(order.delivery_date) || '-';
    document.getElementById('order-detail-delivery_address').textContent = order.delivery_address || '-';
    
    // Alıcı bilgileri
    document.getElementById('order-detail-recipient_name').textContent = order.recipient_name || '-';
    document.getElementById('order-detail-recipient_phone').textContent = formatPhoneNumber(order.recipient_phone) || '-';
    document.getElementById('order-detail-recipient_note').textContent = order.recipient_note || '-';
    document.getElementById('order-detail-card_message').textContent = order.card_message || '-';
    
    // Ürün listesi
    const itemsList = document.getElementById('order-detail-items');
    if (order.items) {
        itemsList.innerHTML = order.items.split(',').map(item => `
            <div class="list-group-item px-0">
                <div class="d-flex justify-content-between align-items-center">
                    <span>${item.trim()}</span>
                </div>
            </div>
        `).join('');
    } else {
        itemsList.innerHTML = '<div class="list-group-item px-0 text-muted">Ürün bilgisi bulunamadı</div>';
    }
}

// Sayfalama güncelleme
function updatePagination(data) {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(data.total / parseInt(document.querySelector('[name="per_page"]').value));
    const currentPage = parseInt(data.page);

    // Toplam sayfa sayısını sakla
    pagination.dataset.totalPages = totalPages;

    let html = '';
    
    // Önceki sayfa
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="event.preventDefault(); goToPage(${currentPage - 1})" ${currentPage === 1 ? 'tabindex="-1"' : ''}>Önceki</a>
        </li>
    `;

    // İlk sayfa her zaman göster
    html += `
        <li class="page-item ${currentPage === 1 ? 'active' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="event.preventDefault(); goToPage(1)">1</a>
        </li>
    `;

    // Sayfa numaraları için aralık hesapla
    let startPage = Math.max(2, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);

    // Başlangıçta üç nokta
    if (startPage > 2) {
        html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }

    // Orta sayfalar
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="javascript:void(0)" onclick="event.preventDefault(); goToPage(${i})">${i}</a>
            </li>
        `;
    }

    // Sonda üç nokta
    if (endPage < totalPages - 1) {
        html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }

    // Son sayfa (1'den farklıysa)
    if (totalPages > 1) {
        html += `
            <li class="page-item ${currentPage === totalPages ? 'active' : ''}">
                <a class="page-link" href="javascript:void(0)" onclick="event.preventDefault(); goToPage(${totalPages})">${totalPages}</a>
            </li>
        `;
    }

    // Sonraki sayfa
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="event.preventDefault(); goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'tabindex="-1"' : ''}>Sonraki</a>
        </li>
    `;

    pagination.innerHTML = html;
}

// Sayfaya git fonksiyonu güncellendi
function goToPage(page) {
    // Toplam sayfa sayısını kontrol et
    const totalPages = parseInt(document.querySelector('[data-total-pages]')?.dataset.totalPages || '1');
    
    // Geçerli sayfa kontrolü
    if (page < 1 || page > totalPages) return;
    
    // Page input'u güncelle
    document.querySelector('[name="page"]').value = page;
    
    // Siparişleri yükle
    loadOrders();
}

// Hızlı durum güncelleme
async function quickUpdateStatus(orderId, newStatus) {
    try {
        // API çağrıları güncellendi
        const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('API Hatası');

        // Toast mesajı göster
        const toastHTML = `
            <div class="toast-container position-fixed bottom-0 end-0 p-3">
                <div class="toast align-items-center text-bg-success border-0" role="alert">
                    <div class="d-flex">
                        <div class="toast-body">
                            <i class="bi bi-check-circle"></i> Sipariş durumu güncellendi: ${getStatusText(newStatus)}
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        const toastEl = document.querySelector('.toast');
        const bsToast = new bootstrap.Toast(toastEl);
        bsToast.show();

        // Tabloyu yenile
        await loadOrders();

    } catch (error) {
        console.error('Durum güncellenirken hata:', error);
        showError('Durum güncellenemedi!');
    }
}

// Durum metinleri
function getStatusText(status) {
    const statusMap = {
        'new': 'Yeni',
        'preparing': 'Hazırlanıyor',
        'ready': 'Hazır',
        'delivering': 'Yolda',
        'delivered': 'Teslim Edildi',
        'cancelled': 'İptal'
    };
    return statusMap[status] || status;
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
        const toastHTML = `
            <div class="toast-container position-fixed bottom-0 end-0 p-3">
                <div class="toast align-items-center text-bg-success border-0" role="alert">
                    <div class="d-flex">
                        <div class="toast-body">
                            <i class="bi bi-check-circle"></i> Sipariş durumu güncellendi: ${getStatusText(newStatus)}
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        const toastEl = document.querySelector('.toast');
        const bsToast = new bootstrap.Toast(toastEl);
        bsToast.show();

        // Tabloyu yenile
        await loadOrders();

    } catch (error) {
        console.error('Durum güncellenirken hata:', error);
        showError('Durum güncellenemedi!');
    }
}

// İptal onayı
function confirmCancelOrder(orderId) {
    const modal = new bootstrap.Modal(document.createElement('div'));
    modal.element.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Sipariş İptal Onayı</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>Bu siparişi iptal etmek istediğinizden emin misiniz?</p>
                    <p class="text-danger"><small>Bu işlem geri alınamaz!</small></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Vazgeç</button>
                    <button type="button" class="btn btn-danger" onclick="cancelOrder(${orderId})">
                        Siparişi İptal Et
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal.element);
    modal.show();
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
        
        // Modalı kapat
        const modal = bootstrap.Modal.getInstance(document.querySelector('.modal'));
        modal.hide();
    } catch (error) {
        console.error('Sipariş iptal edilirken hata:', error);
        showError('Sipariş iptal edilemedi!');
    }
}

// Helper fonksiyonlar
function getPaymentStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge bg-warning">Bekliyor</span>',
        'paid': '<span class="badge bg-success">Ödendi</span>',
        'cancelled': '<span class="badge bg-danger">İptal</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

function formatTimeSlot(slot) {
    const slots = {
        'morning': 'Sabah (09:00-12:00)',
        'afternoon': 'Öğlen (12:00-17:00)',
        'evening': 'Akşam (17:00-21:00)'
    };
    return slots[slot] || slot;
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
        const toastHTML = `
            <div class="toast-container position-fixed bottom-0 end-0 p-3">
                <div class="toast align-items-center text-bg-success border-0" role="alert">
                    <div class="d-flex">
                        <div class="toast-body">
                            <i class="bi bi-check-circle"></i> Sipariş durumu: Hazır'a alındı
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        const toastEl = document.querySelector('.toast');
        const bsToast = new bootstrap.Toast(toastEl);
        bsToast.show();

        // Modalı kapat ve tabloyu yenile
        bootstrap.Modal.getInstance(document.getElementById('orderDetailModal')).hide();
        await loadOrders();

    } catch (error) {
        console.error('Durum güncellenirken hata:', error);
        showError('Durum güncellenemedi!');
    }
}

// Sipariş listesini yükle - Toplam ve öğeleri düzgün göster
async function loadOrders(page = 1, filters = {}) {
    try {
        // ...existing code...
        
        // Siparişleri tabloya doldur
        ordersTable.innerHTML = data.orders.map(order => `
            <tr>
                <!-- Diğer bilgiler... -->
                <td class="text-end">
                    <strong>${formatCurrency(order.total_amount)}</strong>
                    <div>
                        <span class="badge ${getPaymentStatusClass(order.payment_status)}">
                            ${getPaymentStatusText(order.payment_status)}
                        </span>
                    </div>
                </td>
                <!-- Diğer alanlar... -->
            </tr>
        `).join('');
        
        // ...existing code...
    } catch (error) {
        // ...existing code...
    }
}

// Sipariş detayını göster - Tutarı düzgün görüntüle
function fillOrderDetailModal(order) {
    // ...existing code...
    
    // Toplam tutarı doğru formatta göster
    document.getElementById('order-detail-total_amount').textContent = formatCurrency(order.total_amount);
    
    // Ürün listesini doldur
    const itemsContainer = document.getElementById('order-detail-items');
    if (order.items && order.items.length > 0) {
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
        
        // Toplam satırını ekle
        itemsHtml += `
            <div class="d-flex justify-content-between align-items-center pt-2">
                <div class="fw-bold">Toplam</div>
                <div class="fw-bold">${formatCurrency(total)}</div>
            </div>
        `;
        
        itemsContainer.innerHTML = itemsHtml;
    } else {
        itemsContainer.innerHTML = '<div class="text-muted">Ürün bilgisi bulunamadı</div>';
    }
    
    // ...existing code...
}