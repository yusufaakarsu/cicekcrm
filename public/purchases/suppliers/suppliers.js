let supplierModal;
let currentSupplierId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    loadSuppliers();
    
    supplierModal = new bootstrap.Modal(document.getElementById('supplierModal'));
});

async function loadSuppliers() {
    try {
        const response = await fetch(`${API_URL}/suppliers`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        const tbody = document.querySelector('#suppliersTable tbody');
        
        if (data.suppliers?.length > 0) {
            tbody.innerHTML = data.suppliers.map(supplier => `
                <tr>
                    <td>${supplier.name}</td>
                    <td>${supplier.contact_name || '-'}</td>
                    <td>${supplier.phone}</td>
                    <td>${supplier.email || '-'}</td>
                    <td>${getStatusBadge(supplier.status)}</td>
                    <td>
                        <span class="badge bg-info">${supplier.order_count || 0}</span>
                        <small class="text-muted">(₺${formatPrice(supplier.total_purchases || 0)})</small>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="editSupplier(${supplier.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="toggleStatus(${supplier.id}, '${supplier.status === 'active' ? 'passive' : 'active'}')">
                            <i class="bi bi-power"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tedarikçi bulunamadı</td></tr>';
        }
    } catch (error) {
        console.error('Tedarikçiler yüklenirken hata:', error);
        showError('Tedarikçiler yüklenemedi!');
    }
}

function showCreateModal() {
    currentSupplierId = null;
    document.getElementById('modalTitle').textContent = 'Yeni Tedarikçi';
    document.getElementById('supplierForm').reset();
    supplierModal.show();
}

async function editSupplier(id) {
    try {
        currentSupplierId = id;
        document.getElementById('modalTitle').textContent = 'Tedarikçi Düzenle';
        
        const response = await fetch(`${API_URL}/suppliers/${id}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        const form = document.getElementById('supplierForm');
        Object.keys(data.supplier).forEach(key => {
            if (form.elements[key]) {
                form.elements[key].value = data.supplier[key];
            }
        });
        
        supplierModal.show();
    } catch (error) {
        console.error('Tedarikçi bilgileri yüklenirken hata:', error);
        showError('Tedarikçi bilgileri yüklenemedi!');
    }
}

async function saveSupplier() {
    const form = document.getElementById('supplierForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    // Tablo yapısına uygun data mapping
    const data = {
        name: formData.get('name').trim(),
        contact_name: formData.get('contact_name')?.trim() || null,
        phone: formData.get('phone').trim(),
        email: formData.get('email')?.trim() || null,
        address: formData.get('address')?.trim() || null,
        notes: formData.get('notes')?.trim() || null,
        status: 'active' // Yeni kayıtlar için varsayılan
    };

    try {
        console.log('Saving supplier:', data); // Debug log

        const method = currentSupplierId ? 'PUT' : 'POST';
        const url = currentSupplierId ? 
            `${API_URL}/suppliers/${currentSupplierId}` : 
            `${API_URL}/suppliers`;

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'API Hatası');
        }

        supplierModal.hide();
        form.reset();
        await loadSuppliers();
        
        showSuccess(`Tedarikçi başarıyla ${currentSupplierId ? 'güncellendi' : 'eklendi'}`);
    } catch (error) {
        console.error('Tedarikçi işlem hatası:', error);
        showError(error.message || 'Bir hata oluştu');
    }
}

async function toggleStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_URL}/suppliers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('API Hatası');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        await loadSuppliers();
        showSuccess('Tedarikçi durumu güncellendi');
    } catch (error) {
        console.error('Durum güncellenirken hata:', error);
        showError('Durum güncellenemedi!');
    }
}

// Helper Functions
function getStatusBadge(status) {
    const badges = {
        'active': '<span class="badge bg-success">Aktif</span>',
        'passive': '<span class="badge bg-warning">Pasif</span>',
        'blacklist': '<span class="badge bg-danger">Kara Liste</span>'
    };
    return badges[status] || status;
}
