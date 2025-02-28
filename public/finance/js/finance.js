// Dashboard için global değişkenler
let incomeExpenseChart;
let accounts = [];
let categories = [];

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    await loadSideBar();
    
    // Bugünün tarihini varsayılan olarak ayarla
    document.querySelector('input[name="date"]').valueAsDate = new Date();
    
    // Veri yükleme işlemleri
    await Promise.all([
        loadFinancialStats(),
        loadChart('year'),
        loadRecentTransactions(),
        loadPendingPayments(),
        loadAccounts(),
        loadCategories()
    ]);
    
    // Event listeners
    document.getElementById('chartPeriodYear').addEventListener('click', () => {
        document.getElementById('chartPeriodYear').classList.add('active');
        document.getElementById('chartPeriodMonth').classList.remove('active');
        loadChart('year');
    });
    
    document.getElementById('chartPeriodMonth').addEventListener('click', () => {
        document.getElementById('chartPeriodMonth').classList.add('active');
        document.getElementById('chartPeriodYear').classList.remove('active');
        loadChart('month');
    });
    
    document.getElementById('saveTransaction').addEventListener('click', saveTransaction);
    document.getElementById('savePayment').addEventListener('click', savePayment);
    
    // İşlem tipine göre kategori filtreleme
    document.querySelectorAll('input[name="type"]').forEach(radio => {
        radio.addEventListener('change', updateCategoryOptions);
    });
});

// Finansal istatistikleri yükle
async function loadFinancialStats() {
    try {
        const response = await fetchAPI('/finance/stats');
        if (!response.success) throw new Error(response.error);
        
        // Özet kartlarını doldur
        document.getElementById('totalBalance').textContent = formatCurrency(response.balances.total_balance);
        document.getElementById('totalAccounts').textContent = `${response.balances.total_accounts} aktif hesap`;
        
        document.getElementById('dailyIncome').textContent = formatCurrency(response.dailyStats.income);
        document.getElementById('dailyIncomeCount').textContent = `${response.dailyStats.income_count || 0} işlem`;
        
        document.getElementById('dailyExpense').textContent = formatCurrency(response.dailyStats.expense);
        document.getElementById('dailyExpenseCount').textContent = `${response.dailyStats.expense_count || 0} işlem`;
        
        document.getElementById('pendingPayments').textContent = formatCurrency(response.pendingPayments);
    } catch (error) {
        console.error('Stats loading error:', error);
        showError('Finansal veriler yüklenemedi');
    }
}

// Gelir/Gider grafiği için verileri yükle
async function loadChart(period = 'year') {
    try {
        const response = await fetchAPI('/finance/reports/income-expense');
        if (!response.success) throw new Error(response.error);
        
        // Chart verilerini hazırla
        const labels = response.labels.map(formatMonthLabel);
        const datasets = [
            {
                label: 'Gelir',
                data: response.income,
                backgroundColor: 'rgba(40, 167, 69, 0.2)',
                borderColor: 'rgba(40, 167, 69, 1)',
                borderWidth: 1
            },
            {
                label: 'Gider',
                data: response.expense,
                backgroundColor: 'rgba(220, 53, 69, 0.2)',
                borderColor: 'rgba(220, 53, 69, 1)',
                borderWidth: 1
            }
        ];
        
        // Grafiği oluştur veya güncelle
        renderChart(labels, datasets);
    } catch (error) {
        console.error('Chart loading error:', error);
        showError('Grafik verileri yüklenemedi');
    }
}

// Gelir/Gider grafiği render
function renderChart(labels, datasets) {
    const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
    
    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }
    
    incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value)
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            }
        }
    });
}

// Son işlemleri yükle
async function loadRecentTransactions() {
    try {
        const response = await fetchAPI('/finance/transactions?limit=10');
        if (!response.success) throw new Error(response.error);
        
        const tbody = document.getElementById('recentTransactions');
        
        if (response.transactions.length > 0) {
            tbody.innerHTML = response.transactions.map(transaction => `
                <tr>
                    <td>${formatDate(transaction.date)}</td>
                    <td>${transaction.description || '-'}</td>
                    <td>${transaction.category_name}</td>
                    <td class="text-end ${transaction.type === 'in' ? 'text-success' : 'text-danger'}">
                        ${transaction.type === 'in' ? '+' : '-'} ${formatCurrency(transaction.amount)}
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">İşlem bulunamadı</td></tr>';
        }
    } catch (error) {
        console.error('Recent transactions loading error:', error);
        document.getElementById('recentTransactions').innerHTML = 
            '<tr><td colspan="4" class="text-danger text-center">İşlemler yüklenemedi</td></tr>';
    }
}

// Bekleyen ödemeleri yükle
async function loadPendingPayments() {
    try {
        const response = await fetchAPI('/finance/pending');
        if (!response.success) throw new Error(response.error);
        
        // Tedarikçi ödemeleri
        const purchasesEl = document.getElementById('pendingPurchases');
        if (response.pending.purchases.length > 0) {
            purchasesEl.innerHTML = response.pending.purchases.map(purchase => `
                <tr>
                    <td>#${purchase.id}</td>
                    <td>${purchase.supplier_name}</td>
                    <td>${formatDate(purchase.date)}</td>
                    <td class="text-end">${formatCurrency(purchase.amount)}</td>
                    <td class="text-end">${formatCurrency(purchase.amount - purchase.paid_amount)}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary"
                                onclick="showPayment('purchase', ${purchase.id}, 'out')">
                            <i class="bi bi-cash"></i> Öde
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            purchasesEl.innerHTML = '<tr><td colspan="6" class="text-center">Bekleyen ödeme yok</td></tr>';
        }
        
        // Müşteri ödemeleri
        const ordersEl = document.getElementById('pendingOrders');
        if (response.pending.orders.length > 0) {
            ordersEl.innerHTML = response.pending.orders.map(order => `
                <tr>
                    <td>#${order.id}</td>
                    <td>${order.customer_name}</td>
                    <td>${formatDate(order.date)}</td>
                    <td class="text-end">${formatCurrency(order.amount)}</td>
                    <td class="text-end">${formatCurrency(order.amount - order.paid_amount)}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-success"
                                onclick="showPayment('order', ${order.id}, 'in')">
                            <i class="bi bi-cash"></i> Tahsil Et
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            ordersEl.innerHTML = '<tr><td colspan="6" class="text-center">Bekleyen tahsilat yok</td></tr>';
        }
    } catch (error) {
        console.error('Pending payments loading error:', error);
        document.getElementById('pendingPurchases').innerHTML = 
            '<tr><td colspan="6" class="text-danger text-center">Veriler yüklenemedi</td></tr>';
        document.getElementById('pendingOrders').innerHTML = 
            '<tr><td colspan="6" class="text-danger text-center">Veriler yüklenemedi</td></tr>';
    }
}

// Hesapları yükle
async function loadAccounts() {
    try {
        const response = await fetchAPI('/finance/accounts');
        if (!response.success) throw new Error(response.error);
        
        accounts = response.accounts || [];
        
        // Hesap seçeneklerini doldur
        const accountSelects = document.querySelectorAll('select[name="account_id"]');
        accountSelects.forEach(select => {
            select.innerHTML = `
                <option value="">Seçiniz...</option>
                ${accounts.map(account => `
                    <option value="${account.id}">${account.name} (${formatAccountType(account.type)})</option>
                `).join('')}
            `;
        });
    } catch (error) {
        console.error('Accounts loading error:', error);
        showError('Hesaplar yüklenemedi');
    }
}

// Kategorileri yükle
async function loadCategories() {
    try {
        const response = await fetchAPI('/finance/categories');
        if (!response.success) throw new Error(response.error);
        
        categories = response.categories || [];
        updateCategoryOptions();
    } catch (error) {
        console.error('Categories loading error:', error);
        showError('Kategoriler yüklenemedi');
    }
}

// İşlem tipine göre kategori seçeneklerini güncelle
function updateCategoryOptions() {
    const type = document.querySelector('input[name="type"]:checked').value;
    const select = document.querySelector('select[name="category_id"]');
    
    if (!categories.length) return;
    
    // Filtreleme
    const filteredCategories = categories.filter(cat => 
        cat.type === type || cat.type === 'both'
    );
    
    // Seçenekleri doldur
    select.innerHTML = `
        <option value="">Seçiniz...</option>
        ${filteredCategories.map(cat => `
            <option value="${cat.id}">${cat.name}</option>
        `).join('')}
    `;
}

// Yeni işlem kaydet
async function saveTransaction() {
    const form = document.getElementById('transactionForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        // API'ye gönder
        const response = await fetchAPI('/finance/transactions', {
            method: 'POST',
            body: JSON.stringify({
                ...data,
                amount: parseFloat(data.amount)
            })
        });
        
        if (!response.success) throw new Error(response.error);
        
        // Modal kapat ve sayfayı yenile
        const modal = bootstrap.Modal.getInstance(document.getElementById('newTransactionModal'));
        modal.hide();
        
        showSuccess('İşlem başarıyla kaydedildi');
        
        // Sayfayı yeniden yükle
        setTimeout(() => {
            loadFinancialStats();
            loadRecentTransactions();
            loadChart('year');
        }, 500);
        
    } catch (error) {
        console.error('Transaction save error:', error);
        showError('İşlem kaydedilemedi');
    }
}

// Ödeme işlemi
async function savePayment() {
    const form = document.getElementById('paymentForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        // API'ye gönder
        const response = await fetchAPI('/finance/payments', {
            method: 'POST',
            body: JSON.stringify({
                ...data,
                amount: parseFloat(data.amount)
            })
        });
        
        if (!response.success) throw new Error(response.error);
        
        // Modal kapat ve sayfayı yenile
        const modal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
        modal.hide();
        
        showSuccess('Ödeme işlemi başarıyla kaydedildi');
        
        // Sayfayı yeniden yükle
        setTimeout(() => {
            loadFinancialStats();
            loadRecentTransactions();
            loadPendingPayments();
        }, 500);
        
    } catch (error) {
        console.error('Payment save error:', error);
        showError('Ödeme işlemi kaydedilemedi');
    }
}

// Ödeme modalını göster
async function showPayment(type, id, transactionType) {
    try {
        // Ödeme detayları
        const response = await fetchAPI(`/finance/payments/${type}/${id}`);
        if (!response.success) throw new Error(response.error);
        
        const details = response.details;
        const modal = document.getElementById('paymentModal');
        
        // Form değerlerini ayarla
        const form = document.getElementById('paymentForm');
        form.reset();
        form.elements['related_type'].value = type;
        form.elements['related_id'].value = id;
        form.elements['type'].value = transactionType;
        
        // Tarih alanını bugün olarak ayarla
        form.elements['date'].valueAsDate = new Date();
        
        // Modal başlığını ayarla
        const title = transactionType === 'in' ? 'Tahsilat' : 'Ödeme';
        modal.querySelector('.modal-title').textContent = title + ' İşlemi';
        
        // Detay alanını doldur
        const detailContainer = document.getElementById('paymentDetailsContainer');
        detailContainer.innerHTML = `
            <div class="alert ${transactionType === 'in' ? 'alert-success' : 'alert-info'}">
                <h6>${type === 'order' ? 'Sipariş' : 'Satın Alma'} #${details.id}</h6>
                <div class="row g-2">
                    <div class="col-md-6">
                        <small class="d-block text-muted">${type === 'order' ? 'Müşteri' : 'Tedarikçi'}:</small>
                        <strong>${type === 'order' ? details.customer_name : details.supplier_name}</strong>
                    </div>
                    <div class="col-md-6">
                        <small class="d-block text-muted">Tarih:</small>
                        <strong>${formatDate(details.date)}</strong>
                    </div>
                </div>
                <div class="row g-2 mt-2">
                    <div class="col-md-4">
                        <small class="d-block text-muted">Toplam:</small>
                        <strong>${formatCurrency(details.total_amount)}</strong>
                    </div>
                    <div class="col-md-4">
                        <small class="d-block text-muted">Ödenen:</small>
                        <strong>${formatCurrency(details.paid_amount)}</strong>
                    </div>
                    <div class="col-md-4">
                        <small class="d-block text-muted">Kalan:</small>
                        <strong>${formatCurrency(details.total_amount - details.paid_amount)}</strong>
                    </div>
                </div>
            </div>
        `;
        
        // Ödeme miktarını kalan tutar olarak ayarla
        form.elements['amount'].value = (details.total_amount - details.paid_amount).toFixed(2);
        
        // Hesapları doldur (zaten önceden dolduruldu)
        
        // Modal'ı göster
        const paymentModal = new bootstrap.Modal(modal);
        paymentModal.show();
        
    } catch (error) {
        console.error('Payment details error:', error);
        showError('Ödeme detayları yüklenemedi');
    }
}

// Helper: Hesap tipini formatla
function formatAccountType(type) {
    const types = {
        'cash': 'Nakit',
        'bank': 'Banka',
        'pos': 'POS',
        'online': 'Online'
    };
    return types[type] || type;
}

// Helper: Ay etiketini formatla
function formatMonthLabel(monthStr) {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return new Intl.DateTimeFormat('tr-TR', { month: 'short', year: 'numeric' }).format(date);
}