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

async function loadSummary() {
    try {
        const response = await fetch(`${API_URL}/finance/income/summary`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        // Özet kartları güncelle
        document.getElementById('todayIncome').textContent = formatCurrency(data.today_total || 0);
        document.getElementById('todayCount').textContent = `${data.today_count || 0} işlem`;
        document.getElementById('pendingIncome').textContent = formatCurrency(data.pending_total || 0);
        document.getElementById('pendingCount').textContent = `${data.pending_count || 0} bekleyen`;
        document.getElementById('monthlyIncome').textContent = formatCurrency(data.monthly_total || 0);
        document.getElementById('monthlyCount').textContent = `${data.monthly_count || 0} işlem`;

    } catch (error) {
        console.error('Summary loading error:', error);
        showError('Özet bilgileri yüklenemedi');
    }
}

async function loadIncomes(page = 1) {
    try {
        const filters = {
            customer_id: document.getElementById('customerFilter').value,
            account_id: document.getElementById('accountFilter').value,
            start_date: document.getElementById('startDate').value,
            end_date: document.getElementById('endDate').value,
            status: document.getElementById('statusFilter').value,
            page,
            per_page: PER_PAGE
        };

        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_URL}/finance/income/list?${queryString}`);
        
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderIncomeTable(data.incomes);
        updatePagination(data.pagination);
        
    } catch (error) {
        console.error('Income loading error:', error);
        showError('Tahsilatlar yüklenemedi');
    }
}

// ... diğer fonksiyonlar (loadIncomes, renderIncomeTable, saveIncome vs.) ...
