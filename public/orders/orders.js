document.addEventListener('DOMContentLoaded', () => {
    initializePage();
});

// Sayfa başlangıç durumu
function initializePage() {
    // Hidden inputları ekle
    addHiddenInputs();
    
    // Header'ı yükle
    loadHeader();
    
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

// Temel veri yükleme fonksiyonu
async function loadOrders(isInitialLoad = false) {
    try {
        const params = new URLSearchParams({
            page: document.querySelector('[name="page"]').value,
            per_page: document.querySelector('[name="per_page"]').value,
            sort: document.getElementById('sortFilter').value
        });

        // İlk yüklemede veya bugün filtresi seçiliyse tarih filtresini ekle
        const dateFilter = document.getElementById('dateFilter').value;
        if (isInitialLoad || dateFilter !== 'all') {
            params.append('date_filter', dateFilter);
        }

        // Durum filtresi
        const status = document.getElementById('statusFilter').value;
        if (status) {
            params.append('status', status);
        }

        // Özel tarih aralığı
        if (dateFilter === 'custom') {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            if (startDate && endDate) {
                params.append('start_date', startDate);
                params.append('end_date', endDate);
            }
        }

        const response = await fetch(`${API_URL}/orders/filtered?${params.toString()}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        renderOrders(data.orders);
        updatePagination(data);

    } catch (error) {
        console.error('Siparişler yüklenirken hata:', error);
        showError('Siparişler yüklenemedi!');
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
        customDateRange.style.display = e.target.value === 'custom' ? 'block' : 'none';
        
        document.querySelector('[name="page"]').value = '1';
        if (e.target.value !== 'custom') {
            loadOrders();
        }
    });
    
    // Özel tarih aralığı
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
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-info" onclick="showOrderDetails(${order.id})" title="Detay">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-primary" onclick="editOrder(${order.id})" title="Düzenle">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Sipariş detaylarını göster
async function showOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/details`);
        if (!response.ok) throw new Error('API Hatası');
        
        const order = await response.json();
        const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
        
        // Modal içeriğini doldur
        document.getElementById('order-detail-id').textContent = order.id;
        document.getElementById('order-detail-created_at').textContent = formatDate(order.created_at);
        document.getElementById('order-detail-status').innerHTML = getStatusBadge(order.status);
        document.getElementById('order-detail-payment_status').innerHTML = getPaymentStatusBadge(order.payment_status);
        document.getElementById('order-detail-payment_method').textContent = formatPaymentMethod(order.payment_method);
        document.getElementById('order-detail-total_amount').textContent = formatCurrency(order.total_amount);
        
        document.getElementById('order-detail-customer_name').textContent = order.customer_name;
        document.getElementById('order-detail-customer_phone').textContent = formatPhoneNumber(order.customer_phone);
        
        document.getElementById('order-detail-delivery_date').textContent = `${formatDate(order.delivery_date)} - ${formatTimeSlot(order.delivery_time_slot)}`;
        document.getElementById('order-detail-delivery_address').textContent = order.delivery_address;
        
        document.getElementById('order-detail-recipient_name').textContent = order.recipient_name;
        document.getElementById('order-detail-recipient_phone').textContent = formatPhoneNumber(order.recipient_phone);
        document.getElementById('order-detail-recipient_note').textContent = order.recipient_note || '-';
        document.getElementById('order-detail-card_message').textContent = order.card_message || '-';
        
        // Ürün listesini doldur
        const itemsList = document.getElementById('order-detail-items');
        if (order.items) {
            itemsList.innerHTML = order.items.split(',').map(item => 
                `<div class="list-group-item">${item.trim()}</div>`
            ).join('');
        } else {
            itemsList.innerHTML = '<div class="list-group-item text-muted">Ürün bilgisi bulunamadı</div>';
        }
        
        modal.show();
    } catch (error) {
        console.error('Sipariş detayları yüklenirken hata:', error);
        showError('Sipariş detayları yüklenemedi!');
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

// Sayfaya git
function goToPage(page) {
    // Toplam sayfa sayısını kontrol et
    const totalPages = parseInt(document.querySelector('[data-total-pages]')?.dataset.totalPages || '1');
    
    // Geçerli sayfa kontrolü
    if (page < 1 || page > totalPages) return;
    
    // Page input'u güncelle
    document.querySelector('[name="page"]').value = page;
    
    // Filtreleri uygula
    applyFilters();
}

// Helper fonksiyonlar
function getPaymentStatusBadge(status) {
    const badges = {
        'paid': '<span class="badge bg-success">Ödendi</span>',
        'pending': '<span class="badge bg-warning">Bekliyor</span>',
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
