let userModal;
let editingUserId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    userModal = new bootstrap.Modal(document.getElementById('userModal'));
    loadUsers();
});

async function loadUsers() {
    try {
        // API endpoint değişti - /settings/users
        const response = await fetch(`${API_URL}/settings/users`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderUsersTable(data.users);
    } catch (error) {
        console.error('Users loading error:', error);
        showError('Kullanıcı listesi yüklenemedi');
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTable');
    
    if (!users?.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Kullanıcı bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${getRoleBadge(user.role)}</td>
            <td>${getStatusBadge(user.status)}</td>
            <td>${user.last_login ? formatDateTime(user.last_login) : '-'}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editUser(${user.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteUser(${user.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function saveUser() {
    const form = document.getElementById('userForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const permissions = Array.from(formData.getAll('permissions'));
    const data = {
        ...Object.fromEntries(formData.entries()),
        permissions
    };

    try {
        const url = editingUserId ? 
            `${API_URL}/settings/users/${editingUserId}` : 
            `${API_URL}/settings/users`;

        const response = await fetch(url, {
            method: editingUserId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        userModal.hide();
        await loadUsers();
        showSuccess(editingUserId ? 'Kullanıcı güncellendi' : 'Kullanıcı oluşturuldu');

    } catch (error) {
        console.error('User save error:', error);
        showError('Kullanıcı kaydedilemedi');
    }
}

async function deleteUser(id) {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;

    try {
        const response = await fetch(`${API_URL}/settings/users/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('API Hatası');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        await loadUsers();
        showSuccess('Kullanıcı silindi');
    } catch (error) {
        console.error('User delete error:', error);
        showError('Kullanıcı silinemedi');
    }
}
