let materialModal;

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    loadMaterials();
    loadUnits();
    materialModal = new bootstrap.Modal(document.getElementById('materialModal'));
});

async function loadMaterials() {
    try {
        const response = await fetch(`${API_URL}/materials`);
        if (!response.ok) throw new Error('API Hatası');
        const data = await response.json();

        const tbody = document.getElementById('materialsTable');
        
        if (data.materials?.length > 0) {
            tbody.innerHTML = data.materials.map(m => `
                <tr>
                    <td>${m.name}</td>
                    <td>${m.unit_name}</td>
                    <td>${m.current_stock || 0} ${m.unit_code}</td>
                    <td>${m.min_stock || '-'} ${m.unit_code}</td>
                    <td>${getStatusBadge(m.status)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="editMaterial(${m.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="showStockModal(${m.id})">
                            <i class="bi bi-plus-minus"></i>
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

// ... diğer fonksiyonlar (editMaterial, showStockModal vb) eklenecek
