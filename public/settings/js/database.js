document.addEventListener('DOMContentLoaded', async () => {
    await loadSideBar();
    
    // Veritabanı istatistiklerini yükle
    await loadDatabaseStats();
    
    // Event listeners
    document.getElementById('btnBackup').addEventListener('click', backupDatabase);
    document.getElementById('btnRestore').addEventListener('click', confirmRestore);
});

// Veritabanı istatistiklerini yükle
async function loadDatabaseStats() {
    try {
        const response = await fetchAPI('/settings/database/stats');
        if (!response.success) throw new Error(response.error);
        
        // Özet istatistikleri güncelle
        document.getElementById('customerCount').textContent = formatNumber(response.stats.customers || 0);
        document.getElementById('orderCount').textContent = formatNumber(response.stats.orders || 0);
        document.getElementById('productCount').textContent = formatNumber(response.stats.products || 0);
        document.getElementById('transactionCount').textContent = formatNumber(response.stats.transactions || 0);
        
        // Son yedekleme tarihini güncelle
        if (response.lastBackup) {
            document.getElementById('lastBackupDate').textContent = formatDateTime(response.lastBackup);
        }
        
        // Tablo istatistiklerini güncelle
        const tableStats = response.tableStats || [];
        const tbody = document.getElementById('tableStats');
        
        if (tableStats.length) {
            tbody.innerHTML = tableStats.map(table => `
                <tr>
                    <td>${table.name}</td>
                    <td class="text-end">${formatNumber(table.count)}</td>
                    <td class="text-end">${formatFileSize(table.size)}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">Veri bulunamadı</td></tr>';
        }
    } catch (error) {
        console.error('Database stats loading error:', error);
        showError('Veritabanı istatistikleri yüklenemedi');
        document.getElementById('tableStats').innerHTML = 
            '<tr><td colspan="3" class="text-danger text-center">İstatistikler yüklenemedi!</td></tr>';
    }
}

// Veritabanını yedekle
async function backupDatabase() {
    try {
        document.getElementById('btnBackup').disabled = true;
        document.getElementById('btnBackup').innerHTML = 
            '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Yedekleniyor...';
        
        const response = await fetchAPI('/settings/database/backup', {
            method: 'POST'
        });
        
        if (!response.success) throw new Error(response.error);
        
        // Yedek dosyasını indir
        if (response.downloadUrl) {
            const link = document.createElement('a');
            link.href = response.downloadUrl;
            link.download = `database_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        showSuccess('Veritabanı yedeği başarıyla alındı');
    } catch (error) {
        console.error('Database backup error:', error);
        showError('Veritabanı yedeği alınamadı: ' + error.message);
    } finally {
        document.getElementById('btnBackup').disabled = false;
        document.getElementById('btnBackup').innerHTML = 'Yedekle';
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
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Tablo bulunamadı</td></tr>';
        return;
    }

    tbody.innerHTML = tables.map(table => `
        <tr>
            <td>${table.table_name}</td>
            <td class="text-end">${table.record_count?.toLocaleString() || 0}</td>
            <td class="text-end">${table.column_count || 0} kolon</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" 
                        onclick="queryTable('${table.table_name}')">
                    <i class="bi bi-search"></i> Görüntüle
                </button>
            </td>
        </tr>
    `).join('');
}

// Tablo detay görüntüleme
async function queryTable(tableName) {
    const query = `SELECT * FROM "${tableName}" WHERE tenant_id = ? LIMIT 100`;
    document.getElementById('sqlQuery').value = query;
    
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
        
        // Sorgu alanına scroll
        document.getElementById('querySection').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Query error:', error);
        showError('Tablo görüntülenemedi: ' + error.message);
    }
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
