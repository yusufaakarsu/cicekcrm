document.addEventListener('DOMContentLoaded', () => {
    initializeTransactionsPage();
});

function initializeTransactionsPage() {
    // Header'ı yükle
    loadHeader();
    
    // Form elementi varsa
    const form = document.getElementById('incomeForm') || document.getElementById('expenseForm');
    if (form) {
        setupTransactionForm(form);
        loadAccounts();
        loadCategories();
        loadRecentTransactions();
        
        // Varsayılan tarih değerini ayarla
        const dateInput = form.querySelector('input[name="date"]');
        if (dateInput) {
            dateInput.value = new Date().toISOString().slice(0, 16);
        }
    }
}

async function loadAccounts() {
    try {
        const response = await fetch(`${API_URL}/finance/accounts`);
        if (!response.ok) throw new Error('API Hatası');
        const accounts = await response.json();

        const select = document.querySelector('select[name="account_id"]');
        select.innerHTML = `
            <option value="">Hesap Seçin</option>
            ${accounts.map(account => `
                <option value="${account.id}">
                    ${account.name} (${formatCurrency(account.current_balance)})
                </option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Hesaplar yüklenirken hata:', error);
        showError('Hesaplar yüklenemedi');
    }
}

async function loadCategories() {
    try {
        // Sayfa tipine göre kategori filtresi
        const type = window.location.pathname.includes('income.html') ? 'in' : 'out';
        
        const response = await fetch(`${API_URL}/finance/categories?type=${type}`);
        if (!response.ok) throw new Error('API Hatası');
        const categories = await response.json();

        const select = document.querySelector('select[name="category_id"]');
        select.innerHTML = `
            <option value="">Kategori Seçin</option>
            ${categories.map(category => `
                <option value="${category.id}" data-color="${category.color}">
                    ${category.name}
                </option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
        showError('Kategoriler yüklenemedi');
    }
}

function setupTransactionForm(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // İşlem tipini sayfaya göre belirle
            data.type = window.location.pathname.includes('income.html') ? 'in' : 'out';
            
            const response = await fetch(`${API_URL}/finance/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('API Hatası');
            
            showSuccess('İşlem başarıyla kaydedildi');
            form.reset();
            
            // Varsayılan tarihi ayarla
            form.querySelector('input[name="date"]').value = 
                new Date().toISOString().slice(0, 16);
                
            // Son işlemleri yenile
            loadRecentTransactions();

        } catch (error) {
            console.error('İşlem kaydedilirken hata:', error);
            showError('İşlem kaydedilemedi');
        }
    });
}

async function loadRecentTransactions() {
    try {
        // İşlem tipine göre filtrele
        const type = window.location.pathname.includes('income.html') ? 'in' : 'out';
        const response = await fetch(`${API_URL}/finance/transactions?type=${type}&limit=5`);
        if (!response.ok) throw new Error('API Hatası');
        const transactions = await response.json();

        const container = document.getElementById('recentIncomes') || 
                         document.getElementById('recentExpenses');
        
        if (!container) return;

        container.innerHTML = transactions.length ? transactions.map(transaction => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-medium">${formatCurrency(transaction.amount)}</div>
                        <small class="text-muted">
                            ${transaction.account_name} - ${formatDate(transaction.date)}
                        </small>
                    </div>
                    <div class="text-end">
                        <div class="small">${transaction.description}</div>
                        <small class="text-muted">${transaction.category_name || ''}</small>
                    </div>
                </div>
            </div>
        `).join('') : `
            <div class="list-group-item text-center text-muted">
                İşlem bulunamadı
            </div>
        `;

    } catch (error) {
        console.error('Son işlemler yüklenirken hata:', error);
        showError('Son işlemler yüklenemedi');
    }
}
