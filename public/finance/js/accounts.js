let accounts = [];
let accountModal, accountDetailModal, transferModal;
let currentAccountId = null;
let isEditMode = false;

document.addEventListener('DOMContentLoaded', async () => {
    await loadSideBar();
    
    // Modal referansları
    accountModal = new bootstrap.Modal(document.getElementById('accountModal'));
    accountDetailModal = new bootstrap.Modal(document.getElementById('accountDetailModal'));
    transferModal = new bootstrap.Modal(document.getElementById('transferModal'));
    
    // Bugünün tarihini varsayılan olarak ayarla
    document.querySelector('#transferForm input[name="date"]').valueAsDate = new Date();
    
    // Hesapları yükle
    await loadAccounts();
    
    // Event listeners
    document.getElementById('saveAccount').addEventListener('click', saveAccount);
    document.getElementById('editAccount').addEventListener('click', editAccountForm);
    document.getElementById('deleteAccount').addEventListener('click', confirmDeleteAccount);
    document.getElementById('saveTransfer').addEventListener('click', performTransfer);
    document.getElementById('refreshMovements').addEventListener('click', () => {
        if (currentAccountId) {
            loadAccountMovements(currentAccountId);
        }
    });
});

// Hesapları yükle ve hesap kartlarını oluştur
async function loadAccounts() {
    try {
        const response = await fetchAPI('/finance/accounts');
        if (!response.success) throw new Error(response.error);
        
        accounts = response.accounts || [];
        
        // Hesap kartlarını oluştur
        renderAccountCards();
        
        // Transfer modalındaki hesap listelerini doldur
        populateAccountSelects();
    } catch (error) {
        console.error('Accounts loading error:', error);
        showError('Hesaplar yüklenemedi');
        document.getElementById('accountCards').innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    Hesap bilgileri yüklenirken hata oluştu. Lütfen sayfayı yenileyin.
                </div>
            </div>
        `;
    }
}

// Hesap kartlarını render et
function renderAccountCards() {
    const container = document.getElementById('accountCards');
    
    if (!accounts.length) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    Henüz tanımlı hesap bulunmuyor. 
                    <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#accountModal">
                        Yeni hesap ekleyin
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    // Nakit, Banka, POS ve Online hesapları gruplayarak göster
    const cashAccounts = accounts.filter(a => a.type === 'cash');
    const bankAccounts = accounts.filter(a => a.type === 'bank');
    const posAccounts = accounts.filter(a => a.type === 'pos');
    const onlineAccounts = accounts.filter(a => a.type === 'online');
    
    // Her grup için bir satır oluştur ve her hesabı bir kart olarak göster
    container.innerHTML = '';
    
    // Nakit hesaplar
    if (cashAccounts.length) {
        container.innerHTML += `
            <div class="col-12 mb-2">
                <h5 class="border-bottom pb-2"><i class="bi bi-cash"></i> Nakit Hesaplar</h5>
            </div>
            ${renderAccountGroup(cashAccounts)}
        `;
    }
    
    // Banka hesapları
    if (bankAccounts.length) {
        container.innerHTML += `
            <div class="col-12 mb-2 mt-3">
                <h5 class="border-bottom pb-2"><i class="bi bi-bank"></i> Banka Hesapları</h5>
            </div>
            ${renderAccountGroup(bankAccounts)}
        `;
    }
    
    // POS hesapları
    if (posAccounts.length) {
        container.innerHTML += `
            <div class="col-12 mb-2 mt-3">
                <h5 class="border-bottom pb-2"><i class="bi bi-credit-card"></i> POS Hesapları</h5>
            </div>
            ${renderAccountGroup(posAccounts)}
        `;
    }
    
    // Online hesaplar
    if (onlineAccounts.length) {
        container.innerHTML += `
            <div class="col-12 mb-2 mt-3">
                <h5 class="border-bottom pb-2"><i class="bi bi-globe"></i> Online Hesaplar</h5>
            </div>
            ${renderAccountGroup(onlineAccounts)}
        `;
    }
}

// Hesap grubu render et
function renderAccountGroup(accounts) {
    return `
        <div class="row g-3">
            ${accounts.map(account => `
                <div class="col-md-4">
                    <div class="card h-100 ${account.status !== 'active' ? 'bg-light' : ''} ${account.balance_calculated < 0 ? 'border-danger' : ''}">
                        <div class="card-body">
                            <h5 class="card-title d-flex justify-content-between">
                                ${account.name}
                                ${account.status !== 'active' ? getStatusBadge(account.status) : ''}
                            </h5>
                            <h3 class="mb-3 ${account.balance_calculated < 0 ? 'text-danger' : 'text-primary'}">
                                ${formatCurrency(account.balance_calculated)}
                            </h3>
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="text-muted small">
                                    Son hareket: ${account.last_movement_date ? formatDate(account.last_movement_date) : 'Yok'}
                                </div>
                                <button class="btn btn-sm btn-outline-primary" onclick="showAccountDetail(${account.id})">
                                    <i class="bi bi-list"></i> Detay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Hesap modal formu sıfırla ve göster
function showNewAccountModal() {
    isEditMode = false;
    document.getElementById('accountForm').reset();
    document.getElementById('account_id').value = '';
    document.getElementById('accountModalTitle').textContent = 'Yeni Hesap';
    accountModal.show();
}

// Hesap detayını göster
async function showAccountDetail(id) {
    try {
        currentAccountId = id;
        
        // Hesap detayını yükle
        const response = await fetchAPI(`/finance/accounts/${id}`);
        if (!response.success) throw new Error(response.error);
        
        const account = response.account;
        
        // Modal başlığını güncelle
        document.getElementById('accountDetailTitle').textContent = account.name;
        
        // Hesap detaylarını göster
        document.getElementById('accountDetails').innerHTML = `
            <dl class="row mb-0">
                <dt class="col-sm-5">Hesap Türü:</dt>
                <dd class="col-sm-7">${formatAccountType(account.type)}</dd>
                
                <dt class="col-sm-5">Durum:</dt>
                <dd class="col-sm-7">${getStatusBadge(account.status)}</dd>
                
                <dt class="col-sm-5">Oluşturulma:</dt>
                <dd class="col-sm-7">${formatDate(account.created_at)}</dd>
                
                <dt class="col-sm-5">Başlangıç Bakiyesi:</dt>
                <dd class="col-sm-7">${formatCurrency(account.initial_balance)}</dd>
            </dl>
        `;
        
        // Hesap bakiye bilgilerini göster
        document.getElementById('accountBalance').innerHTML = `
            <dl class="row mb-0">
                <dt class="col-sm-6">Mevcut Bakiye:</dt>
                <dd class="col-sm-6">
                    <span class="fs-5 fw-bold ${account.balance_calculated < 0 ? 'text-danger' : 'text-success'}">
                        ${formatCurrency(account.balance_calculated)}
                    </span>
                </dd>
                
                <dt class="col-sm-6">Toplam Giriş:</dt>
                <dd class="col-sm-6 text-success">${formatCurrency(account.total_in || 0)}</dd>
                
                <dt class="col-sm-6">Toplam Çıkış:</dt>
                <dd class="col-sm-6 text-danger">${formatCurrency(account.total_out || 0)}</dd>
                
                <dt class="col-sm-6">Son Doğrulama:</dt>
                <dd class="col-sm-6">
                    ${account.last_verified_at ? formatDate(account.last_verified_at) : 'Yok'}
                </dd>
            </dl>
        `;
        
        // Hesap hareketlerini yükle
        await loadAccountMovements(id);
        
        // Modalı göster
        accountDetailModal.show();
    } catch (error) {
        console.error('Account detail error:', error);
        showError('Hesap detayları yüklenemedi');
    }
}

// Hesap hareketlerini yükle
async function loadAccountMovements(id) {
    try {
        const response = await fetchAPI(`/finance/accounts/${id}/movements`);
        if (!response.success) throw new Error(response.error);
        
        const movements = response.movements || [];
        
        // Hesap hareketlerini tabloya ekle
        const tbody = document.getElementById('accountMovements');
        
        if (movements.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center">Henüz hareket bulunamadı</td></tr>`;
            return;
        }
        
        tbody.innerHTML = movements.map(movement => `
            <tr>
                <td>${formatDate(movement.date)}</td>
                <td>
                    <span class="badge ${movement.type === 'in' ? 'bg-success' : 'bg-danger'}">
                        ${movement.type === 'in' ? 'Giriş' : 'Çıkış'}
                    </span>
                </td>
                <td>${movement.description || '-'}</td>
                <td class="text-end ${movement.type === 'in' ? 'text-success' : 'text-danger'}">
                    ${formatCurrency(movement.amount)}
                </td>
                <td class="text-end ${movement.balance_after < 0 ? 'text-danger' : ''}">
                    ${formatCurrency(movement.balance_after)}
                </td>
            </tr>
        `).join('');
        
        // Ayrıca ana sayfadaki hareketler tablosunu da güncelle
        document.getElementById('movementsTable').innerHTML = movements.slice(0, 10).map(movement => `
            <tr>
                <td>${formatDate(movement.date)}</td>
                <td>${getAccountById(movement.account_id)?.name || '-'}</td>
                <td>
                    <span class="badge ${movement.type === 'in' ? 'bg-success' : 'bg-danger'}">
                        ${movement.type === 'in' ? 'Giriş' : 'Çıkış'}
                    </span>
                </td>
                <td>${movement.description || '-'}</td>
                <td class="text-end ${movement.type === 'in' ? 'text-success' : 'text-danger'}">
                    ${formatCurrency(movement.amount)}
                </td>
                <td class="text-end ${movement.balance_after < 0 ? 'text-danger' : ''}">
                    ${formatCurrency(movement.balance_after)}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Account movements error:', error);
        document.getElementById('accountMovements').innerHTML = 
            `<tr><td colspan="5" class="text-center text-danger">Hesap hareketleri yüklenemedi</td></tr>`;
    }
}

// Hesap düzenleme formunu aç
function editAccountForm() {
    if (!currentAccountId) return;
    
    const account = getAccountById(currentAccountId);
    if (!account) return;
    
    // Form değerlerini ayarla
    const form = document.getElementById('accountForm');
    form.reset();
    
    document.getElementById('account_id').value = account.id;
    form.elements.name.value = account.name;
    form.elements.type.value = account.type;
    form.elements.initial_balance.value = account.initial_balance;
    form.elements.status.value = account.status;
    
    // Başlığı değiştir
    document.getElementById('accountModalTitle').textContent = 'Hesap Düzenle';
    
    // Düzenleme modunu aktif et
    isEditMode = true;
    
    // Detay modalını kapat ve düzenleme modalını aç
    accountDetailModal.hide();
    accountModal.show();
}

// Hesap silme onayı
function confirmDeleteAccount() {
    if (!currentAccountId) return;
    
    if (confirm('Bu hesabı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
        deleteAccount(currentAccountId);
    }
}

// Hesap silme işlemi
async function deleteAccount(id) {
    try {
        const response = await fetchAPI(`/finance/accounts/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.success) throw new Error(response.error);
        
        // Modalı kapat ve hesapları yeniden yükle
        accountDetailModal.hide();
        currentAccountId = null;
        
        showSuccess('Hesap başarıyla silindi');
        await loadAccounts();
        
    } catch (error) {
        console.error('Account delete error:', error);
        showError('Hesap silinirken hata oluştu');
    }
}

// Hesap kaydet (yeni veya düzenleme)
async function saveAccount() {
    const form = document.getElementById('accountForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        let url = '/finance/accounts';
        let method = 'POST';
        
        // Düzenleme modu ise
        if (isEditMode && data.id) {
            url = `/finance/accounts/${data.id}`;
            method = 'PUT';
            delete data.id;
        }
        
        // Sayısal değerleri parse et
        data.initial_balance = parseFloat(data.initial_balance) || 0;
        
        const response = await fetchAPI(url, {
            method,
            body: JSON.stringify(data)
        });
        
        if (!response.success) throw new Error(response.error);
        
        // Modalı kapat ve hesapları yeniden yükle
        accountModal.hide();
        showSuccess(`Hesap ${isEditMode ? 'güncellendi' : 'oluşturuldu'}`);
        isEditMode = false;
        await loadAccounts();
        
    } catch (error) {
        console.error('Account save error:', error);
        showError('Hesap kaydedilirken hata oluştu');
    }
}

// Transfer modalı hesap seçimlerini doldur
function populateAccountSelects() {
    // Aktif hesapları filtrele
    const activeAccounts = accounts.filter(a => a.status === 'active');
    
    const sourceSelect = document.querySelector('select[name="source_account_id"]');
    const targetSelect = document.querySelector('select[name="target_account_id"]');
    
    // İlk seçenekleri sakla
    const sourceFirstOption = sourceSelect.querySelector('option:first-child');
    const targetFirstOption = targetSelect.querySelector('option:first-child');
    
    // Seçim listelerini temizle
    sourceSelect.innerHTML = '';
    targetSelect.innerHTML = '';
    
    // İlk seçenekleri geri ekle
    sourceSelect.appendChild(sourceFirstOption);
    targetSelect.appendChild(targetFirstOption);
    
    // Aktif hesapları listelere ekle
    activeAccounts.forEach(account => {
        // Kaynak hesap seçeneği
        const sourceOption = document.createElement('option');
        sourceOption.value = account.id;
        sourceOption.textContent = `${account.name} (${formatAccountType(account.type)}) - ${formatCurrency(account.balance_calculated)}`;
        sourceSelect.appendChild(sourceOption);
        
        // Hedef hesap seçeneği
        const targetOption = document.createElement('option');
        targetOption.value = account.id;
        targetOption.textContent = `${account.name} (${formatAccountType(account.type)})`;
        targetSelect.appendChild(targetOption);
    });
}

// Hesaplar arası para transferi
async function performTransfer() {
    const form = document.getElementById('transferForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Aynı hesaba transfer kontrolü
    if (data.source_account_id === data.target_account_id) {
        showError('Kaynak ve hedef hesap aynı olamaz');
        return;
    }
    
    try {
        // Transfer işlemine ait verileri hazırla
        const transferData = {
            source_account_id: parseInt(data.source_account_id),
            target_account_id: parseInt(data.target_account_id),
            amount: parseFloat(data.amount),
            date: data.date,
            description: data.description || 'Hesaplar arası transfer'
        };
        
        // API'ye gönder
        const response = await fetchAPI('/finance/transfer', {
            method: 'POST',
            body: JSON.stringify(transferData)
        });
        
        if (!response.success) throw new Error(response.error);
        
        // Modalı kapat ve hesapları yeniden yükle
        transferModal.hide();
        showSuccess('Transfer işlemi başarıyla gerçekleştirildi');
        await loadAccounts();
        
    } catch (error) {
        console.error('Transfer error:', error);
        showError('Transfer işlemi gerçekleştirilemedi');
    }
}

// Hesap ID'ye göre hesap bilgisini döndür
function getAccountById(id) {
    return accounts.find(account => account.id === parseInt(id));
}

// Hesap tipini formatla
function formatAccountType(type) {
    const types = {
        'cash': 'Nakit',
        'bank': 'Banka',
        'pos': 'POS',
        'online': 'Online'
    };
    return types[type] || type;
}

// Hesap durumu badge'i
function getStatusBadge(status) {
    const badges = {
        'active': '<span class="badge bg-success">Aktif</span>',
        'suspended': '<span class="badge bg-warning">Askıda</span>',
        'closed': '<span class="badge bg-secondary">Kapalı</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}