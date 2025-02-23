// API URL'i window.location'dan al (pages değil, worker'a gitsin)
const API_BASE = window.location.hostname.includes('pages.dev') 
    ? 'https://cicek-crm-api.yusufaakarsu.workers.dev'
    : `${window.location.protocol}//${window.location.host}`;

const API_URL = `${API_BASE}/api`;

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    initFinancePage();
    
    // Debug panel için
    document.getElementById('lastApiUrl').textContent = API_URL;
});

// Ana sayfa başlatma
function initFinancePage() {
    loadFinanceData();
    loadRecentTransactions();
    
    // Periyodik güncelleme
    const UPDATE_INTERVAL = 60000; // 60 saniye
    setInterval(() => {
        loadFinanceData();
        loadRecentTransactions();
    }, UPDATE_INTERVAL);
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

        // Kartları güncelle
        updateFinanceCards(data);
        hideLoading('totalBalance');

    } catch (error) {
        console.error('Finance data error:', error);
        showError('Finansal veriler alınamadı');
        document.getElementById('lastError').textContent = error.message;
    }
}

// Para formatı için yardımcı fonksiyon
function formatMoney(amount) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(amount);
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
            <td>${t.account_name || '-'}</td>
            <td>${t.description || '-'}</td>
            <td>${t.type === 'in' ? 'Gelir' : 'Gider'}</td>
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

// Loading göstergeleri
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
