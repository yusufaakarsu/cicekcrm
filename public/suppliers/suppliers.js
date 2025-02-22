let supplierModal;
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadSuppliers();
});

// Tedarikçileri yükle
async function loadSuppliers() {
    try {
        const response = await fetch(`${API_URL}/suppliers`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        renderSuppliersTable(data.suppliers);
    } catch (error) {
        console.error('Suppliers loading error:', error);
        showError('Tedarikçiler yüklenemedi');
    }
}

// Tabloyu render et
function renderSuppliersTable(suppliers) {
    const tbody = document.getElementById('suppliersTable');
    
    if (!suppliers || suppliers.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="7" class="text-center">Kayıt bulunamadı</td></tr>
        `;
        return;
    }
    
    tbody.innerHTML = suppliers.map(supplier => `
        <tr>
            <td>${supplier.name}</td>
            <td>${supplier.contact_name || '-'}</td>
            <td>${supplier.phone}</td>
            <td>${supplier.email || '-'}</td>
            <td>${supplier.tax_number || '-'}</td>
            <td>${getStatusBadge(supplier.status)}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary me-1" 
                            onclick="editSupplier(${supplier.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" 
                            onclick="deleteSupplier(${supplier.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Durum badge'i
function getStatusBadge(status) {
    const badges = {
        'active': '<span class="badge bg-success">Aktif</span>',
        'passive': '<span class="badge bg-secondary">Pasif</span>',
        'blacklist': '<span class="badge bg-danger">Kara Liste</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

// Yeni tedarikçi modalını göster
function showNewSupplierModal() {
    editingId = null;
    supplierModal = new bootstrap.Modal(document.getElementById('supplierModal'));
    document.getElementById('supplierForm').reset();
    document.querySelector('#supplierModal .modal-title').textContent = 'Yeni Tedarikçi';
    supplierModal.show();
}

// Tedarikçi düzenle
async function editSupplier(id) {
    try {
        const response = await fetch(`${API_URL}/suppliers/${id}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        editingId = id;
        
        const form = document.getElementById('supplierForm');
        for (const [key, value] of Object.entries(data.supplier)) {
            const input = form.elements[key];
            if (input) input.value = value;
        }
        
        document.querySelector('#supplierModal .modal-title').textContent = 'Tedarikçi Düzenle';
        supplierModal = new bootstrap.Modal(document.getElementById('supplierModal'));
        supplierModal.show();
    } catch (error) {
        console.error('Supplier edit error:', error);
        showError('Tedarikçi bilgileri yüklenemedi');
    }
}

// Tedarikçi kaydet
async function saveSupplier() {
    const form = document.getElementById('supplierForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/suppliers/${editingId}` : `${API_URL}/suppliers`;

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');

        supplierModal.hide();
        await loadSuppliers();
        showSuccess(`Tedarikçi başarıyla ${editingId ? 'güncellendi' : 'eklendi'}`);
    } catch (error) {
        console.error('Supplier save error:', error);
        showError('Tedarikçi kaydedilemedi');
    }
}

// Tedarikçi sil
async function deleteSupplier(id) {
    if (!confirm('Bu tedarikçiyi silmek istediğinize emin misiniz?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/suppliers/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('API Hatası');

        await loadSuppliers();
        showSuccess('Tedarikçi başarıyla silindi');
    } catch (error) {
        console.error('Supplier delete error:', error);
        showError('Tedarikçi silinemedi');
    }
}

// Filtreleri uygula
function applyFilters() {
    const search = document.getElementById('searchInput').value;
    const status = document.getElementById('statusFilter').value;
    loadSuppliers(search, status);
}
