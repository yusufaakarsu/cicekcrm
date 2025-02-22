document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    loadDashboardData();
});

function initializeDashboard() {
    // Header'ı yükle
    loadSideBar();
    
    // 1 dakikada bir yenileme
    setInterval(loadDashboardData, 60000);
}

async function loadDashboardData() {
    try {
        const response = await fetch(`${API_URL}/finance/stats`);
        if (!response.ok) throw new Error('API Hatası');
        const data = await response.json();

        // Özet kartları güncelle
        updateSummaryCards(data.balances, data.dailyStats);
        
        // Son işlemleri yükle
        await loadRecentTransactions();
        
        // Hesap özetlerini yükle
        await loadAccountSummaries();

    } catch (error) {
        console.error('Dashboard verisi yüklenirken hata:', error);
        showError('Veriler yüklenirken hata oluştu');
    }
}

function updateSummaryCards(balances, dailyStats) {
    // Toplam bakiye
    document.getElementById('totalBalance').textContent = formatCurrency(balances.total_balance || 0);
    document.getElementById('accountCount').textContent = `${balances.total_accounts || 0} aktif hesap`;

    // Günlük gelir
    document.getElementById('dailyIncome').textContent = formatCurrency(dailyStats.income || 0);
    document.getElementById('dailyTransactionCount').textContent = 
        `${dailyStats.transaction_count || 0} işlem`;

    // Günlük gider
    document.getElementById('dailyExpense').textContent = formatCurrency(dailyStats.expense || 0);
    document.getElementById('expenseCount').textContent = 
        `${dailyStats.transaction_count || 0} işlem`;
}

async function loadRecentTransactions() {
    try {
        const response = await fetch(`${API_URL}/finance/transactions`);
        if (!response.ok) throw new Error('API Hatası');
        const data = await response.json();

        const tbody = document.getElementById('recentTransactions');
        tbody.innerHTML = data.length ? data.map(transaction => `
            <tr>
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.account_name}</td>
                <td>
                    <div>${transaction.description}</div>
                    <small class="text-muted">${transaction.category_name || ''}</small>
                </td>
                <td>
                    <span class="badge bg-${transaction.type === 'in' ? 'success' : 'danger'}">
                        ${transaction.type === 'in' ? 'Gelir' : 'Gider'}
                    </span>
                </td>
                <td class="text-end">
                    <span class="text-${transaction.type === 'in' ? 'success' : 'danger'}">
                        ${formatCurrency(transaction.amount)}
                    </span>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="5" class="text-center">İşlem bulunamadı</td></tr>';

    } catch (error) {
        console.error('İşlemler yüklenirken hata:', error);
        showError('İşlemler yüklenemedi');
    }
}

async function loadAccountSummaries() {
    try {
        const response = await fetch(`${API_URL}/finance/accounts`);
        if (!response.ok) throw new Error('API Hatası');
        const accounts = await response.json();

        const container = document.getElementById('accountSummaries');
        container.innerHTML = accounts.map(account => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-medium">${account.name}</div>
                        <small class="text-muted">
                            ${account.transaction_count || 0} işlem
                        </small>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold ${account.current_balance >= 0 ? 'text-success' : 'text-danger'}">
                            ${formatCurrency(account.current_balance)}
                        </div>
                        <small class="text-muted">
                            Hareket: ${formatCurrency(account.total_movement || 0)}
                        </small>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Hesap özetleri yüklenirken hata:', error);
        showError('Hesap bilgileri yüklenemedi');
    }
}
