let transactionModal, transactionDetailModal;
let currentPage = 1;
let accounts = [];
let categories = [];
let transactions = [];
let dateRangePicker;
let isEditMode = false;
let currentTransaction = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadSideBar();
    
    // Bugünün tarihini varsayılan olarak ayarla
    document.querySelector('input[name="date"]').valueAsDate = new Date();
    
    // Modal referansları
    transactionModal = new bootstrap.Modal(document.getElementById('newTransactionModal'));
    transactionDetailModal = new bootstrap.Modal(document.getElementById('transactionDetailModal'));
    
    // URL parametrelerinden filtreleri al
    parseURLParams();
    
    // Veri yükleme
    await Promise.all([
        loadAccounts(),
        loadCategories()
    ]);
    
    // Tarih aralığı seçici inicialize et
    initDateRangePicker();
    
    // İşlemleri yükle
    await loadTransactions();
    
    // Event listeners
    document.getElementById('filterForm').addEventListener('submit', (e) => {
        e.preventDefault();
        applyFilters();
    });
    
    document.getElementById('btnResetFilters').addEventListener('click', resetFilters);
    document.getElementById('btnResetDate').addEventListener('click', resetDateFilter);
    document.getElementById('btnExport').addEventListener('click', exportToExcel);
    document.getElementById('saveTransaction').addEventListener('click', saveTransaction);
    document.getElementById('btnEditTransaction').addEventListener('click', editTransaction);
    document.getElementById('btnDeleteTransaction').addEventListener('click', confirmDeleteTransaction);
    
    // İşlem tipine göre kategori filtreleme
    document.querySelectorAll('input[name="type"]').forEach(radio => {
        radio.addEventListener('change', updateCategoryOptions);
    });
});

// URL parametrelerini parse et
function parseURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Filtre formunu doldur
    document.getElementById('typeFilter').value = urlParams.get('type') || '';
    document.getElementById('accountFilter').value = urlParams.get('account_id') || '';
    document.getElementById('categoryFilter').value = urlParams.get('category_id') || '';
    document.getElementById('statusFilter').value = urlParams.get('status') || '';
    
    // Sayfa numarası
    currentPage = parseInt(urlParams.get('page')) || 1;
    
    // Tarih aralığı
    const startDate = urlParams.get('start_date');
    const endDate = urlParams.get('end_date');
    if (startDate && endDate) {
        document.getElementById('dateRange').value = `${startDate} - ${endDate}`;
    }
}

// Filtre değerlerini URL'ye yansıt
function updateURL(filters) {
    const url = new URL(window.location);
    
    // Mevcut parametreleri temizle
    url.searchParams.delete('type');
    url.searchParams.delete('account_id');
    url.searchParams.delete('category_id');
    url.searchParams.delete('status');
    url.searchParams.delete('start_date');
    url.searchParams.delete('end_date');
    url.searchParams.delete('page');
    
    // Yeni parametre değerlerini ekle
    Object.entries(filters).forEach(([key, value]) => {
        if (value) {
            url.searchParams.append(key, value);
        }
    });
    
    // URL'yi güncelle
    window.history.pushState({}, '', url);
}

// Tarih seçici inicializasyon
function initDateRangePicker() {
    dateRangePicker = flatpickr('#dateRange', {
        mode: 'range',
        dateFormat: 'Y-m-d',
        locale: 'tr',
        allowInput: true,
        altInput: true,
        altFormat: 'd.m.Y',
        maxDate: 'today',
        defaultDate: [
            document.getElementById('dateRange').value.split(' - ')[0],
            document.getElementById('dateRange').value.split(' - ')[1]
        ]
    });
}

// İşlemleri yükle
async function loadTransactions() {
    try {
        const filters = getFilterValues();
        updateURL({...filters, page: currentPage});
        
        const queryParams = new URLSearchParams({
            ...filters,
            page: currentPage,
            per_page: 20
        });
        
        const response = await fetchAPI(`/finance/transactions/filtered?${queryParams}`);
        if (!response.success) throw new Error(response.error);
        
        transactions = response.transactions || [];
        
        // Tabloyu doldur
        renderTransactions();
        
        // Sayfalamayı güncelle
        renderPagination(response.pagination);
        
        // Toplamları güncelle
        updateTotals();
        
    } catch (error) {
        console.error('Transactions loading error:', error);
        showError('İşlemler yüklenemedi');
        document.getElementById('transactionsTable').innerHTML = 
            '<tr><td colspan="8" class="text-danger text-center py-4">İşlemler yüklenemedi!</td></tr>';
    }
}

// İşlemleri tabloya render et
function renderTransactions() {
    const tbody = document.getElementById('transactionsTable');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">İşlem bulunamadı</td></tr>';
        return;
    }
    
    tbody.innerHTML = transactions.map(tx => `
        <tr>
            <td>${formatDate(tx.date)}</td>
            <td>
                <span class="badge ${tx.type === 'in' ? 'bg-success' : 'bg-danger'}">
                    ${tx.type === 'in' ? 'Gelir' : 'Gider'}
                </span>
            </td>
            <td>${tx.category_name || '-'}</td>
            <td>${tx.account_name || '-'}</td>
            <td style="max-width: 200px;" class="text-truncate">${tx.description || '-'}</td>
            <td class="text-end fw-bold ${tx.type === 'in' ? 'text-success' : 'text-danger'}">
                ${formatCurrency(tx.amount)}
            </td>
            <td>
                <span class="badge ${tx.status === 'paid' ? 'bg-success' : 'bg-warning text-dark'}">
                    ${tx.status === 'paid' ? 'Onaylı' : 'Bekliyor'}
                </span>
            </td>
            <td class="text-end">
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-secondary" onclick="showTransactionDetail(${tx.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${tx.status === 'pending' ? `
                        <button class="btn btn-sm btn-outline-success" onclick="approveTransaction(${tx.id})">
                            <i class="bi bi-check-lg"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Sayfalama kontrollerini render et
function renderPagination(pagination) {
    if (!pagination) return;
    
    const paginationEl = document.getElementById('pagination');
    const totalPages = pagination.total_pages || 1;
    const currentPage = pagination.page || 1;
    
    // Sayfa numaralarını oluştur
    let pages = [];
    
    // Her zaman ilk sayfa
    pages.push(1);
    
    // Ellipsis eklenecek mi?
    if (currentPage > 3) {
        pages.push('...');
    }
    
    // Ortadaki sayılar
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        if (!pages.includes(i)) {
            pages.push(i);
        }
    }
    
    // Ellipsis eklenecek mi?
    if (currentPage < totalPages - 2) {
        pages.push('...');
    }
    
    // Her zaman son sayfa (eğer birden fazla sayfa varsa)
    if (totalPages > 1 && !pages.includes(totalPages)) {
        pages.push(totalPages);
    }
    
    // Sayfalama HTML'ini oluştur
    paginationEl.innerHTML = `
        <!-- Önceki sayfa -->
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
        
        <!-- Sayfa numaraları -->
        ${pages.map(page => {
            if (page === '...') {
                return `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            return `
                <li class="page-item ${page === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${page}); return false;">${page}</a>
                </li>
            `;
        }).join('')}
        
        <!-- Sonraki sayfa -->
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    // Toplam kayıt sayısını göster
    document.getElementById('totalCount').textContent = pagination.total || 0;
}

// Toplam gelir/gider bilgilerini güncelle
function updateTotals() {
    const totalIncome = transactions.filter(tx => tx.type === 'in')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    
    const totalExpense = transactions.filter(tx => tx.type === 'out')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpense').textContent = formatCurrency(totalExpense);
}

// Hesapları yükle
async function loadAccounts() {
    try {
        const response = await fetchAPI('/finance/accounts');
        if (!response.success) throw new Error(response.error);
        
        accounts = response.accounts || [];
        
        // Hesap seçeneklerini doldur (filtre ve modal için)
        const accountFilters = document.querySelectorAll('#accountFilter, select[name="account_id"]');
        accountFilters.forEach(select => {
            // Varsayılan ilk seçeneği sakla
            const firstOption = select.querySelector('option:first-child');
            
            // Sonra seçenekleri doldur
            select.innerHTML = '';
            select.appendChild(firstOption); // Varsayılan seçeneği geri ekle
            
            accounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account.id;
                option.textContent = `${account.name} (${formatAccountType(account.type)})`;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Accounts loading error:', error);
        showError('Hesaplar yüklenemedi');
    }
}

// Kategorileri yükle
async function loadCategories() {
    try {
        const response = await fetchAPI('/finance/categories');
        if (!response.success) throw new Error(response.error);
        
        categories = response.categories || [];
        
        // Kategori filtresini doldur
        const categoryFilter = document.getElementById('categoryFilter');
        const firstOption = categoryFilter.querySelector('option:first-child');
        categoryFilter.innerHTML = '';
        categoryFilter.appendChild(firstOption);
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
        
        // İşlem tipine göre kategori seçeneklerini güncelle
        updateCategoryOptions();
    } catch (error) {
        console.error('Categories loading error:', error);
        showError('Kategoriler yüklenemedi');
    }
}

// Filtre değerlerini al
function getFilterValues() {
    const dateRange = document.getElementById('dateRange').value;
    const [startDate, endDate] = dateRange ? dateRange.split(' - ') : ['', ''];
    
    return {
        type: document.getElementById('typeFilter').value,
        account_id: document.getElementById('accountFilter').value,
        category_id: document.getElementById('categoryFilter').value,
        status: document.getElementById('statusFilter').value,
        start_date: startDate,
        end_date: endDate
    };
}

// Filtreleri uygula
function applyFilters() {
    currentPage = 1; // İlk sayfaya dön
    loadTransactions();
}

// Filtreleri sıfırla
function resetFilters() {
    document.getElementById('typeFilter').value = '';
    document.getElementById('accountFilter').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('statusFilter').value = '';
    dateRangePicker.clear();
    
    currentPage = 1;
    loadTransactions();
}

// Tarih filtresini sıfırla
function resetDateFilter() {
    dateRangePicker.clear();
}

// Sayfa değiştir
function changePage(page) {
    currentPage = page;
    loadTransactions();
    
    // Sayfanın üst kısmına kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// İşlem tipine göre kategori seçeneklerini güncelle
function updateCategoryOptions() {
    const type = document.querySelector('input[name="type"]:checked')?.value || 'in';
    const categorySelect = document.querySelector('#transactionForm select[name="category_id"]');
    
    if (!categories.length || !categorySelect) return;
    
    // Varsayılan ilk seçeneği sakla
    const firstOption = categorySelect.querySelector('option:first-child');
    
    // Filtreleme
    const filteredCategories = categories.filter(cat => 
        cat.type === type || cat.type === 'both'
    );
    
    // Seçenekleri doldur
    categorySelect.innerHTML = '';
    categorySelect.appendChild(firstOption); // İlk seçeneği geri ekle
    
    filteredCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
}

// Excel'e aktar
function exportToExcel() {
    if (!transactions.length) {
        showError('Dışa aktarılacak veri bulunamadı');
        return;
    }
    
    // Excel'e aktarım için verileri hazırla
    const exportData = transactions.map(tx => {
        return {
            'Tarih': formatDate(tx.date),
            'İşlem Türü': tx.type === 'in' ? 'Gelir' : 'Gider',
            'Kategori': tx.category_name || '-',
            'Hesap': tx.account_name || '-',
            'Açıklama': tx.description || '-',
            'Tutar': tx.amount,
            'Durum': tx.status === 'paid' ? 'Onaylı' : 'Bekliyor'
        };
    });
    
    // Excel dosyasını oluştur
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Finansal İşlemler');
    
    // Sütun genişliklerini ayarla
    const maxWidth = [15, 10, 25, 20, 40, 10, 10];
    worksheet['!cols'] = maxWidth.map(w => ({ width: w }));
    
    // Dosyayı indir
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Finansal_İşlemler_${today}.xlsx`);
}

// İşlem detaylarını göster
async function showTransactionDetail(id) {
    try {
        // İşlem detaylarını yükle
        const response = await fetchAPI(`/finance/transactions/${id}`);
        if (!response.success) throw new Error(response.error);
        
        currentTransaction = response.transaction;
        
        // Modal içeriğini doldur
        const content = document.getElementById('transactionDetailContent');
        
        // İşlem tipi ve durumuna göre badge rengi
        const typeBadge = currentTransaction.type === 'in' 
            ? 'bg-success' 
            : 'bg-danger';
        const statusBadge = currentTransaction.status === 'paid' 
            ? 'bg-success' 
            : 'bg-warning text-dark';
        
        content.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <h5>
                        <span class="badge ${typeBadge}">
                            ${currentTransaction.type === 'in' ? 'Gelir' : 'Gider'}
                        </span>
                    </h5>
                </div>
                <div class="col-md-6 text-end">
                    <span class="badge ${statusBadge}">
                        ${currentTransaction.status === 'paid' ? 'Onaylı' : 'Bekliyor'}
                    </span>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Tarih:</strong>
                    <div>${formatDate(currentTransaction.date)}</div>
                </div>
                <div class="col-md-6">
                    <strong>Tutar:</strong>
                    <div class="fs-4 ${currentTransaction.type === 'in' ? 'text-success' : 'text-danger'}">
                        ${formatCurrency(currentTransaction.amount)}
                    </div>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Hesap:</strong>
                    <div>${currentTransaction.account_name}</div>
                </div>
                <div class="col-md-6">
                    <strong>Kategori:</strong>
                    <div>${currentTransaction.category_name}</div>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Ödeme Yöntemi:</strong>
                    <div>${formatPaymentMethod(currentTransaction.payment_method)}</div>
                </div>
                <div class="col-md-6">
                    <strong>İşlem Kaydı:</strong>
                    <div>${formatDateTime(currentTransaction.created_at)}</div>
                </div>
            </div>
            
            ${currentTransaction.description ? `
            <div class="row mb-3">
                <div class="col-12">
                    <strong>Açıklama:</strong>
                    <div>${currentTransaction.description}</div>
                </div>
            </div>
            ` : ''}
            
            ${currentTransaction.related_type ? `
            <div class="row mb-3">
                <div class="col-12">
                    <strong>İlişkili Kayıt:</strong>
                    <div>
                        ${formatRelatedType(currentTransaction.related_type)} 
                        #${currentTransaction.related_id}
                    </div>
                </div>
            </div>
            ` : ''}
        `;
        
        // Silme butonunu onaylı işlemlerde gizle
        document.getElementById('btnDeleteTransaction').style.display = 
            currentTransaction.status === 'paid' ? 'none' : 'block';
        
        // Modalı göster
        transactionDetailModal.show();
    } catch (error) {
        console.error('Transaction detail error:', error);
        showError('İşlem detayları yüklenemedi');
    }
}

// İşlemi düzenle
function editTransaction() {
    if (!currentTransaction) return;
    
    // Detay modalını kapat
    transactionDetailModal.hide();
    
    // Form değerlerini ayarla
    const form = document.getElementById('transactionForm');
    form.reset();
    
    // İşlem ID'sini gizli alana yaz
    document.getElementById('transaction_id').value = currentTransaction.id;
    
    // Form elemanlarını doldur
    document.querySelector(`input[name="type"][value="${currentTransaction.type}"]`).checked = true;
    document.querySelector('select[name="account_id"]').value = currentTransaction.account_id;
    document.querySelector('select[name="payment_method"]').value = currentTransaction.payment_method;
    document.querySelector('input[name="amount"]').value = currentTransaction.amount;
    document.querySelector('input[name="date"]').value = currentTransaction.date.split('T')[0];
    document.querySelector('textarea[name="description"]').value = currentTransaction.description || '';
    
    // Kategori seçeneklerini güncelle ve seç
    updateCategoryOptions();
    setTimeout(() => {
        document.querySelector('select[name="category_id"]').value = currentTransaction.category_id;
    }, 100);
    
    // İlişkili kayıt varsa doldur
    if (currentTransaction.related_type && currentTransaction.related_id) {
        document.querySelector('select[name="related_type"]').value = currentTransaction.related_type;
        document.querySelector('input[name="related_id"]').value = currentTransaction.related_id;
    }
    
    // Düzenleme modunu aktifleştir
    isEditMode = true;
    
    // Modal başlığını değiştir
    document.querySelector('#newTransactionModal .modal-title').textContent = 'İşlem Düzenle';
    
    // Modalı göster
    transactionModal.show();
}

// İşlemi onayla
async function approveTransaction(id) {
    if (!confirm('Bu işlemi onaylamak istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetchAPI(`/finance/transactions/${id}/approve`, {
            method: 'POST'
        });
        
        if (!response.success) throw new Error(response.error);
        
        showSuccess('İşlem başarıyla onaylandı');
        await loadTransactions();
        
    } catch (error) {
        console.error('Transaction approval error:', error);
        showError('İşlem onaylanırken hata oluştu');
    }
}

// İşlem silme onayı
function confirmDeleteTransaction() {
    if (!currentTransaction) return;
    
    if (confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
        deleteTransaction(currentTransaction.id);
    }
}

// İşlem sil
async function deleteTransaction(id) {
    try {
        const response = await fetchAPI(`/finance/transactions/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.success) throw new Error(response.error);
        
        transactionDetailModal.hide();
        showSuccess('İşlem başarıyla silindi');
        await loadTransactions();
        
    } catch (error) {
        console.error('Transaction delete error:', error);
        showError('İşlem silinirken hata oluştu');
    }
}

// İşlem kaydet/güncelle
async function saveTransaction() {
    const form = document.getElementById('transactionForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const transactionId = data.id || null;
    delete data.id;
    
    try {
        let url = '/finance/transactions';
        let method = 'POST';
        
        // Düzenleme modu ise endpoint değiştir
        if (isEditMode && transactionId) {
            url = `/finance/transactions/${transactionId}`;
            method = 'PUT';
        }
        
        const response = await fetchAPI(url, {
            method,
            body: JSON.stringify({
                ...data,
                amount: parseFloat(data.amount)
            })
        });
        
        if (!response.success) throw new Error(response.error);
        
        // Modal kapat ve sayfayı yenile
        transactionModal.hide();
        
        // Form temizle ve düzenleme modunu kapat
        form.reset();
        isEditMode = false;
        document.querySelector('#newTransactionModal .modal-title').textContent = 'Yeni İşlem';
        
        showSuccess(`İşlem başarıyla ${isEditMode ? 'güncellendi' : 'kaydedildi'}`);
        
        // İşlemleri yeniden yükle
        await loadTransactions();
        
    } catch (error) {
        console.error('Transaction save error:', error);
        showError('İşlem kaydedilirken hata oluştu');
    }
}

// Helper: Hesap tipini formatla
function formatAccountType(type) {
    const types = {
        'cash': 'Nakit',
        'bank': 'Banka',
        'pos': 'POS',
        'online': 'Online'
    };
    return types[type] || type;
}

// Helper: Ödeme yöntemini formatla
function formatPaymentMethod(method) {
    const methods = {
        'cash': 'Nakit',
        'credit_card': 'Kredi Kartı',
        'bank_transfer': 'Havale/EFT',
        'online': 'Online Ödeme'
    };
    return methods[method] || method;
}

// Helper: İlişkili kayıt tipini formatla
function formatRelatedType(type) {
    const types = {
        'order': 'Sipariş',
        'purchase': 'Satın Alma',
        'other': 'Diğer'
    };
    return types[type] || type;
}