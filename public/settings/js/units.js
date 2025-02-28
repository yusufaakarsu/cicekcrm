let unitModal;
let units = [];
let isEditMode = false;
let currentUnitId = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadSideBar();
    
    // Modal referansı
    unitModal = new bootstrap.Modal(document.getElementById('unitModal'));
    
    // Birimleri yükle
    await loadUnits();
    
    // Event listeners
    document.getElementById('saveUnit').addEventListener('click', saveUnit);
    
    // Form reset
    document.getElementById('unitModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('unitForm').reset();
        isEditMode = false;
        currentUnitId = null;
        document.getElementById('unitModalTitle').textContent = 'Yeni Birim';
    });
});

// Birimleri yükle
async function loadUnits() {
    try {
        const response = await fetchAPI('/settings/units');
        if (!response.success) throw new Error(response.error);
        
        units = response.units || [];
        
        // Tabloyu render et
        renderUnitsTable();
    } catch (error) {
        console.error('Units loading error:', error);
        showError('Birimler yüklenemedi');
        document.getElementById('unitsTable').innerHTML = 
            '<tr><td colspan="4" class="text-danger text-center py-4">Birimler yüklenemedi!</td></tr>';
    }
}

// Birimler tablosunu render et
function renderUnitsTable() {
    const tbody = document.getElementById('unitsTable');
    
    if (!units.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Kayıt bulunamadı</td></tr>';
        return;
    }
    
    tbody.innerHTML = units.map(unit => `
        <tr>
            <td>${unit.name}</td>
            <td><span class="badge bg-secondary">${unit.code}</span></td>
            <td>${unit.description || '-'}</td>
            <td class="text-end">
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editUnit(${unit.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUnit(${unit.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Düzenleme için birim formunu aç
function editUnit(id) {
    const unit = units.find(u => u.id === id);
    if (!unit) return;
    
    currentUnitId = id;
    isEditMode = true;
    
    // Form değerlerini ayarla
    document.getElementById('unit_id').value = unit.id;
    document.getElementById('unitForm').elements.name.value = unit.name;
    document.getElementById('unitForm').elements.code.value = unit.code;
    document.getElementById('unitForm').elements.description.value = unit.description || '';
    
    // Modal başlığını güncelle
    document.getElementById('unitModalTitle').textContent = 'Birim Düzenle';
    
    // Modalı göster
    unitModal.show();
}

// Birim sil
async function deleteUnit(id) {
    if (!confirm('Bu birimi silmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetchAPI(`/settings/units/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.success) throw new Error(response.error);
        
        showSuccess('Birim başarıyla silindi');
        await loadUnits();
    } catch (error) {
        console.error('Unit delete error:', error);
        showError('Birim silinemedi');
    }
}

// Birim kaydet
async function saveUnit() {
    const form = document.getElementById('unitForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    try {
        const formData = {
            name: form.elements.name.value,
            code: form.elements.code.value,
            description: form.elements.description.value
        };
        
        let url = '/settings/units';
        let method = 'POST';
        
        if (isEditMode) {
            url = `/settings/units/${currentUnitId}`;
            method = 'PUT';
        }
        
        const response = await fetchAPI(url, {
            method,
            body: JSON.stringify(formData)
        });
        
        if (!response.success) throw new Error(response.error);
        
        unitModal.hide();
        showSuccess(`Birim başarıyla ${isEditMode ? 'güncellendi' : 'eklendi'}`);
        await loadUnits();
    } catch (error) {
        console.error('Unit save error:', error);
        showError('Birim kaydedilemedi');
    }
}
