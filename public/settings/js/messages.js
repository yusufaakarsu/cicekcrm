let templateModal;
let editingTemplateId = null;
let messageModal;
let editingMessageId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    
    templateModal = new bootstrap.Modal(document.getElementById('templateModal'));
    messageModal = new bootstrap.Modal(document.getElementById('templateModal'));
    
    // Tab değişiminde şablonları yükle
    document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', (e) => {
            const type = e.target.getAttribute('href').replace('#', '');
            loadTemplates(type);
        });
    });

    // İlk yükleme
    loadTemplates('sms');
});

async function loadTemplates(type) {
    try {
        const response = await fetch(`${API_URL}/settings/message-templates?type=${type}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderTemplates(type, data.templates);
    } catch (error) {
        console.error('Templates loading error:', error);
        showError('Şablonlar yüklenemedi');
    }
}

function renderTemplates(type, templates) {
    const tbody = document.getElementById(`${type}Templates`);
    
    if (!templates?.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Şablon bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = templates.map(template => `
        <tr>
            <td>${template.name}</td>
            <td>
                <small class="text-muted">${template.content}</small>
            </td>
            <td>
                ${template.variables.map(v => `
                    <span class="badge bg-secondary">${v}</span>
                `).join(' ')}
            </td>
            <td>${formatDateTime(template.updated_at)}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editTemplate(${template.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteTemplate(${template.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function saveTemplate() {
    const form = document.getElementById('templateForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const variables = extractVariables(formData.get('content'));
    const data = {
        ...Object.fromEntries(formData.entries()),
        variables
    };

    try {
        const url = editingMessageId ? 
            `${API_URL}/settings/message-templates/${editingMessageId}` : 
            `${API_URL}/settings/message-templates`;

        const response = await fetch(url, {
            method: editingMessageId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        messageModal.hide();
        await loadTemplates(data.type);
        showSuccess(editingMessageId ? 'Şablon güncellendi' : 'Şablon oluşturuldu');

    } catch (error) {
        console.error('Template save error:', error);
        showError('Şablon kaydedilemedi');
    }
}

// Mesaj içindeki değişkenleri tespit et
function extractVariables(content) {
    const matches = content.match(/{[^}]+}/g);
    return matches ? matches.map(v => v.replace(/[{}]/g, '')) : [];
}

// ... saveTemplate, editTemplate, deleteTemplate fonksiyonları eklenecek ...
