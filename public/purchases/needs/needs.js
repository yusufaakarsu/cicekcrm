// Global değişkenler
let materialNeeds = [];
let categories = [];
let materialDetailModal;
let currentMaterialId = null;
let selectedMaterials = [];

// Sayfa yüklendiğinde çalışacak kod
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Sidebar yükle
        await loadSideBar();
        
        // Modal referansını al
        materialDetailModal = new bootstrap.Modal(document.getElementById('materialDetailModal'));
        
        // Kategorileri yükle
        await loadCategories();
        
        // Zaman aralığı değişimi izle
        document.getElementById('timeRangeFilter').addEventListener('change', handleTimeRangeChange);
        
        // Form submit olayı
        document.getElementById('filterForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await loadNeeds();
        });
        
        // İlk yüklemede ihtiyaçları getir
        await loadNeeds();
    } catch (error) {
        console.error('Sayfa başlatma hatası:', error);
        showError('Sayfa yüklenirken hata oluştu');
    }
});

// Kategorileri yükle
async function loadCategories() {
    try {
        const response = await fetchAPI('/materials/categories');
        
        if (!response.success) throw new Error(response.error || 'Kategoriler yüklenemedi');
        
        categories = response.categories || [];
        
        // Kategori filtresini doldur
        const select = document.getElementById('categoryFilter');
        select.innerHTML = `
            <option value="">Tümü</option>
            ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
        `;
    } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
        showError('Kategoriler yüklenemedi');
    }
}

// Zaman aralığı değişikliğinde özel tarih alanını göster/gizle
function handleTimeRangeChange() {
    const timeRange = document.getElementById('timeRangeFilter').value;
    const customDateGroup = document.getElementById('customDateGroup');
    
    if (timeRange === 'custom') {
        customDateGroup.classList.remove('d-none');
        
        // Bugün ve 30 gün sonrası için varsayılan değerleri ayarla
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);
        
        document.getElementById('startDateFilter').value = formatDateForInput(today);
        document.getElementById('endDateFilter').value = formatDateForInput(nextMonth);
    } else {
        customDateGroup.classList.add('d-none');
    }
}

// İhtiyaçları yükle
async function loadNeeds() {
    try {
        showLoading();
        
        // Filtre değerlerini al
        const timeRange = document.getElementById('timeRangeFilter').value;
        const categoryId = document.getElementById('categoryFilter').value;
        const stockStatus = document.getElementById('stockStatusFilter').value;
        
        // Tarih aralığı parametrelerini hazırla
        let dateParams = '';
        
        if (timeRange === 'custom') {
            const startDate = document.getElementById('startDateFilter').value;
            const endDate = document.getElementById('endDateFilter').value;
            
            if (startDate && endDate) {
                dateParams = `&start_date=${startDate}&end_date=${endDate}`;
            }
        } else {
            dateParams = `&time_range=${timeRange}`;
        }
        
        // API isteği yap - purchases olarak düzeltildi (purchase değil)
        const response = await fetchAPI(`/purchases/needs?category_id=${categoryId}&stock_status=${stockStatus}${dateParams}`);
        
        if (!response.success) throw new Error(response.error || 'İhtiyaçlar yüklenemedi');
        
        materialNeeds = response.needs || [];
        
        // Ham madde ihtiyaçlarını görüntüle
        renderNeeds();
        
        // İhtiyaç özetini güncelle
        updateNeedsSummary();
    } catch (error) {
        console.error('İhtiyaçlar yüklenirken hata:', error);
        showError('İhtiyaçlar yüklenemedi');
    } finally {
        hideLoading();
    }
}

// İhtiyaçları tabloda göster
function renderNeeds() {
    const tbody = document.getElementById('needsTable');
    const cardsContainer = document.getElementById('needsCards');
    
    // İhtiyaç yoksa
    if (!materialNeeds || materialNeeds.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    <i class="bi bi-clipboard-check text-muted" style="font-size: 2rem;"></i>
                    <p class="mt-2 text-muted">Bu kriterlere uygun ihtiyaç bulunamadı.</p>
                </td>
            </tr>
        `;
        cardsContainer.innerHTML = `
            <div class="col-12 text-center py-4">
                <i class="bi bi-clipboard-check text-muted" style="font-size: 2rem;"></i>
                <p class="mt-2 text-muted">Bu kriterlere uygun ihtiyaç bulunamadı.</p>
            </div>
        `;
        return;
    }
    
    // Tablo görünümü
    tbody.innerHTML = materialNeeds.map(need => {
        const statusClass = getStatusClass(need);
        const needAmount = parseFloat(need.needed_quantity) || 0;
        const stockAmount = parseFloat(need.stock_quantity) || 0;
        const missingAmount = Math.max(0, needAmount - stockAmount);
        const stockStatus = getStockStatusBadge(need);
        
        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="status-indicator ${statusClass}"></span>
                        <div>
                            <div class="fw-medium">${need.material_name}</div>
                            <small class="text-muted">${need.material_code || ''}</small>
                        </div>
                    </div>
                </td>
                <td>${need.category_name || '-'}</td>
                <td>${formatNumber(needAmount)} ${need.unit_code}</td>
                <td>${formatNumber(stockAmount)} ${need.unit_code}</td>
                <td>
                    ${missingAmount > 0 ? 
                        `<span class="badge bg-danger">${formatNumber(missingAmount)} ${need.unit_code}</span>` :
                        `<span class="badge bg-success">Yeterli</span>`}
                </td>
                <td>${need.unit_name}</td>
                <td>${need.order_count} sipariş</td>
                <td>${formatCurrency(need.estimated_cost || 0)}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="showMaterialDetail(${need.material_id})">
                            <i class="bi bi-info-circle"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="addToPurchaseList(${need.material_id})">
                            <i class="bi bi-plus-lg"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Kart görünümü
    cardsContainer.innerHTML = materialNeeds.map(need => {
        const statusClass = getStatusClass(need);
        const needAmount = parseFloat(need.needed_quantity) || 0;
        const stockAmount = parseFloat(need.stock_quantity) || 0;
        const missingAmount = Math.max(0, needAmount - stockAmount);
        const stockStatus = getStockStatusBadge(need);
        
        return `
            <div class="col-md-4 col-lg-3">
                <div class="card h-100 material-card">
                    <div class="card-body">
                        <h6 class="card-title d-flex align-items-center">
                            <span class="status-indicator ${statusClass}"></span>
                            ${need.material_name}
                        </h6>
                        <div class="card-text">
                            <small class="text-muted d-block">${need.category_name || '-'}</small>
                            
                            <div class="d-flex justify-content-between align-items-center mt-2">
                                <div>İhtiyaç:</div>
                                <div class="fw-medium">${formatNumber(needAmount)} ${need.unit_code}</div>
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center mt-1">
                                <div>Stokta:</div>
                                <div>${formatNumber(stockAmount)} ${need.unit_code}</div>
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center mt-1">
                                <div>Eksik:</div>
                                <div>
                                    ${missingAmount > 0 ? 
                                        `<span class="badge bg-danger">${formatNumber(missingAmount)} ${need.unit_code}</span>` :
                                        `<span class="badge bg-success">Yeterli</span>`}
                                </div>
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center mt-1">
                                <div>Maliyet:</div>
                                <div>${formatCurrency(need.estimated_cost || 0)}</div>
                            </div>
                            
                            <div class="text-center mt-3">
                                <span class="badge bg-info">
                                    <i class="bi bi-box"></i> ${need.order_count} sipariş
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="btn-group w-100">
                            <button class="btn btn-sm btn-outline-primary flex-grow-1" onclick="showMaterialDetail(${need.material_id})">
                                <i class="bi bi-info-circle"></i> Detay
                            </button>
                            <button class="btn btn-sm btn-outline-success flex-grow-1" onclick="addToPurchaseList(${need.material_id})">
                                <i class="bi bi-plus-lg"></i> Ekle
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Ham madde detayını göster
async function showMaterialDetail(materialId) {
    try {
        currentMaterialId = materialId;
        showLoading();
        
        // API'den ham madde detayını al
        const response = await fetchAPI(`/materials/${materialId}/detail`);
        
        if (!response.success) throw new Error(response.error || 'Detaylar alınamadı');
        
        const material = response.material;
        const needs = response.needs || [];
        
        // Modal başlığını ayarla
        document.getElementById('materialName').textContent = material.name;
        
        // Genel bilgileri doldur
        document.getElementById('materialGeneralInfo').innerHTML = `
            <tr>
                <th>Kategori</th>
                <td>${material.category_name || '-'}</td>
            </tr>
            <tr>
                <th>Birim</th>
                <td>${material.unit_name} (${material.unit_code})</td>
            </tr>
            <tr>
                <th>Açıklama</th>
                <td>${material.description || '-'}</td>
            </tr>
            <tr>
                <th>Ort. Birim Fiyat</th>
                <td>${formatCurrency(material.avg_unit_price || 0)}</td>
            </tr>
        `;
        
        // Stok bilgisini doldur
        document.getElementById('materialStockInfo').innerHTML = `
            <tr>
                <th>Mevcut Stok</th>
                <td>
                    <span class="badge ${material.stock_quantity > 0 ? 'bg-success' : 'bg-danger'}">
                        ${formatNumber(material.stock_quantity || 0)} ${material.unit_code}
                    </span>
                </td>
            </tr>
            <tr>
                <th>Minimum Stok</th>
                <td>${formatNumber(material.min_stock || 0)} ${material.unit_code}</td>
            </tr>
            <tr>
                <th>Toplam İhtiyaç</th>
                <td>
                    <span class="badge bg-primary">
                        ${formatNumber(material.total_needed || 0)} ${material.unit_code}
                    </span>
                </td>
            </tr>
            <tr>
                <th>Eksik Miktar</th>
                <td>
                    <span class="badge ${material.missing_quantity > 0 ? 'bg-danger' : 'bg-success'}">
                        ${formatNumber(material.missing_quantity || 0)} ${material.unit_code}
                    </span>
                </td>
            </tr>
            <tr>
                <th>Tahmini Maliyet</th>
                <td>${formatCurrency(material.estimated_cost || 0)}</td>
            </tr>
        `;
        
        // İhtiyaç kaynağı siparişleri doldur
        document.getElementById('materialSourceOrders').innerHTML = needs.map(need => `
            <tr>
                <td><a href="/orders/detail.html?id=${need.order_id}" target="_blank">#${need.order_number || need.order_id}</a></td>
                <td>${need.product_name}</td>
                <td>${formatNumber(need.quantity)} ${material.unit_code}</td>
                <td>${formatDate(need.delivery_date)}</td>
            </tr>
        `).join('') || '<tr><td colspan="4" class="text-center">Sipariş kaynağı bulunamadı</td></tr>';
        
        // "Satın Alma Listesine Ekle" butonunun durumunu ayarla
        const addButton = document.getElementById('btnAddToPurchase');
        const isMaterialSelected = selectedMaterials.includes(materialId);
        
        addButton.textContent = isMaterialSelected ? 'Listeden Çıkar' : 'Satın Alma Listesine Ekle';
        addButton.className = isMaterialSelected ? 'btn btn-danger' : 'btn btn-primary';
        
        // Butona olay dinleyicisi ekle
        addButton.onclick = () => {
            if (isMaterialSelected) {
                removeFromPurchaseList(materialId);
            } else {
                addToPurchaseList(materialId);
            }
            materialDetailModal.hide();
        };
        
        // Modalı göster
        materialDetailModal.show();
    } catch (error) {
        console.error('Ham madde detayı yüklenirken hata:', error);
        showError('Ham madde detayları alınamadı');
    } finally {
        hideLoading();
    }
}

// Satın alma listesine ekle
function addToPurchaseList(materialId) {
    if (!selectedMaterials.includes(materialId)) {
        selectedMaterials.push(materialId);
        showSuccess('Ham madde satın alma listesine eklendi');
        
        // Ekle butonunu güncelle
        updatePurchaseListUI();
    }
}

// Satın alma listesinden çıkar
function removeFromPurchaseList(materialId) {
    const index = selectedMaterials.indexOf(materialId);
    if (index > -1) {
        selectedMaterials.splice(index, 1);
        showSuccess('Ham madde satın alma listesinden çıkarıldı');
        
        // Ekle butonunu güncelle
        updatePurchaseListUI();
    }
}

// Satın alma listesi UI güncellemesi
function updatePurchaseListUI() {
    // Burada seçili malzemelerin durumunu görsel olarak güncelleme işlemleri yapılabilir
    // Örneğin seçili satırların arka plan rengini değiştirme gibi
}

// Satın alma emri oluştur
function createPurchaseOrder() {
    if (selectedMaterials.length === 0) {
        showError('Lütfen önce satın alma listesine ham madde ekleyin');
        return;
    }
    
    // Satın alma sayfasına yönlendir ve seçili malzemeleri query string ile geçir
    window.location.href = `/purchases/new-purchase.html?materials=${selectedMaterials.join(',')}`;
}

// İhtiyaç özet bilgisini güncelle
function updateNeedsSummary() {
    // Özet bilgileri hesapla
    let totalNeeds = 0;
    let totalMissingItems = 0;
    let totalEstimatedCost = 0;
    let lowStockCount = 0;
    
    materialNeeds.forEach(need => {
        const needAmount = parseFloat(need.needed_quantity) || 0;
        const stockAmount = parseFloat(need.stock_quantity) || 0;
        
        totalNeeds += needAmount;
        const missing = Math.max(0, needAmount - stockAmount);
        
        if (missing > 0) {
            totalMissingItems++;
            totalEstimatedCost += (need.estimated_cost || 0);
        }
        
        // Düşük stok kontrolü
        if (stockAmount < (need.min_stock || 0)) {
            lowStockCount++;
        }
    });
    
    // Özet kartlarını güncelle
    const needsSummary = document.getElementById('needsSummary');
    
    needsSummary.innerHTML = `
        <div class="col-md-3">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <div>
                            <h6 class="text-muted">Toplam İhtiyaç</h6>
                            <h4>${materialNeeds.length} Kalem</h4>
                        </div>
                        <div class="bg-primary bg-opacity-10 d-flex align-items-center justify-content-center rounded-circle" style="width: 48px; height: 48px">
                            <i class="bi bi-boxes text-primary"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-md-3">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <div>
                            <h6 class="text-muted">Eksik Kalemler</h6>
                            <h4>${totalMissingItems} Kalem</h4>
                        </div>
                        <div class="bg-danger bg-opacity-10 d-flex align-items-center justify-content-center rounded-circle" style="width: 48px; height: 48px">
                            <i class="bi bi-exclamation-circle text-danger"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-md-3">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <div>
                            <h6 class="text-muted">Tahmini Maliyet</h6>
                            <h4>${formatCurrency(totalEstimatedCost)}</h4>
                        </div>
                        <div class="bg-success bg-opacity-10 d-flex align-items-center justify-content-center rounded-circle" style="width: 48px; height: 48px">
                            <i class="bi bi-currency-lira text-success"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-md-3">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <div>
                            <h6 class="text-muted">Kritik Stok</h6>
                            <h4>${lowStockCount} Kalem</h4>
                        </div>
                        <div class="bg-warning bg-opacity-10 d-flex align-items-center justify-content-center rounded-circle" style="width: 48px; height: 48px">
                            <i class="bi bi-graph-down text-warning"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Görünüm değiştirme
function toggleView(type) {
    const tableView = document.getElementById('tableView');
    const cardView = document.getElementById('cardView');
    
    if (type === 'table') {
        tableView.classList.remove('d-none');
        cardView.classList.add('d-none');
        
        // Kullanıcı tercihini kaydet
        localStorage.setItem('needs_view', 'table');
    } else {
        tableView.classList.add('d-none');
        cardView.classList.remove('d-none');
        
        // Kullanıcı tercihini kaydet
        localStorage.setItem('needs_view', 'card');
    }
    
    // Butonların aktif durumunu güncelle
    const buttons = document.querySelectorAll('.btn-group button');
    buttons.forEach(button => {
        button.classList.remove('active');
        
        if ((type === 'table' && button.textContent.includes('Tablo')) ||
            (type === 'card' && button.textContent.includes('Kart'))) {
            button.classList.add('active');
        }
    });
}

// Tarih formatı
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Ham madde durum sınıfını belirle
function getStatusClass(need) {
    const needAmount = parseFloat(need.needed_quantity) || 0;
    const stockAmount = parseFloat(need.stock_quantity) || 0;
    
    if (stockAmount === 0) {
        return 'bg-danger';
    }
    
    if (stockAmount < needAmount) {
        return 'bg-warning';
    }
    
    return 'bg-success';
}

// Stok durum badge'i
function getStockStatusBadge(need) {
    const needAmount = parseFloat(need.needed_quantity) || 0;
    const stockAmount = parseFloat(need.stock_quantity) || 0;
    
    if (stockAmount === 0) {
        return '<span class="badge bg-danger">Stokta Yok</span>';
    }
    
    if (stockAmount < needAmount) {
        return '<span class="badge bg-warning">Yetersiz</span>';
    }
    
    return '<span class="badge bg-success">Yeterli</span>';
}

// Sayfanın ilk yüklenmesinde kullanıcı tercihini uygula
function applyUserPreference() {
    const preference = localStorage.getItem('needs_view') || 'table';
    toggleView(preference);
}

// Sayfaya ilk geldiğinde kullanıcı tercihini uygula
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        applyUserPreference();
    }, 100);
});