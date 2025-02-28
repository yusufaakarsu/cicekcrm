let regionModal;
let regions = [];
let isEditMode = false;
let currentRegionId = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadSideBar();
    
    // Modal referansı
    regionModal = new bootstrap.Modal(document.getElementById('regionModal'));
    
    // Bölgeleri yükle
    await loadRegions();
    
    // Event listeners
    document.getElementById('saveRegion').addEventListener('click', saveRegion);
    
    // Form reset
    document.getElementById('regionModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('regionForm').reset();
        isEditMode = false;
        currentRegionId = null;
        document.getElementById('regionModalTitle').textContent = 'Yeni Teslimat Bölgesi';
    });
});

// Bölgeleri yükle
async function loadRegions() {
    try {
        const response = await fetchAPI('/settings/regions');
        if (!response.success) throw new Error(response.error);
        
        regions = response.regions || [];
        
        // Tabloyu render et
        renderRegionsTable();
    } catch (error) {
        console.error('Regions loading error:', error);
        showError('Bölgeler yüklenemedi');
        document.getElementById('regionsTable').innerHTML = 
            '<tr><td colspan="4" class="text-danger text-center py-4">Bölgeler yüklenemedi!</td></tr>';
    }
}

// Bölgeler tablosunu render et
function renderRegionsTable() {
    const tbody = document.getElementById('regionsTable');
    
    if (!regions.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Kayıt bulunamadı</td></tr>';
        return;
    }
    
    tbody.innerHTML = regions.map(region => `
        <tr>
            <td>${region.name}</td>
            <td class="text-end">${formatCurrency(region.base_fee)}</td>
            <td class="text-center">
                ${region.is_active ? 
                    '<span class="badge bg-success">Aktif</span>' : 
                    '<span class="badge bg-secondary">Pasif</span>'}
            </td>
            <td class="text-end">
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editRegion(${region.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteRegion(${region.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Düzenleme için bölge formunu aç
function editRegion(id) {
    const region = regions.find(r => r.id === id);
    if (!region) return;
    
    currentRegionId = id;
    isEditMode = true;
    
    // Form değerlerini ayarla
    document.getElementById('region_id').value = region.id;
    document.getElementById('regionForm').elements.name.value = region.name;
    document.getElementById('regionForm').elements.base_fee.value = region.base_fee;
    document.getElementById('is_active').checked = region.is_active;
    
    // Modal başlığını güncelle
    document.getElementById('regionModalTitle').textContent = 'Bölge Düzenle';
    
    // Modalı göster
    regionModal.show();
}

// Bölge sil
async function deleteRegion(id) {
    if (!confirm('Bu bölgeyi silmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetchAPI(`/settings/regions/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.success) throw new Error(response.error);
        
        showSuccess('Bölge başarıyla silindi');
        await loadRegions();
    } catch (error) {
        console.error('Region delete error:', error);
        showError('Bölge silinemedi');
    }
}

// Bölge kaydet
async function saveRegion() {
    const form = document.getElementById('regionForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    try {
        const formData = {
            name: form.elements.name.value,
            base_fee: parseFloat(form.elements.base_fee.value),
            is_active: form.elements.is_active.checked
        };
        
        let url = '/settings/regions';
        let method = 'POST';
        
        if (isEditMode) {
            url = `/settings/regions/${currentRegionId}`;
            method = 'PUT';
        }
        
        const response = await fetchAPI(url, {
            method,
            body: JSON.stringify(formData)
        });
        
        if (!response.success) throw new Error(response.error);
        
        regionModal.hide();
        showSuccess(`Bölge başarıyla ${isEditMode ? 'güncellendi' : 'eklendi'}`);
        await loadRegions();
    } catch (error) {
        console.error('Region save error:', error);
        showError('Bölge kaydedilemedi');
    }
}
