const API_URL = `${window.location.protocol}//${window.location.host}/api`;

// DEBUG: API URL'ini yazdır
console.log('API_URL:', API_URL);

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    initFinancePage();
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
        console.log('Fetching finance data...');
        const response = await fetch(`${API_URL}/finance/stats`);
        console.log('Response:', response);
        
        if (!response.ok) {
            console.error('API Error:', response.status, response.statusText);
            throw new Error('API Hatası');
        }
        
        const data = await response.json();
        console.log('Finance data:', data);

        // Finansal kartları güncelle
        document.getElementById('totalBalance').textContent = 
            formatMoney(data.balances?.total_balance || 0);
        document.getElementById('accountCount').textContent = 
            `${data.balances?.total_accounts || 0} aktif hesap`;
        
        document.getElementById('dailyIncome').textContent = 
            formatMoney(data.dailyStats?.income || 0);
        document.getElementById('dailyExpense').textContent = 
            formatMoney(data.dailyStats?.expense || 0);
            
        document.getElementById('pendingPayments').textContent = 
            formatMoney(data.pendingPayments || 0);

    } catch (error) {
        console.error('Finans verisi yüklenirken hata:', error);
        // Hata durumunda UI'ı güncelle
        document.getElementById('totalBalance').textContent = 'Hata!';
        document.getElementById('accountCount').textContent = 'Veriler alınamadı';
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
        console.log('Fetching transactions...');
        const response = await fetch(`${API_URL}/finance/transactions`);
        console.log('Transactions response:', response);

        if (!response.ok) {
            console.error('API Error:', response.status, response.statusText);
            throw new Error('API Hatası');
        }

        const transactions = await response.json();
        console.log('Transactions data:', transactions);

        const tbody = document.getElementById('recentTransactions').getElementsByTagName('tbody')[0];
        
        if (transactions.length > 0) {
            tbody.innerHTML = transactions.map(t => `
                <tr>
                    <td>${formatDate(t.date)}</td>
                    <td>${t.account_name}</td>
                    <td>${t.description}</td>
                    <td>${t.type === 'in' ? 'Gelir' : 'Gider'}</td>
                    <td class="text-end">${formatMoney(t.amount)}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">İşlem bulunamadı</td></tr>';
        }
    } catch (error) {
        console.error('İşlemler yüklenirken hata:', error);
        // Hata durumunda UI'ı güncelle
        const tbody = document.getElementById('recentTransactions');
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Veriler alınamadı!</td></tr>';
    }
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
