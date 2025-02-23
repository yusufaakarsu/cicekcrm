let incomeModal;
let customers = []; // Global müşteri listesi
let accounts = [];  // Global hesap listesi

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    initIncomePage();
});

async function initIncomePage() {
    await Promise.all([
        loadCustomers(),
        loadAccounts(),
        loadIncomes()
    ]);
}

async function loadCustomers() {
    try {
        const response = await fetch(`${API_URL}/customers`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        customers = data.customers || [];
        
        // Select'leri doldur
        const customerSelects = document.querySelectorAll('select[name="customer_id"]');
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

// ... Diğer sayfaları da aynı şekilde oluşturalım mı?
