const API_BASE = window.location.hostname.includes('pages.dev') 
    ? 'https://cicek-crm-api.yusufaakarsu.workers.dev'
    : `${window.location.protocol}//${window.location.host}`;

const API_URL = `${API_BASE}/api`;

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    initFinancePage();
});

// Ana sayfa başlatma
function initFinancePage() {
    loadFinanceData();     
    loadPendingPayments(); // Sadece pending payments yükle
    
    // Periyodik güncelleme
    const UPDATE_INTERVAL = 60000; 
    setInterval(() => {
        loadFinanceData();
        loadPendingPayments();
    }, UPDATE_INTERVAL);
}

// Bekleyen ödemeleri yükle
async function loadPendingPayments() {
    try {
        showLoading('pendingPayments');
        const response = await fetch(`${API_URL}/finance/pending`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Veri alınamadı');
        }

        updatePendingPaymentsTable(data.pending);
        hideLoading('pendingPayments');

    } catch (error) {
        console.error('Pending payments error:', error);
        showError('Bekleyen ödemeler alınamadı');
    }
}

function updatePendingPaymentsTable(pending) {
    const tbody = document.getElementById('pendingPaymentsTable');
    
    const allPayments = [
        ...pending.purchases.map(p => ({
            ...p,
            typeText: 'Tedarikçi Ödemesi',
            nameLabel: 'Tedarikçi',
            onclick: `showPaymentModal('out', ${p.id}, 'purchase')`
        })),
        ...pending.orders.map(o => ({
            ...o,
            typeText: 'Sipariş Tahsilatı',
            nameLabel: 'Müşteri',
            onclick: `showPaymentModal('in', ${o.id}, 'order')`
        }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Tabloyu güncelle
    tbody.innerHTML = allPayments.map(p => `
        <tr>
            <td>${formatDate(p.date)}</td>
            <td>${p.typeText}</td>
            <td>${p[p.type === 'purchase' ? 'supplier_name' : 'customer_name']}</td>
            <td class="text-end">${formatMoney(p.amount)}</td>
            <td class="text-end">${formatMoney(p.paid_amount)}</td>
            <td class="text-end">${formatMoney(p.amount - p.paid_amount)}</td>
            <td>
                <button onclick="${p.onclick}" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-arrow-right"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="text-center">Bekleyen ödeme bulunmuyor</td></tr>';
}

// Tek modal fonksiyonu
async function showPaymentModal(paymentType, id, relatedType) {
    try {
        const response = await fetch(`${API_URL}/finance/payments/${relatedType}/${id}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Veri alınamadı');
        }

        // Modal başlığını ayarla
        document.getElementById('modalTitle').textContent = 
            paymentType === 'in' ? 'Tahsilat İşlemi' : 'Ödeme İşlemi';

        // Kişi bilgilerini doldur
        document.getElementById('relatedPerson').textContent = 
            relatedType === 'purchase' ? data.details.supplier_name : data.details.customer_name;
        
        document.getElementById('relatedContact').textContent = 
            relatedType === 'purchase' ? data.details.supplier_contact : data.details.customer_phone;
        
        // Tutar bilgilerini doldur
        document.getElementById('totalAmount').textContent = formatMoney(data.details.total_amount);
        document.getElementById('paidAmount').textContent = formatMoney(data.details.paid_amount);
        document.getElementById('remainingAmount').textContent = 
            formatMoney(data.details.total_amount - data.details.paid_amount);

        // Form alanlarını doldur
        const form = document.getElementById('paymentForm');
        form.querySelector('[name="type"]').value = paymentType;
        form.querySelector('[name="related_type"]').value = relatedType;
        form.querySelector('[name="related_id"]').value = id;
        form.querySelector('[name="amount"]').value = data.details.total_amount - data.details.paid_amount;
        form.querySelector('[name="date"]').value = new Date().toISOString().slice(0, 16);

        // Hesap listesini doldur
        const accountSelect = form.querySelector('[name="account_id"]');
        accountSelect.innerHTML = data.accounts.map(a => 
            `<option value="${a.id}">${a.name}</option>`
        ).join('');

        // Modal'ı göster
        const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
        modal.show();

    } catch (error) {
        console.error('Payment modal error:', error);
        showError('Ödeme detayları alınamadı');
    }
}

// Tek kaydetme fonksiyonu
async function savePayment() {
    const form = document.getElementById('paymentForm');
    if (!form) {
        showError('Form bulunamadı');
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_URL}/finance/payments`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                ...data,
                amount: parseFloat(data.amount) // string -> number
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'İşlem kaydedilemedi');
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error);
        }

        bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
        loadFinanceData();
        loadPendingPayments();
        showSuccess('İşlem başarıyla kaydedildi');

    } catch (error) {
        console.error('Save payment error:', error);
        showError(error.message || 'İşlem kaydedilemedi');
    }
}

async function loadPaymentDetails(mode, id, type) {
    try {
        const response = await fetch(`${API_URL}/finance/payments/${type}/${id}`);
        const data = await response.json();
        
        if (data.success) {
            const form = document.getElementById(`${mode}Form`);
            form.querySelectorAll('[name]').forEach(input => {
                input.value = data[input.name] || '';
            });
        }
    } catch (error) {
        console.error(`Error loading ${mode} details:`, error);
    }
}

async function loadFinanceData() {
    try {
        showLoading('totalBalance');
        const response = await fetch(`${API_URL}/finance/stats`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Veri alınamadı');
        }

        updateFinanceCards(data);
        hideLoading('totalBalance');

    } catch (error) {
        console.error('Finance data error:', error);
        showError('Finansal veriler alınamadı');
        document.getElementById('lastError').textContent = error.message;
    }    
}

// Hata yönetimini iyileştir
async function loadRecentTransactions() {
    try {
        showLoading('transactionsTable');
        const response = await fetch(`${API_URL}/finance/transactions`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'İşlemler alınamadı');
        }

        updateTransactionsTable(data.transactions);
        hideLoading('transactionsTable');

    } catch (error) {
        console.error('Transactions error:', error);
        showError('İşlem geçmişi alınamadı');
        // lastError hatası için kontrol ekle
        const lastError = document.getElementById('lastError');
        if (lastError) {
            lastError.textContent = error.message;
        }
    }
}

function updateFinanceCards(data) {
    document.getElementById('totalBalance').textContent = formatMoney(data.balances?.total_balance || 0);
    document.getElementById('accountCount').textContent = `${data.balances?.total_accounts || 0} aktif hesap`;
    document.getElementById('dailyIncome').textContent = formatMoney(data.dailyStats?.income || 0);
    document.getElementById('dailyExpense').textContent = formatMoney(data.dailyStats?.expense || 0);
    document.getElementById('pendingPayments').textContent = formatMoney(data.pendingPayments || 0);
}

function updateTransactionsTable(transactions) {
    const tbody = document.getElementById('transactionsTable'); // ID değişti
    
    if (!tbody) {
        console.warn('Transactions table not found');
        return;
    }

    if (!transactions?.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">İşlem bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => `
        <tr>
            <td>${formatDate(t.date)}</td>
            <td>${t.description || '-'}</td>
            <td>${t.type === 'in' ? 'Gelir' : 'Gider'}</td>
            <td>${t.account_name || '-'}</td>
            <td class="text-end ${t.type === 'in' ? 'text-success' : 'text-danger'}">
                ${formatMoney(t.amount)}
            </td>
        </tr>
    `).join('');
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

function formatMoney(amount) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(amount);
}

function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('loading');
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('loading');
    }
}