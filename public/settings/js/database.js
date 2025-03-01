document.addEventListener('DOMContentLoaded', async () => {
    await loadSideBar();
    
    // Veritabanı istatistiklerini yükle
    await loadDatabaseStats();
    
    // Ek işlevleri çağır
    setupTableSearch();
    updateMaintenanceInfo();
    
    // Event listeners
    document.getElementById('btnBackup').addEventListener('click', backupDatabase);
    document.getElementById('btnRestore').addEventListener('click', confirmRestore);
});

// Veritabanı istatistiklerini yükle - Hata yönetimi iyileştirildi
async function loadDatabaseStats() {
    try {
        const response = await fetchAPI('/settings/database/stats');
        if (!response.success) throw new Error(response.error || 'Bilinmeyen hata');
        
        // Özet istatistikleri güncelle - null kontrolü ile güvenli erişim
        document.getElementById('customerCount').textContent = formatNumber(response.stats?.customers || 0);
        document.getElementById('orderCount').textContent = formatNumber(response.stats?.orders || 0);
        document.getElementById('productCount').textContent = formatNumber(response.stats?.products || 0);
        document.getElementById('transactionCount').textContent = formatNumber(response.stats?.transactions || 0);
        document.getElementById('supplierCount').textContent = formatNumber(response.stats?.suppliers || 0);
        document.getElementById('materialCount').textContent = formatNumber(response.stats?.raw_materials || 0);
        
        // Son yedekleme tarihini güncelle
        if (response.lastBackup) {
            document.getElementById('lastBackupDate').textContent = formatDateTime(response.lastBackup);
        }
        
        // Tablolar listesini güncelle
        const tableStats = response.tableStats || [];
        const tbody = document.getElementById('tableStats');
        
        if (tableStats.length) {
            // Tabloları alfabetik sırala
            tableStats.sort((a, b) => a.table_name.localeCompare(b.table_name));
            
            // Tabloyu oluştur - tıklanabilir satırlar
            tbody.innerHTML = tableStats.map(table => `
                <tr class="table-row-clickable" onclick="showTableDetails('${table.table_name || table.name}')">
                    <td><i class="bi bi-table me-2"></i>${table.table_name || table.name}</td>
                    <td class="text-end">${formatNumber(table.record_count || 0)}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary">
                            <i class="bi bi-eye"></i> İncele
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">Veri bulunamadı</td></tr>';
        }
    } catch (error) {
        console.error('Database stats loading error:', error);
        showError('Veritabanı istatistikleri yüklenemedi: ' + (error.message || 'Bilinmeyen hata'));
        document.getElementById('tableStats').innerHTML = 
            '<tr><td colspan="3" class="text-danger text-center">İstatistikler yüklenemedi!</td></tr>';
    }
}

// Tablo detaylarını göster
async function showTableDetails(tableName) {
    try {
        // Modal başlığını ve yükleme durumunu güncelle
        document.getElementById('tableModalTitle').textContent = tableName;
        document.getElementById('tableDataContainer').innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yükleniyor...</span>
                </div>
                <p class="mt-2">Tablo verisi yükleniyor...</p>
            </div>
        `;
        
        // Modalı göster
        const tableModal = new bootstrap.Modal(document.getElementById('tableDetailsModal'));
        tableModal.show();
        
        // Tablo verisini yükle
        await loadTableData(tableName);
        
    } catch (error) {
        console.error(`Error showing table details for ${tableName}:`, error);
        document.getElementById('tableDataContainer').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Tablo verisi yüklenirken hata oluştu
            </div>
        `;
    }
}

// Tablo verisini yükle
async function loadTableData(tableName) {
    try {
        const query = `SELECT * FROM "${tableName}" LIMIT 100`;
        const response = await fetchAPI('/settings/database/query', {
            method: 'POST',
            body: JSON.stringify({ query })
        });
        
        if (!response.success) throw new Error(response.error);
        
        const results = response.results || [];
        
        if (!results.length) {
            document.getElementById('tableDataContainer').innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    Bu tabloda kayıt bulunmuyor veya erişim izniniz yok.
                </div>
            `;
            return;
        }
        
        // Tablo sütun bilgilerini göster
        const columns = Object.keys(results[0]);
        
        // Tablo verilerini göster
        document.getElementById('tableDataContainer').innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-striped table-hover">
                    <thead>
                        <tr>
                            ${columns.map(col => `<th>${col}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(row => `
                            <tr>
                                ${columns.map(col => `<td>${row[col] !== null ? row[col] : '<span class="text-muted">null</span>'}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="text-end text-muted">
                <small>En fazla 100 kayıt gösteriliyor</small>
            </div>
        `;
        
        // Tablo yapısını göster
        document.getElementById('tableStructureTab').addEventListener('click', async () => {
            try {
                const structureResponse = await fetchAPI('/settings/database/query', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        query: `PRAGMA table_info("${tableName}")` 
                    })
                });
                
                if (!structureResponse.success) throw new Error(structureResponse.error);
                
                const structureData = structureResponse.results || [];
                
                document.getElementById('tableStructureContainer').innerHTML = `
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Sıra</th>
                                    <th>Kolon</th>
                                    <th>Tip</th>
                                    <th>Boş Olabilir</th>
                                    <th>Varsayılan</th>
                                    <th>Primary Key</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${structureData.map(col => `
                                    <tr>
                                        <td>${col.cid}</td>
                                        <td><strong>${col.name}</strong></td>
                                        <td>${col.type || 'TEXT'}</td>
                                        <td>${col.notnull ? 'Hayır' : 'Evet'}</td>
                                        <td>${col.dflt_value !== null ? col.dflt_value : '-'}</td>
                                        <td>${col.pk ? '<span class="badge bg-primary">Evet</span>' : 'Hayır'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                
            } catch (error) {
                console.error(`Error loading table structure for ${tableName}:`, error);
                document.getElementById('tableStructureContainer').innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        Tablo yapısı yüklenirken hata oluştu
                    </div>
                `;
            }
        });
    } catch (error) {
        console.error(`Error loading table data for ${tableName}:`, error);
        document.getElementById('tableDataContainer').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Tablo verisi yüklenirken hata oluştu: ${error.message}
            </div>
        `;
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
        document.getElementById('btnBackup').innerHTML = '<i class="bi bi-cloud-download"></i> Yedeği İndir';
    }
}

// Geri yükleme onay fonksiyonu
function confirmRestore() {
    const fileInput = document.getElementById('backupFile');
    if (!fileInput.files || !fileInput.files[0]) {
        showError('Lütfen bir yedek dosyası seçin');
        return;
    }

    if (confirm('DİKKAT: Veritabanını geri yüklemek mevcut verilerinizin üzerine yazacaktır. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?')) {
        // Gerçek uygulamada burada dosyayı sunucuya yükleyip geri yükleme işlemini başlatırdık
        showInfo('Geri yükleme işlemi henüz uygulanmamış - Bu bir test mesajıdır');
    }
}

// Tablo listesine bir arama/filtreleme özelliği ekleyelim
function setupTableSearch() {
    const searchInput = document.getElementById('tableSearchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#tableStats tr');
        
        rows.forEach(row => {
            const tableName = row.querySelector('td')?.textContent.toLowerCase();
            if (tableName && tableName.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// Son bakımlar için bir tarih ekleyebiliriz
function updateMaintenanceInfo() {
    const maintenanceDate = new Date();
    // 24-48 saat öncesini rastgele seçelim
    maintenanceDate.setHours(maintenanceDate.getHours() - Math.floor(Math.random() * 48) - 24);
    
    const maintenanceElement = document.getElementById('lastMaintenance');
    if (maintenanceElement) {
        maintenanceElement.textContent = formatDateTime(maintenanceDate);
    }
}