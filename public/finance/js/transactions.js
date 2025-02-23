let transactionModal;
let currentTransaction = null;
let currentPage = 1;
const PER_PAGE = 20;

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    
    // Modal'ı initialize et
    transactionModal = new bootstrap.Modal(document.getElementById('transactionModal'));
    
    // Filtre değerleri değiştiğinde otomatik yenile
    document.querySelectorAll('.form-select, .form-control').forEach(element => {
        element.addEventListener('change', applyFilters);
    });

    // Başlangıç yüklemesi
    initTransactionsPage();
});

async function initTransactionsPage() {
    await Promise.all([
        loadAccounts(),
        loadCategories(),
        loadTransactions()
    ]);
}

async function loadTransactions(page = 1) {
    try {
        // Filtre değerlerini al
        const filters = {
            account_id: document.getElementById('accountFilter').value,
            type: document.getElementById('typeFilter').value,
            status: document.getElementById('statusFilter').value,
            start_date: document.getElementById('startDate').value,
            end_date: document.getElementById('endDate').value,
            page: page,
            per_page: PER_PAGE
        };

        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_URL}/finance/transactions/filtered?${queryString}`);
        
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderTransactionsTable(data.transactions);
        updatePagination(data.pagination);
        updateTotalRecords(data.pagination.total);

    } catch (error) {
        console.error('Transactions loading error:', error);
        showError('İşlemler yüklenemedi');
    }
}

function renderTransactionsTable(transactions) {
    const tbody = document.getElementById('transactionsTable');
    
    if (!transactions?.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">İşlem bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => `
        <tr>
            <td>${formatDateTime(t.date)}</td>
            <td>${t.account_name}</td>
            <td>${getTransactionTypeBadge(t.type)}</td>
            <td>
                <span class="badge" style="background-color: ${t.category_color || '#6c757d'}">
                    ${t.category_name || '-'}
                </span>
            </td>
            <td>${t.description || '-'}</td>
            <td class="text-end">
                <span class="${t.type === 'in' ? 'text-success' : 'text-danger'}">
                    ${formatCurrency(t.amount)}
                </span>
            </td>
            <td>${getStatusBadge(t.status)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="showTransactionDetails(${t.id})">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getTransactionTypeBadge(type) {
    return type === 'in' 
        ? '<span class="badge bg-success">Gelen</span>'
        : '<span class="badge bg-danger">Giden</span>';
}

function getStatusBadge(status) {
    const badges = {
        'completed': '<span class="badge bg-success">Tamamlandı</span>',
        'pending': '<span class="badge bg-warning">Bekliyor</span>',
        'cancelled': '<span class="badge bg-danger">İptal</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

function updatePagination(pagination) {
    const ul = document.getElementById('pagination');
    currentPage = pagination.page;

    let html = '';
    
    // Önceki sayfa
    html += `
        <li class="page-item ${pagination.page <= 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadTransactions(${pagination.page - 1})">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;

    // Sayfa numaraları
    for (let i = 1; i <= pagination.total_pages; i++) {
        if (
            i === 1 || // İlk sayfa
            i === pagination.total_pages || // Son sayfa
            (i >= pagination.page - 2 && i <= pagination.page + 2) // Aktif sayfa etrafı
        ) {
            html += `
                <li class="page-item ${i === pagination.page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadTransactions(${i})">${i}</a>
                </li>
            `;
        } else if (
            (i === 2 && pagination.page > 4) ||
            (i === pagination.total_pages - 1 && pagination.page < pagination.total_pages - 3)
        ) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // Sonraki sayfa
    html += `
        <li class="page-item ${pagination.page >= pagination.total_pages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadTransactions(${pagination.page + 1})">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;

    ul.innerHTML = html;
}

function updateTotalRecords(total) {
    document.getElementById('totalRecords').textContent = `Toplam: ${total} kayıt`;
}

async function showTransactionDetails(id) {
    try {
        const response = await fetch(`${API_URL}/finance/transactions/${id}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        currentTransaction = data.transaction;
        
        const details = document.getElementById('transactionDetails');
        details.innerHTML = `
            <div class="row g-3">
                <div class="col-6">
                    <label class="form-label">İşlem Tarihi</label>
                    <div>${formatDateTime(currentTransaction.date)}</div>
                </div>
                <div class="col-6">
                    <label class="form-label">Durum</label>
                    <div>${getStatusBadge(currentTransaction.status)}</div>
                </div>
                <div class="col-6">
                    <label class="form-label">Hesap</label>
                    <div>${currentTransaction.account_name}</div>
                </div>
                <div class="col-6">
                    <label class="form-label">Kategori</label>
                    <div>${currentTransaction.category_name || '-'}</div>
                </div>
                <div class="col-6">
                    <label class="form-label">İşlem Türü</label>
                    <div>${getTransactionTypeBadge(currentTransaction.type)}</div>
                </div>
                <div class="col-6">
                    <label class="form-label">Tutar</label>
                    <div class="${currentTransaction.type === 'in' ? 'text-success' : 'text-danger'} fw-bold">
                        ${formatCurrency(currentTransaction.amount)}
                    </div>
                </div>
                <div class="col-12">
                    <label class="form-label">Açıklama</label>
                    <div>${currentTransaction.description || '-'}</div>
                </div>
            </div>
        `;

        // İptal butonunu duruma göre göster/gizle
        const btnCancel = document.getElementById('btnCancel');
        btnCancel.style.display = currentTransaction.status === 'completed' ? 'block' : 'none';

        transactionModal.show();
    } catch (error) {
        console.error('Transaction detail error:', error);
        showError('İşlem detayları yüklenemedi');
    }
}

async function cancelTransaction() {
    if (!currentTransaction) return;

    try {
        const response = await fetch(`${API_URL}/finance/transactions/${currentTransaction.id}/cancel`, {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('API Hatası');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        transactionModal.hide();
        await loadTransactions(currentPage);
        showSuccess('İşlem iptal edildi');
    } catch (error) {
        console.error('Transaction cancel error:', error);
        showError('İşlem iptal edilemedi');
    }
}

function applyFilters() {
    loadTransactions(1); // Filtreleme yapılınca ilk sayfaya dön
}
