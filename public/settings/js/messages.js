let messageModal;
let messages = [];
let isEditMode = false;
let currentMessageId = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadSideBar();
    
    // Modal başlatma
    try {
        messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
    } catch (error) {
        console.error('Modal initialization error:', error);
    }
    
    // Mesajları yükle
    await loadMessages();
    
    // Event listeners
    document.getElementById('saveMessage')?.addEventListener('click', saveMessage);
    
    // Kategori filtreleme
    document.querySelectorAll('#messageCategories .nav-link').forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterMessages(category);
        });
    });
    
    // Form reset
    document.getElementById('messageModal')?.addEventListener('hidden.bs.modal', () => {
        document.getElementById('messageForm').reset();
        isEditMode = false;
        currentMessageId = null;
        document.getElementById('messageModalTitle').textContent = 'Yeni Mesaj';
    });
});

// Mesajları yükle
async function loadMessages() {
    try {
        const response = await fetchAPI('/settings/messages');
        if (!response.success) throw new Error(response.error);
        
        messages = response.messages || [];
        
        // Mesajları render et
        renderMessages(messages);
    } catch (error) {
        console.error('Messages loading error:', error);
        showError('Mesajlar yüklenemedi');
        document.getElementById('messagesContainer').innerHTML = 
            '<div class="col-12"><div class="alert alert-danger">Mesajlar yüklenemedi!</div></div>';
    }
}

// Mesajları render et
function renderMessages(messagesToRender) {
    const container = document.getElementById('messagesContainer');
    
    if (!messagesToRender.length) {
        container.innerHTML = '<div class="col-12"><div class="alert alert-info">Kayıt bulunamadı</div></div>';
        return;
    }
    
    container.innerHTML = messagesToRender.map(message => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span class="badge bg-${getCategoryBadge(message.category)}">${formatCategory(message.category)}</span>
                    <div>
                        ${message.is_active ? 
                            '<span class="badge bg-success">Aktif</span>' : 
                            '<span class="badge bg-secondary">Pasif</span>'}
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${message.title}</h5>
                    <p class="card-text text-muted">${message.content}</p>
                </div>
                <div class="card-footer d-flex justify-content-end">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editMessage(${message.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteMessage(${message.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Kategori badge rengi
function getCategoryBadge(category) {
    const badges = {
        'birthday': 'primary',
        'anniversary': 'success',
        'special': 'info',
        'love': 'danger',
        'other': 'secondary'
    };
    return badges[category] || 'secondary';
}

// Kategori formatla
function formatCategory(category) {
    const categories = {
        'birthday': 'Doğum Günü',
        'anniversary': 'Yıldönümü',
        'special': 'Özel Gün',
        'love': 'Aşk/Sevgi',
        'other': 'Diğer'
    };
    return categories[category] || category;
}

// Kategori filtrele
function filterMessages(category) {
    if (!category || category === 'all') {
        renderMessages(messages);
        return;
    }
    
    const filtered = messages.filter(m => m.category === category);
    renderMessages(filtered);
}

// Mesaj düzenle
function editMessage(id) {
    const message = messages.find(m => m.id === id);
    if (!message) return;
    
    currentMessageId = id;
    isEditMode = true;
    
    // Form değerlerini ayarla
    document.getElementById('message_id').value = message.id;
    document.getElementById('messageForm').elements.title.value = message.title;
    document.getElementById('messageForm').elements.category.value = message.category;
    document.getElementById('messageForm').elements.content.value = message.content;
    document.getElementById('is_active').checked = message.is_active;
    
    // Modal başlığını güncelle
    document.getElementById('messageModalTitle').textContent = 'Mesajı Düzenle';
    
    // Modalı göster
    messageModal?.show();
}
