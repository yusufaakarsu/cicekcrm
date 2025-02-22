document.addEventListener('DOMContentLoaded', () => {
    initializeAccountsPage();
});

function initializeAccountsPage() {
    // Header'ı yükle
    loadSideBar();
    
    // Hesap listesini yükle
    loadAccounts();

    // Hesap türü filtresini ayarla
    document.getElementById('accountTypeFilter').addEventListener('change', loadAccounts);

    // Banka detaylarını göster/gizle
    document.querySelector('select[name="type"]').addEventListener('change', (e) => {
        const bankDetails = document.getElementById('bankDetails');
        bankDetails.style.display = e.target.value === 'bank' ? 'block' : 'none';
    });
}

async function loadAccounts() {
    try {
        const type = document.getElementById('accountTypeFilter').value;
        const url = type ? `${API_URL}/finance/accounts?type=${type}` : `${API_URL}/finance/accounts`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('API Hatası');
        const accounts = await response.json();

        renderAccounts(accounts);
    } catch (error) {
        console.error('Hesaplar yüklenirken hata:', error);
        showError('Hesaplar yüklenemedi');
    }
}

function renderAccounts(accounts) {
    const tbody = document.getElementById('accountsTable');
    
    if (!accounts.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Hesap bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = accounts.map(account => `
        <tr>
            <td>
                <div class="fw-medium">${account.name}</div>
                ${account.bank_name ? `<small class="text-muted">${account.bank_name}</small>` : ''}
            </td>
            <td>
                <span class="badge bg-${getAccountTypeBadge(account.type)}">
                    ${getAccountTypeText(account.type)}
                </span>
            </td>
            <td>${formatCurrency(account.initial_balance)}</td>
            <td>
                <span class="fw-bold text-${account.current_balance >= 0 ? 'success' : 'danger'}">
                    ${formatCurrency(account.current_balance)}
                </span>
            </td>
            <td>
                <span class="badge bg-${account.is_active ? 'success' : 'secondary'}">
                    ${account.is_active ? 'Aktif' : 'Pasif'}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="showAccountTransactions(${account.id})">
                        <i class="bi bi-list-ul"></i>
                    </button>
                    <button class="btn btn-outline-secondary" onclick="editAccount(${account.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="toggleAccountStatus(${account.id})">
                        <i class="bi bi-${account.is_active ? 'lock' : 'unlock'}"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getAccountTypeBadge(type) {
    const badges = {
        'cash': 'success',
        'bank': 'primary',
        'other': 'secondary'
    };
    return badges[type] || 'secondary';
}

function getAccountTypeText(type) {
    const types = {
        'cash': 'Nakit',
        'bank': 'Banka',
        'other': 'Diğer'
    };
    return types[type] || type;
}

// Yeni hesap modalını göster
function showNewAccountModal() {
    document.getElementById('accountForm').reset();
    document.querySelector('#accountModal .modal-title').textContent = 'Yeni Hesap';
    document.querySelector('#accountModal input[name="id"]').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('accountModal'));
    modal.show();
}

// Hesap kaydet
async function saveAccount() {
    const form = document.getElementById('accountForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const url = data.id 
            ? `${API_URL}/finance/accounts/${data.id}`
            : `${API_URL}/finance/accounts`;

        const response = await fetch(url, {
            method: data.id ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');

        showSuccess(`Hesap başarıyla ${data.id ? 'güncellendi' : 'oluşturuldu'}`);
        bootstrap.Modal.getInstance(document.getElementById('accountModal')).hide();
        await loadAccounts();

    } catch (error) {
        console.error('Hesap kaydedilirken hata:', error);
        showError('Hesap kaydedilemedi');
    }
}

// Hesabı düzenle
async function editAccount(id) {
    try {
        const response = await fetch(`${API_URL}/finance/accounts/${id}`);
        if (!response.ok) throw new Error('API Hatası');
        const account = await response.json();

        // Form'u doldur
        const form = document.getElementById('accountForm');
        Object.keys(account).forEach(key => {
            const input = form.elements[key];
            if (input) input.value = account[key];
        });

        // Banka detaylarını göster/gizle
        document.getElementById('bankDetails').style.display = 
            account.type === 'bank' ? 'block' : 'none';

        // Modal'ı aç
        document.querySelector('#accountModal .modal-title').textContent = 'Hesap Düzenle';
        const modal = new bootstrap.Modal(document.getElementById('accountModal'));
        modal.show();

    } catch (error) {
        console.error('Hesap bilgileri yüklenirken hata:', error);
        showError('Hesap bilgileri yüklenemedi');
    }
}

// Hesap durumunu değiştir
async function toggleAccountStatus(id) {
    if (!confirm('Hesap durumunu değiştirmek istediğinize emin misiniz?')) return;

    try {
        const response = await fetch(`${API_URL}/finance/accounts/${id}/toggle-status`, {
            method: 'PUT'
        });

        if (!response.ok) throw new Error('API Hatası');

        showSuccess('Hesap durumu güncellendi');
        await loadAccounts();

    } catch (error) {
        console.error('Hesap durumu güncellenirken hata:', error);
        showError('Hesap durumu güncellenemedi');
    }
}
