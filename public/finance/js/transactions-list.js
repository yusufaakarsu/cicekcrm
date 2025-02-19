document.addEventListener('DOMContentLoaded', () => {
    initializeTransactionsList();
});

function initializeTransactionsList() {
    loadHeader();
    loadFilters();
    loadTransactions();

    // Varsayılan tarih aralığını ayarla (son 30 gün)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
    document.getElementById('startDate').value = thirtyDaysAgo.toISOString().split('T')[0];
}

async function loadFilters() {
    try {
        // Hesapları yükle
        const accountsResponse = await fetch(`${API_URL}/finance/accounts`);
        if (!accountsResponse.ok) throw new Error('API Hatası');
        const accounts = await accountsResponse.json();

        document.getElementById('accountFilter').innerHTML = `
            <option value="">Tüm Hesaplar</option>
            ${accounts.map(account => `
                <option value="${account.id}">${account.name}</option>
            `).join('')}
        `;

        // Kategorileri yükle
        const categoriesResponse = await fetch(`${API_URL}/finance/categories`);
        if (!categoriesResponse.ok) throw new Error('API Hatası');
        const categories = await categoriesResponse.json();

        document.getElementById('categoryFilter').innerHTML = `
            <option value="">Tüm Kategoriler</option>
            ${categories.map(category => `
                <option value="${category.id}">${category.name}</option>
            `).join('')}
        `;

    } catch (error) {
        console.error('Filtreler yüklenirken hata:', error);
        showError('Filtreler yüklenemedi');
    }
}

async function loadTransactions(page = 1) {
    try {
        // Filtre parametrelerini al
        const params = new URLSearchParams({
            page,
            account_id: document.getElementById('accountFilter').value,
            category_id: document.getElementById('categoryFilter').value,
            type: document.getElementById('typeFilter').value,
            start_date: document.getElementById('startDate').value,
            end_date: document.getElementById('endDate').value
        });

        const response = await fetch(`${API_URL}/finance/transactions/filtered?${params}`);
        if (!response.ok) throw new Error('API Hatası');
        const data = await response.json();

        renderTransactions(data.transactions);
        updatePagination(data.pagination);

    } catch (error) {
        console.error('İşlemler yüklenirken hata:', error);
        showError('İşlemler yüklenemedi');
    }
}

function renderTransactions(transactions) {
    const tbody = document.getElementById('transactionsTable');
    
    if (!transactions.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">İşlem bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => `
        <tr>
            <td>${formatDate(t.date)}</td>
            <td>${t.account_name}</td>
            <td>
                <span class="badge" style="background-color: ${t.category_color}">
                    ${t.category_name}
                </span>
            </td>
            <td>${t.description}</td>
            <td>
                <span class="badge bg-${t.type === 'in' ? 'success' : 'danger'}">
                    ${t.type === 'in' ? 'Gelir' : 'Gider'}
                </span>
            </td>
            <td>${formatPaymentMethod(t.payment_method)}</td>
            <td class="text-end">
                <span class="text-${t.type === 'in' ? 'success' : 'danger'} fw-bold">
                    ${formatCurrency(t.amount)}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="showTransactionDetails(${t.id})">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function formatPaymentMethod(method) {
    const methods = {
        'cash': 'Nakit',
        'credit_card': 'Kredi Kartı',
        'bank_transfer': 'Havale/EFT',
        'company_card': 'Şirket Kartı'
    };
    return methods[method] || method;
}

// Filtreleri uygula
function applyFilters() {
    loadTransactions(1); // Sayfa 1'den başlat
}

// Excel'e aktar
async function exportTransactions() {
    // ... Excel export kodları eklenecek ...
}

// Sayfalama güncelleme
function updatePagination({ current_page, total_pages }) {
    const pagination = document.getElementById('pagination');
    
    let html = '';
    
    // Önceki sayfa
    html += `
        <li class="page-item ${current_page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadTransactions(${current_page - 1})">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;

    // Sayfa numaraları
    for (let i = 1; i <= total_pages; i++) {
        html += `
            <li class="page-item ${i === current_page ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadTransactions(${i})">${i}</a>
            </li>
        `;
    }

    // Sonraki sayfa
    html += `
        <li class="page-item ${current_page === total_pages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadTransactions(${current_page + 1})">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;

    pagination.innerHTML = html;
}
