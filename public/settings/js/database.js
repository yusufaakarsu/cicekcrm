document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    loadDatabaseStats();
    loadTables();
});

async function loadDatabaseStats() {
    try {
        const response = await fetch(`${API_URL}/settings/database/stats`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        // İstatistikleri güncelle
        document.getElementById('totalRecords').textContent = data.stats.total_records.toLocaleString();
        document.getElementById('totalTables').textContent = data.stats.total_tables;
        document.getElementById('databaseSize').textContent = formatFileSize(data.stats.size || 0);
        document.getElementById('lastBackup').textContent = data.stats.last_backup 
            ? formatDateTime(data.stats.last_backup) 
            : 'Hiç yedeklenmemiş';

    } catch (error) {
        console.error('Database stats error:', error);
        showError('Veritabanı istatistikleri alınamadı');
    }
}

async function loadTables() {
    try {
        const response = await fetch(`${API_URL}/settings/database/tables`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderTablesTable(data.tables);
    } catch (error) {
        console.error('Tables loading error:', error);
        showError('Tablo listesi yüklenemedi');
    }
}

function renderTablesTable(tables) {
    const tbody = document.getElementById('tablesTable');
    
    if (!tables?.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Tablo bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = tables.map(table => `
        <tr>
            <td>${table.table_name}</td>
            <td class="text-end">${table.record_count?.toLocaleString() || 0}</td>
            <td class="text-end">${formatFileSize(table.size || 0)}</td>
            <td>${table.last_updated ? formatDateTime(table.last_updated) : '-'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" 
                        onclick="showTableDetails('${table.table_name}')">
                    <i class="bi bi-search"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function executeQuery() {
    const query = document.getElementById('sqlQuery').value.trim();
    if (!query) return;

    if (!confirm('Bu sorguyu çalıştırmak istediğinize emin misiniz?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/settings/database/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderQueryResult(data.results);
        showSuccess('Sorgu başarıyla çalıştırıldı');
    } catch (error) {
        console.error('Query error:', error);
        showError('Sorgu çalıştırılamadı: ' + error.message);
    }
}

function renderQueryResult(results) {
    const resultDiv = document.getElementById('queryResult');
    
    if (!results?.length) {
        resultDiv.innerHTML = '<div class="alert alert-info">Sonuç bulunamadı</div>';
        return;
    }

    // Tablo oluştur
    const columns = Object.keys(results[0]);
    
    resultDiv.innerHTML = `
        <div class="table-responsive">
            <table class="table table-sm table-bordered">
                <thead class="table-light">
                    <tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${results.map(row => `
                        <tr>
                            ${columns.map(col => `<td>${row[col] ?? ''}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <small class="text-muted">Toplam ${results.length} kayıt gösteriliyor</small>
        </div>
    `;
}

async function backupDatabase() {
    try {
        const response = await fetch(`${API_URL}/settings/database/backup`, {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        // Yedekleme başarılı, dosyayı indir
        const backupUrl = data.backup_url;
        const a = document.createElement('a');
        a.href = backupUrl;
        a.download = `backup_${formatDate(new Date())}.sqlite`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        await loadDatabaseStats(); // İstatistikleri güncelle
        showSuccess('Veritabanı yedeği alındı');
    } catch (error) {
        console.error('Backup error:', error);
        showError('Yedek alınamadı: ' + error.message);
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function refreshTableList() {
    loadTables();
    loadDatabaseStats();
}

// Restore modal için
function showRestoreModal() {
    // TODO: Implement restore functionality
    showError('Bu özellik henüz aktif değil');
}
