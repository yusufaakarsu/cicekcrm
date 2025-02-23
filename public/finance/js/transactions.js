document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    initTransactionsPage();
});

async function initTransactionsPage() {
    await Promise.all([
        loadAccounts(),
        loadCategories(),
        loadTransactions()
    ]);
}

async function loadTransactions(filters = {}) {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_URL}/finance/transactions/filtered?${queryString}`);
        
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderTransactionsTable(data.transactions);
        updatePagination(data.pagination);
    } catch (error) {
        console.error('Transactions loading error:', error);
        showError('İşlemler yüklenemedi');
    }
}

// ... diğer fonksiyonlar ...
