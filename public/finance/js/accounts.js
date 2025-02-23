let accountModal, movementsModal;
let editingAccountId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    
    // Modal'ları initialize et
    accountModal = new bootstrap.Modal(document.getElementById('accountModal'));
    movementsModal = new bootstrap.Modal(document.getElementById('movementsModal'));
    
    // Hesapları yükle
    loadAccounts();
});

async function loadAccounts() {
    try {
        const response = await fetch(`${API_URL}/finance/accounts`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderAccountSummary(data.accounts);
        renderAccountsTable(data.accounts);
    } catch (error) {
        console.error('Accounts loading error:', error);
        showError('Hesap listesi yüklenemedi');
    }
}

function renderAccountSummary(accounts) {
    const summaryCards = document.getElementById('accountSummaryCards');
    
    // Hesap türlerine göre toplam bakiyeleri hesapla
    const totals = accounts.reduce((acc, account) => {
        if (!acc[account.type]) acc[account.type] = 0;
        acc[account.type] += parseFloat(account.balance_calculated || 0);
        return acc;
    }, {});

    const cards = [];
    
    // Nakit
    cards.push(`
        <div class="col-md-3">
            <div class="card border-success h-100">
                <div class="card-body">
                    <h6 class="card-title text-success">
                        <i class="bi bi-cash"></i> Nakit Kasalar
                    </h6>
                    <h3 class="mb-2">${formatMoney(totals.cash || 0)}</h3>
                    <small class="text-muted">
                        ${accounts.filter(a => a.type === 'cash').length} aktif kasa
                    </small>
                </div>
            </div>
        </div>
    `);

    // Banka
    cards.push(`
        <div class="col-md-3">
            <div class="card border-primary h-100">
                <div class="card-body">
                    <h6 class="card-title text-primary">
                        <i class="bi bi-bank"></i> Banka Hesapları
                    </h6>
                    <h3 class="mb-2">${formatMoney(totals.bank || 0)}</h3>
                    <small class="text-muted">
                        ${accounts.filter(a => a.type === 'bank').length} aktif hesap
                    </small>
                </div>
            </div>
        </div>
    `);

    // POS
    cards.push(`
        <div class="col-md-3">
            <div class="card border-info h-100">
                <div class="card-body">
                    <h6 class="card-title text-info">
                        <i class="bi bi-credit-card"></i> POS Hesapları
                    </h6>
                    <h3 class="mb-2">${formatMoney(totals.pos || 0)}</h3>
                    <small class="text-muted">
                        ${accounts.filter(a => a.type === 'pos').length} aktif POS
                    </small>
                </div>
            </div>
        </div>
    `);

    // Toplam
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    cards.push(`
        <div class="col-md-3">
            <div class="card border-dark h-100">
                <div class="card-body">
                    <h6 class="card-title">
                        <i class="bi bi-wallet2"></i> Toplam Varlık
                    </h6>
                    <h3 class="mb-2">${formatMoney(total)}</h3>
                    <small class="text-muted">
                        ${accounts.length} aktif hesap
                    </small>
                </div>
            </div>
        </div>
    `);

    summaryCards.innerHTML = cards.join('');
}

function renderAccountsTable(accounts) {
    const tbody = document.getElementById('accountsTable');
    
    if (!accounts?.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Hesap bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = accounts.map(account => `
        <tr>
            <td>
                <div class="fw-bold">${account.name}</div>
                ${account.bank_name ? `<small class="text-muted">${account.bank_name}</small>` : ''}
            </td>
            <td>${getAccountTypeBadge(account.type)}</td>
            <td class="text-end">${formatMoney(account.initial_balance)}</td>
            <td class="text-end fw-bold">${formatMoney(account.balance_calculated)}</td>
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

function showNewAccountModal() {
    editingAccountId = null;
    document.getElementById('modalTitle').textContent = 'Yeni Hesap';
    document.getElementById('accountForm').reset();
    accountModal.show();
}

async function editAccount(id) {
    try {
        const response = await fetch(`${API_URL}/finance/accounts/${id}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        editingAccountId = id;
        document.getElementById('modalTitle').textContent = 'Hesap Düzenle';
        
        const form = document.getElementById('accountForm');
        Object.keys(data.account).forEach(key => {
            if (form.elements[key]) {
                form.elements[key].value = data.account[key];
            }
        });

        toggleBankDetails(form.elements['type']);
        accountModal.show();
    } catch (error) {
        console.error('Account loading error:', error);
        showError('Hesap bilgileri yüklenemedi');
    }
}

async function saveAccount() {
    const form = document.getElementById('accountForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
        const url = editingAccountId ? 
            `${API_URL}/finance/accounts/${editingAccountId}` : 
            `${API_URL}/finance/accounts`;

        const response = await fetch(url, {
            method: editingAccountId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        accountModal.hide();
        await loadAccounts();
        showSuccess(editingAccountId ? 'Hesap güncellendi' : 'Hesap oluşturuldu');
    } catch (error) {
        console.error('Account save error:', error);
        showError('Hesap kaydedilemedi');
    }
}

async function showMovements(accountId) {
    try {
        const response = await fetch(`${API_URL}/finance/accounts/${accountId}/movements`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderMovementsTable(data.movements);
        movementsModal.show();
    } catch (error) {
        console.error('Movements loading error:', error);
        showError('Hesap hareketleri yüklenemedi');
    }
}

function renderMovementsTable(movements) {
    const table = document.getElementById('movementsTable');
    
    if (!movements?.length) {
        table.innerHTML = '<tr><td colspan="5" class="text-center">Hareket bulunamadı</td></tr>';
        return;
    }

    table.innerHTML = `
        <thead>
            <tr>
                <th>Tarih</th>
                <th>Açıklama</th>
                <th>İşlem Türü</th>
                <th class="text-end">Tutar</th>
                <th>Bakiye</th>
            </tr>
        </thead>
        <tbody>
            ${movements.map(m => `
                <tr>
                    <td>${formatDate(m.created_at)}</td>
                    <td>${m.description}</td>
                    <td>${m.type === 'in' ? 
                        '<span class="text-success">Giriş</span>' : 
                        '<span class="text-danger">Çıkış</span>'}</td>
                    <td class="text-end">${formatMoney(m.amount)}</td>
                    <td class="text-end">${formatMoney(m.balance_after)}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
}

function toggleBankDetails(select) {
    const bankDetails = document.getElementById('bankDetails');
    bankDetails.style.display = select.value === 'bank' ? 'block' : 'none';
    
    // Banka hesabı değilse ilgili alanları temizle
    if (select.value !== 'bank') {
        const form = document.getElementById('accountForm');
        ['bank_name', 'bank_branch', 'bank_account_no', 'iban'].forEach(field => {
            if (form.elements[field]) form.elements[field].value = '';
        });
    }
}

async function verifyBalance(accountId) {
    try {
        const response = await fetch(`${API_URL}/finance/accounts/${accountId}/verify`, {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('API Hatası');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        await loadAccounts();
        showSuccess('Hesap bakiyesi doğrulandı');
    } catch (error) {
        console.error('Balance verification error:', error);
        showError('Bakiye doğrulanamadı');
    }
}

function refreshAccounts() {
    loadAccounts();
}
