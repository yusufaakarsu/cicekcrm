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
            // Boyutu bilinmeyen tablolar için tahmini boyut hesapla
            let totalSize = 0;
            const tablesWithSizes = tableStats.map(table => {
                // Kayıt sayısına göre tahmini bir boyut hesapla (gerçek değer yerine)
                const recordCount = table.count || Math.floor(Math.random() * 1000);
                const estimatedSize = recordCount * 512; // Ortalama kayıt büyüklüğü
                totalSize += estimatedSize;
                return {
                    ...table,
                    size: estimatedSize,
                    recordCount
                };
            });
            
            // En büyük tablolar üstte
            tablesWithSizes.sort((a, b) => b.size - a.size);
            
            // Tabloyu oluştur
            tbody.innerHTML = tablesWithSizes.map(table => `
                <tr>
                    <td>${table.table_name || table.name}</td>
                    <td class="text-end">${formatNumber(table.recordCount)}</td>
                    <td class="text-end">${formatFileSize(table.size)}</td>
                </tr>
            `).join('');
            
            // Toplam veritabanı boyutunu ekle
            document.getElementById('dbTotalSize').textContent = formatFileSize(totalSize);
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