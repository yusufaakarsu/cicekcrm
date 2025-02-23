let accountModal;

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    loadAccounts();

    // Hesap türü değişince banka detaylarını göster/gizle
    document.querySelector('select[name="type"]').addEventListener('change', (e) => {
        const bankDetails = document.getElementById('bankDetails');
        bankDetails.style.display = e.target.value === 'bank' ? 'block' : 'none';
    });
});

async function loadAccounts() {
    try {
        const response = await fetch(`${API_URL}/finance/accounts`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Veriler alınamadı');
        }

        renderAccountsTable(data.accounts);
    } catch (error) {
        console.error('Accounts loading error:', error);
        showError('Hesap listesi yüklenemedi');
    }
}

function renderAccountsTable(accounts) {
    const tbody = document.getElementById('accountsTable');
    
    if (!accounts?.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Hesap bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = accounts.map(account => `
        <tr>
            <td>${account.name}</td>
            <td>${getAccountTypeBadge(account.type)}</td>
            <td class="text-end">${formatMoney(account.initial_balance)}</td>
            <td class="text-end">${formatMoney(account.balance_calculated)}</td>
            <td>${account.last_verified_at ? formatDate(account.last_verified_at) : '-'}</td>
            <td>${getStatusBadge(account.status)}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editAccount(${account.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info ms-1" onclick="showMovements(${account.id})">
                        <i class="bi bi-clock-history"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success ms-1" onclick="verifyBalance(${account.id})">
                        <i class="bi bi-check-circle"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getAccountTypeBadge(type) {
    const badges = {
        'cash': '<span class="badge bg-success">Kasa</span>',
        'bank': '<span class="badge bg-primary">Banka</span>',
        'pos': '<span class="badge bg-info">POS</span>',
        'online': '<span class="badge bg-warning">Online</span>'
    };
    return badges[type] || `<span class="badge bg-secondary">${type}</span>`;
}

function getStatusBadge(status) {
    const badges = {
        'active': '<span class="badge bg-success">Aktif</span>',
        'suspended': '<span class="badge bg-warning">Askıda</span>',
        'closed': '<span class="badge bg-danger">Kapalı</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

// ... devam edecek (editAccount, saveAccount, verifyBalance fonksiyonları) ...
