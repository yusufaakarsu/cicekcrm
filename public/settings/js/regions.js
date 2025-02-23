let regionModal;
let editingRegionId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    regionModal = new bootstrap.Modal(document.getElementById('regionModal'));
    loadRegions();
});

async function loadRegions() {
    try {
        const response = await fetch(`${API_URL}/settings/delivery-regions`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderRegionsList(data.regions);
    } catch (error) {
        console.error('Regions loading error:', error);
        showError('Bölgeler yüklenemedi');
    }
}

function renderRegionsList(regions) {
    const container = document.getElementById('regionsContainer');
    
    if (!regions?.length) {
        container.innerHTML = '<div class="alert alert-info">Henüz teslimat bölgesi eklenmemiş</div>';
        return;
    }

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Bölge Adı</th>
                        <th>Teslimat Ücreti</th>
                        <th>Min. Sipariş</th>
                        <th>Durum</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    ${regions.map(region => `
                        <tr>
                            <td>${region.name}</td>
                            <td>${formatCurrency(region.base_fee)}</td>
                            <td>${formatCurrency(region.min_order)}</td>
                            <td>
                                <span class="badge bg-${region.is_active ? 'success' : 'secondary'}">
                                    ${region.is_active ? 'Aktif' : 'Pasif'}
                                </span>
                            </td>
                            <td>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" onclick="editRegion(${region.id})">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-outline-danger ms-1" onclick="deleteRegion(${region.id})">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function saveRegion() {
    const form = document.getElementById('regionForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
        const url = editingRegionId ? 
            `${API_URL}/settings/regions/${editingRegionId}` : 
            `${API_URL}/settings/regions`;

        const response = await fetch(url, {
            method: editingRegionId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        regionModal.hide();
        await loadRegions();
        showSuccess(editingRegionId ? 'Bölge güncellendi' : 'Bölge oluşturuldu');

    } catch (error) {
        console.error('Region save error:', error);
        showError('Bölge kaydedilemedi');
    }
}

async function editRegion(id) {
    try {
        const response = await fetch(`${API_URL}/settings/regions/${id}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        editingRegionId = id;
        const form = document.getElementById('regionForm');
        const region = data.region;

        // Form alanlarını doldur
        Object.keys(region).forEach(key => {
            if (form.elements[key]) {
                form.elements[key].value = region[key];
            }
        });

        document.getElementById('modalTitle').textContent = 'Bölge Düzenle';
        regionModal.show();

    } catch (error) {
        console.error('Region edit error:', error);
        showError('Bölge bilgileri yüklenemedi');
    }
}

async function deleteRegion(id) {
    if (!confirm('Bu bölgeyi silmek istediğinize emin misiniz?')) return;

    try {
        const response = await fetch(`${API_URL}/settings/regions/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('API Hatası');
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        await loadRegions();
        showSuccess('Bölge silindi');
    } catch (error) {
        console.error('Region delete error:', error);
        showError('Bölge silinemedi');
    }
}

function filterRegions() {
    const searchText = document.getElementById('regionSearch').value.toLowerCase();
    const listItems = document.getElementById('regionsList').children;

    for (let item of listItems) {
        const regionName = item.querySelector('h6')?.textContent.toLowerCase() || '';
        item.style.display = regionName.includes(searchText) ? '' : 'none';
    }
}

function showNewRegionModal() {
    editingRegionId = null;
    document.getElementById('modalTitle').textContent = 'Yeni Bölge';
    document.getElementById('regionForm').reset();
    regionModal.show();
}
