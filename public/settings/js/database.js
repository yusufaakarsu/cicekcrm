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
        document.getElementById('totalRecords').textContent = data.total_records.toLocaleString();
        document.getElementById('totalTables').textContent = data.total_tables;
        document.getElementById('databaseSize').textContent = formatFileSize(data.size);
        document.getElementById('lastBackup').textContent = data.last_backup 
            ? formatDateTime(data.last_backup) 
            : 'Hiç yedeklenmemiş';
    } catch (error) {
        console.error('Database stats error:', error);
        showError('Veritabanı istatistikleri alınamadı');
    }
}

async function executeQuery() {
    const query = document.getElementById('sqlQuery').value.trim();
    if (!query) return;

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
                <thead>
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
        </div>
    `;
}

// ... diğer fonksiyonlar eklenecek ...
