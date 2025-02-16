document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    setupFilterListeners();
    loadOrders();
});

// Filtre dinleyicilerini ayarla
function setupFilterListeners() {
    // Durum filtresi
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    
    // Tarih filtresi
    document.getElementById('dateFilter').addEventListener('change', (e) => {
        const customDateRange = document.getElementById('customDateRange');
        customDateRange.style.display = e.target.value === 'custom' ? 'block' : 'none';
        applyFilters();
    });
    
    // Özel tarih aralığı
    document.getElementById('applyDateFilter').addEventListener('click', applyFilters);
    
    // Sıralama
    document.getElementById('sortFilter').addEventListener('change', applyFilters);
}

// Filtreleri uygula
async function applyFilters() {
    const status = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    const sort = document.getElementById('sortFilter').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    try {
        let url = `${API_URL}/orders/filtered?`;
        const params = new URLSearchParams();

        if (status) params.append('status', status);
        if (dateFilter !== 'custom') params.append('date_filter', dateFilter);
        if (dateFilter === 'custom' && startDate && endDate) {
            params.append('start_date', startDate);
            params.append('end_date', endDate);
        }
        if (sort) params.append('sort', sort);

        const response = await fetch(`${url}${params.toString()}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        renderOrders(data.orders);
        updatePagination(data);

    } catch (error) {
        console.error('Filtreleme hatası:', error);
        showError('Siparişler filtrelenirken hata oluştu');
    }
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

// Sayfalama güncelleme
function updatePagination(data) {
    const pagination = document.getElementById('pagination');
    const totalPages = data.total_pages;
    const currentPage = data.page;

    let html = '';
    
    // Önceki sayfa
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage - 1})">Önceki</a>
        </li>
    `;

    // Sayfa numaraları
    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="goToPage(${i})">${i}</a>
            </li>
        `;
    }

    // Sonraki sayfa
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage + 1})">Sonraki</a>
        </li>
    `;

    pagination.innerHTML = html;
}

// Sayfaya git
function goToPage(page) {
    if (page < 1) return;
    document.querySelector('[name="page"]').value = page;
    applyFilters();
}

// ...existing helper functions (showError, formatTimeSlot, etc.)...
