let templateModal;
let editingTemplateId = null;
let messageModal;
let editingMessageId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    
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

async function loadTemplates(category) {
    try {
        const response = await fetch(`${API_URL}/settings/messages?category=${category}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderTemplates(category, data.messages);
    } catch (error) {
        console.error('Templates loading error:', error);
        showError('Mesajlar yüklenemedi');
    }
}

function renderTemplates(category, messages) {
    const tbody = document.getElementById(`${category}Templates`);
    
    if (!messages?.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Mesaj bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = messages.map(msg => `
        <tr>
            <td>${msg.title}</td>
            <td>
                <small class="text-muted">${msg.content}</small>
            </td>
            <td>${msg.category}</td>
            <td>${formatDateTime(msg.created_at)}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editMessage(${msg.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteMessage(${msg.id})">
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
