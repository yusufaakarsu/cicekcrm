// Para formatı
function formatCurrency(amount) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(amount);
}

// Ödeme yöntemi formatı
function formatPaymentMethod(method) {
    const methods = {
        'cash': 'Nakit',
        'credit_card': 'Kredi Kartı',
        'bank_transfer': 'Havale/EFT',
        'company_card': 'Şirket Kartı'
    };
    return methods[method] || method;
}

// Kategori renk ayarları
function getCategoryColor(type) {
    return type === 'in' ? '#28a745' : '#dc3545';
}

// Toast mesajları
function showSuccess(message) {
    showToast(message, 'success');
}

function showError(message) {
    showToast(message, 'danger');
}

function showToast(message, type = 'info') {
    const toastHTML = `
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div class="toast align-items-center text-bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', toastHTML);
    const toastEl = document.querySelector('.toast');
    const toast = new bootstrap.Toast(toastEl);
    toast.show();

    // Toast'ı otomatik kaldır
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.parentElement.remove();
    });
}
