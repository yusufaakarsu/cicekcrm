let materialModal;
let currentFilters = {
    search: '',
    category: '',
    status: ''
};

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    loadMaterials();
    loadUnits();
    loadCategories(); // Yeni eklendi
    materialModal = new bootstrap.Modal(document.getElementById('materialModal'));
});

async function loadMaterials() {
    try {
        const queryParams = new URLSearchParams(currentFilters).toString();
        const response = await fetch(`${API_URL}/materials?${queryParams}`);
        if (!response.ok) throw new Error('API Hatası');
        const data = await response.json();

        const tbody = document.getElementById('materialsTable');
        
        if (data.materials?.length > 0) {
            tbody.innerHTML = data.materials.map(m => `
                <tr>
                    <td>
                        <div class="fw-bold">${m.name}</div>
                        <div class="small text-muted">${m.description || ''}</div>
                    </td>
                    <td>${m.category_name || '-'}</td>
                    <td>${m.unit_name}</td>
                    <td>
                        <span class="badge bg-${m.current_stock <= m.min_stock ? 'danger' : 'success'}">
                            ${m.current_stock || 0} ${m.unit_code}
                        </span>
                    </td>
                    <td>${getStatusBadge(m.status)}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary" onclick="showEditModal(${m.id})">
                            <i class="bi bi-pencil"></i> Düzenle
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Ham madde bulunamadı</td></tr>';
        }
    } catch (error) {
        console.error('Ham maddeler yüklenirken hata:', error);
        showError('Ham maddeler yüklenemedi');
    }
}

async function loadUnits() {
    try {
        const response = await fetch(`${API_URL}/materials/units`);
        if (!response.ok) throw new Error('API Hatası');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'API Hatası');
        }

        const unitSelect = document.querySelector('select[name="unit_id"]');
        unitSelect.innerHTML = `
            <option value="">Birim Seçiniz</option>
            ${data.units.map(u => `
                <option value="${u.id}">${u.name} (${u.code})</option>
            `).join('')}
        `;

    } catch (error) {
        console.error('Birimler yüklenemedi:', error);
        showError('Birimler yüklenemedi');
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/materials/categories`);
        if (!response.ok) throw new Error('API Hatası');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'API Hatası');
        }

        // Filtre için kategorileri yükle
        const categoryFilter = document.getElementById('categoryFilter');
        // Modal form için kategorileri yükle
        const categorySelect = document.querySelector('select[name="category_id"]');
        
        const options = data.categories.map(c => 
            `<option value="${c.id}">${c.name}</option>`
        ).join('');

        categoryFilter.innerHTML = `<option value="">Tümü</option>${options}`;
        categorySelect.innerHTML = `<option value="">Seçiniz</option>${options}`;

    } catch (error) {
        console.error('Kategoriler yüklenemedi:', error);
        showError('Kategoriler yüklenemedi');
    }
}

function showNewMaterialModal() {
    document.getElementById('materialForm').reset();
    document.querySelector('.modal-title').innerHTML = `
        <i class="bi bi-box2"></i> Yeni Ham Madde
    `;
    loadUnitsForSelect(); // Birimleri yükle
    materialModal.show();
}

async function loadUnitsForSelect() {
    try {
        // Endpoint düzeltildi: /units -> /materials/units
        const response = await fetch(`${API_URL}/materials/units`);
        if (!response.ok) throw new Error('API Hatası');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'API Hatası');
        }

        const unitSelect = document.querySelector('select[name="unit_id"]');
        
        unitSelect.innerHTML = `
            <option value="">Birim Seçiniz</option>
            ${data.units.map(u => `
                <option value="${u.id}" data-code="${u.code}">
                    ${u.name} (${u.code})
                </option>
            `).join('')}
        `;

    } catch (error) {
        console.error('Birimler yüklenemedi:', error);
        showError('Birimler yüklenemedi');
    }
}

async function saveMaterial() {
    const form = document.getElementById('materialForm');
    
    // Form validasyonu
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_URL}/materials`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'API Hatası');
        }

        showSuccess('Ham madde başarıyla eklendi');
        materialModal.hide();
        loadMaterials(); // Listeyi yenile

    } catch (error) {
        console.error('Kayıt hatası:', error);
        showError('Ham madde eklenemedi: ' + error.message);
    }
}

function getStatusBadge(status) {
    const badges = {
        'active': ['success', 'Aktif'],
        'passive': ['warning', 'Pasif'],
        'archived': ['secondary', 'Arşiv']
    };
    const [color, text] = badges[status] || ['secondary', 'Bilinmiyor'];
    return `<span class="badge bg-${color}">${text}</span>`;
}

function applyFilters() {
    currentFilters = {
        search: document.getElementById('searchInput').value,
        category: document.getElementById('categoryFilter').value,
        status: document.getElementById('statusFilter').value
    };
    loadMaterials();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('statusFilter').value = '';
    currentFilters = {
        search: '',
        category: '',
        status: ''
    };
    loadMaterials();
}

// Düzenleme modalını göster
async function showEditModal(id) {
    try {
        const response = await fetch(`${API_URL}/materials/${id}`);
        if (!response.ok) throw new Error('API Hatası');
        const data = await response.json();

        document.querySelector('.modal-title').innerHTML = `
            <i class="bi bi-pencil"></i> Ham Madde Düzenle
        `;

        // Status select'i göster
        document.getElementById('statusGroup').classList.remove('d-none');
        
        // Form alanlarını doldur
        const form = document.getElementById('materialForm');
        form.elements['name'].value = data.material.name;
        form.elements['category_id'].value = data.material.category_id || '';
        form.elements['unit_id'].value = data.material.unit_id || '';
        form.elements['description'].value = data.material.description || '';
        form.elements['notes'].value = data.material.notes || '';
        form.elements['status'].value = data.material.status;

        // Form elemanlarını readonly yap
        form.elements['name'].readOnly = true;
        form.elements['unit_id'].disabled = true;
        form.elements['category_id'].disabled = true;

        // Modal'ı göster
        materialModal.show();

    } catch (error) {
        console.error('Ham madde detayı alınamadı:', error);
        showError('Ham madde detayı alınamadı');
    }
}

// ... diğer fonksiyonlar (editMaterial, showStockModal vb) eklenecek
