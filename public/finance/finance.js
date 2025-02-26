const API_BASE = window.location.hostname.includes('pages.dev') 
    ? 'https://cicek-crm-api.yusufaakarsu.workers.dev'
    : `${window.location.protocol}//${window.location.host}`;

const API_URL = `${API_BASE}/api`;

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    initFinancePage();
});

// Ana sayfa başlatma
function initFinancePage() {
    loadFinanceData();
    loadRecentTransactions();
    loadPendingPayments();
    
    // Periyodik güncelleme
    const UPDATE_INTERVAL = 60000; // 60 saniye
    setInterval(() => {
        loadFinanceData();
        loadRecentTransactions();
        loadPendingPayments();
    }, UPDATE_INTERVAL);
}

// Bekleyen ödemeleri yükle
async function loadPendingPayments() {
    try {
        showLoading('pendingPayments');
        const response = await fetch(`${API_URL}/finance/pending`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Veri alınamadı');
        }

        updatePendingPaymentsTable(data.pending);
        hideLoading('pendingPayments');

    } catch (error) {
        console.error('Pending payments error:', error);
        showError('Bekleyen ödemeler alınamadı');
    }
}

function updatePendingPaymentsTable(pending) {
    const tbody = document.getElementById('pendingPaymentsTable');
    
    const allPayments = [
        ...pending.purchases.map(p => ({
            ...p,
            typeText: 'Tedarikçi Ödemesi',
            nameLabel: 'Tedarikçi',
            onclick: `showPaymentModal('expense', ${p.id}, 'purchase')`  // Değişti
        })),
        ...pending.orders.map(o => ({
            ...o,
            typeText: 'Sipariş Tahsilatı',
            nameLabel: 'Müşteri',
            onclick: `showPaymentModal('income', ${o.id}, 'order')`      // Değişti
        }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    tbody.innerHTML = allPayments.map(p => `
        <tr>
            <td>${p[p.type === 'purchase' ? 'supplier_name' : 'customer_name']}</td>
            <td>${formatDate(p.date)}</td>
            <td>${p.typeText}</td>
            <td class="text-end">${formatMoney(p.amount)}</td>
            <td class="text-end">${formatMoney(p.paid_amount)}</td>
            <td class="text-end">${formatMoney(p.amount - p.paid_amount)}</td>
            <td>
                <button onclick="${p.onclick}" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-arrow-right"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="text-center">Bekleyen ödeme bulunmuyor</td></tr>';
}

// Modal işlemleri tek fonksiyonda
function showPaymentModal(mode, id = null, type = null) {
    const modalId = `${mode}Modal`;
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    
    if (id && type) {
        loadPaymentDetails(mode, id, type);
    }
    
    modal.show();
}

// Tek bir detay yükleme fonksiyonu
async function loadPaymentDetails(mode, id, type) {
    try {
        const response = await fetch(`${API_URL}/finance/payments/${type}/${id}`);
        const data = await response.json();
        
        if (data.success) {
            const form = document.getElementById(`${mode}Form`);
            form.querySelectorAll('[name]').forEach(input => {
                input.value = data[input.name] || '';
            });
        }
    } catch (error) {
        console.error(`Error loading ${mode} details:`, error);
    }
}

// Tek bir kaydetme fonksiyonu 
async function savePayment(mode) {
    const form = document.getElementById(`${mode}Form`);
    const formData = new FormData(form);
    
    try {
        const response = await fetch(`${API_URL}/finance/${mode}`, {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(formData)),
            headers: {'Content-Type': 'application/json'}
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById(`${mode}Modal`)).hide();
            loadFinanceData();
            loadPendingPayments();
        }
    } catch (error) {
        console.error(`Save ${mode} error:`, error);
    }
}

async function loadFinanceData() {
    try {
        showLoading('totalBalance');
        const response = await fetch(`${API_URL}/finance/stats`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Veri alınamadı');
        }

        updateFinanceCards(data);
        hideLoading('totalBalance');

    } catch (error) {
        console.error('Finance data error:', error);
        showError('Finansal veriler alınamadı');
        document.getElementById('lastError').textContent = error.message;
    }    
}

async function loadRecentTransactions() {
    try {
        showLoading('recentTransactions');
        const response = await fetch(`${API_URL}/finance/transactions`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'İşlemler alınamadı');
        }

        updateTransactionsTable(data.transactions);
        hideLoading('recentTransactions');

    } catch (error) {
        console.error('Transactions error:', error);
        showError('İşlem geçmişi alınamadı');
        document.getElementById('lastError').textContent = error.message;
    }
}

function updateFinanceCards(data) {
    document.getElementById('totalBalance').textContent = formatMoney(data.balances?.total_balance || 0);
    document.getElementById('accountCount').textContent = `${data.balances?.total_accounts || 0} aktif hesap`;
    document.getElementById('dailyIncome').textContent = formatMoney(data.dailyStats?.income || 0);
    document.getElementById('dailyExpense').textContent = formatMoney(data.dailyStats?.expense || 0);
    document.getElementById('pendingPayments').textContent = formatMoney(data.pendingPayments || 0);
}

function updateTransactionsTable(transactions) {
    const tbody = document.getElementById('recentTransactions');
    
    if (!transactions?.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">İşlem bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => `
        <tr>
            <td>${formatDate(t.date)}</td>
            <td>${t.description || '-'}</td>
            <td>${t.type === 'in' ? 'Gelir' : 'Gider'}</td>
            <td>${t.account_name || '-'}</td>
            <td class="text-end ${t.type === 'in' ? 'text-success' : 'text-danger'}">
                ${formatMoney(t.amount)}
            </td>
        </tr>
    `).join('');
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatMoney(amount) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(amount);
}

function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('loading');
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('loading');
    }
}