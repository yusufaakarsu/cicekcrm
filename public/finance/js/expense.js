let expenseModal;
let suppliers = []; // Global tedarikçi listesi
let accounts = [];  // Global hesap listesi
let categories = []; // Global gider kategorileri

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    initExpensePage();
});

async function initExpensePage() {
    await Promise.all([
        loadSuppliers(),
        loadAccounts(),
        loadCategories(),
        loadExpenses()
    ]);
}

async function loadExpenses() {
    try {
        const response = await fetch(`${API_URL}/finance/expenses`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderExpensesTable(data.expenses);
    } catch (error) {
        console.error('Expenses loading error:', error);
        showError('Ödemeler yüklenemedi');
    }
}

// ... diğer fonksiyonlar ...
