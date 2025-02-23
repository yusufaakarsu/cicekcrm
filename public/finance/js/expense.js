let expenseModal;
let suppliers = []; // Global tedarikçi listesi
let accounts = [];  // Global hesap listesi
let categories = []; // Global gider kategorileri

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    initExpensePage();
});

async function initExpensePage() {
    await Promise.all([
        loadSuppliers(),
        loadAccounts(),
        loadCategories(),
        loadExpenses()
    ]);
}

async function loadExpenses() {
    try {
        const response = await fetch(`${API_URL}/finance/expenses`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderExpensesTable(data.expenses);
    } catch (error) {
        console.error('Expenses loading error:', error);
        showError('Ödemeler yüklenemedi');
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/finance/categories?type=expense`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        categories = data.categories;
        
        const categorySelects = document.querySelectorAll('select[name="category_id"], #categoryFilter');
        categorySelects.forEach(select => {
            select.innerHTML = `
                <option value="">Seçiniz</option>
                ${categories.map(c => `
                    <option value="${c.id}">${c.name}</option>
                `).join('')}
            `;
        });
    } catch (error) {
        console.error('Categories loading error:', error);
        showError('Kategoriler yüklenemedi');
    }
}

async function loadSuppliers() {
    try {
        const response = await fetch(`${API_URL}/suppliers/active`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        suppliers = data.suppliers;
        
        const supplierSelects = document.querySelectorAll('select[name="supplier_id"], #supplierFilter');
        supplierSelects.forEach(select => {
            select.innerHTML = `
                <option value="">Seçiniz</option>
                ${suppliers.map(s => `
                    <option value="${s.id}">${s.name}</option>
                `).join('')}
            `;
        });
    } catch (error) {
        console.error('Suppliers loading error:', error);
        showError('Tedarikçi listesi yüklenemedi');
    }
}

function renderExpensesTable(expenses) {
    const tbody = document.getElementById('expenseTable');
    
    if (!expenses?.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Ödeme bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = expenses.map(expense => `
        <tr>
            <td>${formatDateTime(expense.date)}</td>
            <td>${expense.supplier_name || '-'}</td>
            <td>
                <span class="badge" style="background-color: ${expense.category_color || '#6c757d'}">
                    ${expense.category_name || '-'}
                </span>
            </td>
            <td>${expense.account_name}</td>
            <td>${expense.description || '-'}</td>
            <td class="text-end text-danger fw-bold">
                ${formatCurrency(expense.amount)}
            </td>
            <td>${getStatusBadge(expense.status)}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="showExpenseDetails(${expense.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${expense.status === 'pending' ? `
                        <button class="btn btn-sm btn-outline-success ms-1" onclick="approveExpense(${expense.id})">
                            <i class="bi bi-check-lg"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

async function approveExpense(id) {
    if (!confirm('Bu ödemeyi onaylamak istediğinize emin misiniz?')) return;

    try {
        const response = await fetch(`${API_URL}/finance/expenses/${id}/approve`, {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('API Hatası');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        await loadExpenses();
        showSuccess('Ödeme onaylandı');
    } catch (error) {
        console.error('Expense approval error:', error);
        showError('Ödeme onaylanamadı');
    }
}

async function saveExpense() {
    const form = document.getElementById('expenseForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const data = {
        ...Object.fromEntries(formData),
        type: 'out'  // Gider işlemi
    };

    try {
        const response = await fetch(`${API_URL}/finance/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        expenseModal.hide();
        await loadExpenses();
        showSuccess('Ödeme kaydedildi');
    } catch (error) {
        console.error('Expense save error:', error);
        showError('Ödeme kaydedilemedi');
    }
}

function showNewExpenseModal() {
    document.getElementById('modalTitle').textContent = 'Yeni Ödeme';
    document.getElementById('expenseForm').reset();
    
    // Bugünün tarihini set et
    document.querySelector('input[name="date"]').value = 
        new Date().toISOString().slice(0, 16);
        
    expenseModal.show();
}

function applyFilters() {
    loadExpenses();
}

// ... diğer fonksiyonlar ...
