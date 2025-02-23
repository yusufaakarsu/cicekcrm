let incomeModal;
let customers = [];
let accounts = [];
let currentPage = 1;
const PER_PAGE = 20;

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    
    incomeModal = new bootstrap.Modal(document.getElementById('incomeModal'));
    
    // Tarih alanı varsayılan değeri
    document.querySelector('input[name="date"]').value = 
        new Date().toISOString().slice(0, 16);
    
    // Filtre değişikliklerini dinle
    document.querySelectorAll('.form-select, .form-control').forEach(element => {
        element.addEventListener('change', applyFilters);
    });

    initIncomePage();
});

async function initIncomePage() {
    await Promise.all([
        loadCustomers(),
        loadAccounts(),
        loadSummary(),
        loadIncomes()
    ]);
}

async function loadCustomers() {
    try {
        const response = await fetch(`${API_URL}/customers/active`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        customers = data.customers;
        
        // Select elementlerini doldur
        const customerSelects = document.querySelectorAll('select[name="customer_id"], #customerFilter');
        customerSelects.forEach(select => {
            select.innerHTML = `
                <option value="">Seçiniz</option>
                ${customers.map(c => `
                    <option value="${c.id}">${c.name}</option>
                `).join('')}
            `;
        });
    } catch (error) {
        console.error('Customers loading error:', error);
        showError('Müşteri listesi yüklenemedi');
    }
}

async function loadAccounts() {
    try {
        const response = await fetch(`${API_URL}/finance/accounts`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        accounts = data.accounts;
        
        // Select elementlerini doldur
        const accountSelects = document.querySelectorAll('select[name="account_id"], #accountFilter');
        accountSelects.forEach(select => {
            select.innerHTML = `
                <option value="">Seçiniz</option>
                ${accounts.map(a => `
                    <option value="${a.id}">${a.name}</option>
                `).join('')}
            `;
        });
    } catch (error) {
        console.error('Accounts loading error:', error);
        showError('Hesap listesi yüklenemedi');
    }
}

// ... diğer fonksiyonlar (loadIncomes, renderIncomeTable, saveIncome vs.) ...
