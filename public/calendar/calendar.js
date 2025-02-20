// Temel state yönetimi
let state = {
    currentDate: new Date(), // Sabitlemeyi kaldırdık, gerçek tarihi kullanıyoruz
    view: 'month' // 'month' veya 'day'
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    initCalendar();
});

// Takvim başlatma
function initCalendar() {
    updateDateDisplay();
    renderView();
}

// Tarih gösterimini güncelle
function updateDateDisplay() {
    const formatter = new Intl.DateTimeFormat('tr-TR', {
        month: 'long',
        year: 'numeric',
        ...(state.view === 'day' && { day: 'numeric', weekday: 'long' })
    });
    document.querySelector('.current-date').textContent = formatter.format(state.currentDate);
}

// Görünüm değiştirme
function switchView(view) {
    state.view = view;
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === view);
    });
    renderView();
}

// Bugüne git
function goToToday() {
    state.currentDate = new Date(); // Gerçek bugünün tarihine git
    renderView();
}

// Önceki/Sonraki navigasyonu
function previousMonth() {
    if (state.view === 'month') {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
    } else {
        state.currentDate.setDate(state.currentDate.getDate() - 1);
    }
    renderView();
}

function nextMonth() {
    if (state.view === 'month') {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
    } else {
        state.currentDate.setDate(state.currentDate.getDate() + 1);
    }
    renderView();
}

// Ana render fonksiyonu
function renderView() {
    updateDateDisplay();
    if (state.view === 'month') {
        renderMonthView();
    } else {
        renderDayView();
    }
}

// Ay görünümü render
function renderMonthView() {
    const calendar = document.getElementById('calendar');
    const today = new Date();
    const firstDay = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), 1);
    const lastDay = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 0);
    const firstDayOfWeek = firstDay.getDay() || 7;

    // İki farklı takvim yapısı - Mobil/Desktop
    let html = `
        <!-- Desktop Takvim (md breakpoint üstünde görünür) -->
        <div class="p-3 d-none d-md-block">
            <table class="w-100">
                <thead>
                    <tr>
                        ${['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => `
                            <th class="text-center p-2">
                                <small class="text-muted fw-bold">${day}</small>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
    `;

    // Desktop takvim yapısı (mevcut yapı)
    let date = 1;
    for (let i = 0; i < 6; i++) {
        html += '<tr>';
        for (let j = 1; j <= 7; j++) {
            if (i === 0 && j < firstDayOfWeek) {
                html += '<td class="p-1"></td>';
            } else if (date > lastDay.getDate()) {
                html += '<td class="p-1"></td>';
            } else {
                const currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), date);
                const isToday = currentDate.toDateString() === today.toDateString();
                
                html += `
                    <td class="p-1">
                        <div class="card h-100 ${isToday ? 'border-primary' : ''}" 
                             onclick="switchToDay('${formatDateISO(currentDate)}')"
                             data-date="${formatDateISO(currentDate)}">
                            <div class="card-header p-2 ${isToday ? 'bg-primary text-white' : ''}">
                                <div class="d-flex justify-content-between align-items-center">
                                    <strong>${date}</strong>
                                    <span class="badge bg-warning text-dark total-orders">0</span>
                                </div>
                            </div>
                            <div class="card-body p-2">
                                <div class="d-flex flex-column gap-1">
                                    <div class="d-flex justify-content-between">
                                        <small><i class="bi bi-sunrise text-warning"></i></small>
                                        <span class="delivery-count">0</span>
                                    </div>
                                    <div class="d-flex justify-content-between">
                                        <small><i class="bi bi-sun text-info"></i></small>
                                        <span class="delivery-count">0</span>
                                    </div>
                                    <div class="d-flex justify-content-between">
                                        <small><i class="bi bi-moon text-success"></i></small>
                                        <span class="delivery-count">0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                `;
                date++;
            }
        }
        html += '</tr>';
        if (date > lastDay.getDate()) break;
    }

    html += `</tbody></table></div>`;

    // Mobil Takvim (md breakpoint altında görünür)
    html += `
        <div class="p-3 d-block d-md-none">
            <div class="row row-cols-3 g-2">
                ${Array.from({length: lastDay.getDate()}, (_, i) => {
                    const currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), i + 1);
                    const isToday = currentDate.toDateString() === today.toDateString();
                    
                    return `
                        <div class="col">
                            <div class="card h-100 ${isToday ? 'border-primary' : ''}" 
                                 onclick="switchToDay('${formatDateISO(currentDate)}')"
                                 data-date="${formatDateISO(currentDate)}">
                                <div class="card-header p-2 ${isToday ? 'bg-primary text-white' : ''}">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>${i + 1}</strong>
                                            <small class="d-block">${formatDayName(currentDate)}</small>
                                        </div>
                                        <span class="badge bg-warning text-dark total-orders">0</span>
                                    </div>
                                </div>
                                <div class="card-body p-2">
                                    <div class="d-flex flex-column gap-1">
                                        <div class="d-flex justify-content-between">
                                            <small><i class="bi bi-sunrise text-warning"></i></small>
                                            <span class="delivery-count">0</span>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <small><i class="bi bi-sun text-info"></i></small>
                                            <span class="delivery-count">0</span>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <small><i class="bi bi-moon text-success"></i></small>
                                            <span class="delivery-count">0</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    calendar.innerHTML = html;
    loadMonthData();
}

// Gün görünümü render
function renderDayView() {
    const calendar = document.getElementById('calendar');
    
    calendar.innerHTML = `
        <div class="container-fluid p-3">
            <div class="row row-cols-1 row-cols-md-3 g-3">
                <!-- Sabah -->
                <div class="col">
                    <div class="card h-100">
                        <div class="card-header bg-warning bg-opacity-25">
                            <h5 class="mb-0">Sabah</h5>
                            <small>09:00-12:00</small>
                        </div>
                        <div class="card-body overflow-auto" id="morning-deliveries" style="max-height: calc(100vh - 250px);">
                            <div class="text-center text-muted">Yükleniyor...</div>
                        </div>
                    </div>
                </div>
                
                <!-- Öğlen -->
                <div class="col">
                    <div class="card h-100">
                        <div class="card-header bg-info bg-opacity-25">
                            <h5 class="mb-0">Öğlen</h5>
                            <small>12:00-17:00</small>
                        </div>
                        <div class="card-body overflow-auto" id="afternoon-deliveries" style="max-height: calc(100vh - 250px);">
                            <div class="text-center text-muted">Yükleniyor...</div>
                        </div>
                    </div>
                </div>
                
                <!-- Akşam -->
                <div class="col">
                    <div class="card h-100">
                        <div class="card-header bg-success bg-opacity-25">
                            <h5 class="mb-0">Akşam</h5>
                            <small>17:00-21:00</small>
                        </div>
                        <div class="card-body overflow-auto" id="evening-deliveries" style="max-height: calc(100vh - 250px);">
                            <div class="text-center text-muted">Yükleniyor...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    loadDayData();
}

// Gün görünümüne geç
function switchToDay(dateStr) {
    console.log('Seçilen tarih:', dateStr); // Debug için

    // Tarihi doğru parse et
    const [year, month, day] = dateStr.split('-');
    state.currentDate = new Date(Number(year), Number(month) - 1, Number(day));
    
    console.log('Oluşturulan tarih:', state.currentDate); // Debug için
    state.view = 'day';
    renderView();
}

// API'den ay verilerini yükle
async function loadMonthData() {
    try {
        const startDate = formatDateISO(new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), 1));
        const endDate = formatDateISO(new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 0));

        const response = await fetch(`${API_URL}/orders/filtered?start_date=${startDate}&end_date=${endDate}&per_page=1000&date_filter=delivery_date`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        
        // Siparişleri tarihe göre grupla
        const ordersByDay = {};
        data.orders.forEach(order => {
            const deliveryDate = order.delivery_date.split(' ')[0];
            
            if (!ordersByDay[deliveryDate]) {
                ordersByDay[deliveryDate] = {
                    morning: 0,
                    afternoon: 0,
                    evening: 0,
                    total: 0
                };
            }
            
            if (order.delivery_time_slot) {
                ordersByDay[deliveryDate][order.delivery_time_slot]++;
                ordersByDay[deliveryDate].total++;
            }
        });

        // Takvim günlerini güncelle
        document.querySelectorAll('.card[data-date]').forEach(dayEl => {
            const date = dayEl.dataset.date;
            const dayData = ordersByDay[date] || { morning: 0, afternoon: 0, evening: 0, total: 0 };

            const totalBadge = dayEl.querySelector('.total-orders');
            const deliveryCounts = dayEl.querySelectorAll('.delivery-count');

            if (totalBadge) {
                totalBadge.textContent = dayData.total;
                if (dayData.total > 0) {
                    totalBadge.classList.remove('bg-warning', 'text-dark');
                    totalBadge.classList.add('bg-primary', 'text-white');
                }
            }

            if (deliveryCounts.length === 3) {
                deliveryCounts[0].textContent = dayData.morning || '0';
                deliveryCounts[1].textContent = dayData.afternoon || '0';
                deliveryCounts[2].textContent = dayData.evening || '0';
            }
        });

    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        showError('Veriler yüklenemedi');
    }
}

// Gün verilerini yükle
async function loadDayData() {
    try {
        const date = formatDateISO(state.currentDate);
        console.log('Gün verileri yükleniyor:', date);

        // delivery_date parametresi eklendi
        const response = await fetch(`${API_URL}/orders/filtered?start_date=${date}&end_date=${date}&date_filter=delivery_date&per_page=1000`);
        if (!response.ok) throw new Error('API Hatası: ' + response.status);
        
        const data = await response.json();

        // Gün görünümünü güncelle
        ['morning', 'afternoon', 'evening'].forEach(slot => {
            const orders = data.orders.filter(order => 
                // Teslimat tarihi kontrolü eklendi
                order.delivery_time_slot === slot && 
                order.delivery_date.split(' ')[0] === date
            );
            
            const container = document.getElementById(`${slot}-deliveries`);
            
            if (container) {
                if (orders.length > 0) {
                    container.innerHTML = orders.map(order => `
                        <div class="card mb-2" onclick="showOrderDetails(${order.id})" style="cursor: pointer;">
                            <div class="card-body p-2">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 class="mb-1">${order.recipient_name}</h6>
                                        <div class="small text-muted mb-1">
                                            <i class="bi bi-geo-alt"></i> ${order.delivery_address}
                                        </div>
                                        <div class="small">
                                            <i class="bi bi-phone"></i> ${order.recipient_phone}
                                        </div>
                                        ${order.card_message ? 
                                            `<div class="small text-primary mt-1">
                                                <i class="bi bi-chat-quote"></i> ${order.card_message}
                                            </div>` : ''
                                        }
                                    </div>
                                    <div>
                                        ${getStatusBadge(order.status)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('');
                } else {
                    container.innerHTML = '<div class="text-center text-muted py-3">Bu saatte teslimat yok</div>';
                }
            }
        });

    } catch (error) {
        console.error('Gün verileri yüklenirken hata:', error);
        showError('Veriler yüklenemedi');
    }
}

// Teslimat saati formatı
function formatTimeSlot(slot) {
    const slots = {
        'morning': 'Sabah (09:00-12:00)',
        'afternoon': 'Öğlen (12:00-17:00)',
        'evening': 'Akşam (17:00-21:00)'
    };
    return slots[slot] || slot;
}

// Sipariş detaylarını göster fonksiyonu - Eklendi
async function showOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const order = await response.json();
        
        // Modalı göster
        const modalHTML = `
            <div class="modal fade" id="orderDetailModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Sipariş #${order.id}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="fw-bold">Teslimat Bilgileri</label>
                                <p>${formatDate(order.delivery_date)} - ${formatTimeSlot(order.delivery_time_slot)}</p>
                                <p>${order.delivery_address}</p>
                            </div>
                            <div class="mb-3">
                                <label class="fw-bold">Alıcı Bilgileri</label>
                                <p>${order.recipient_name}<br>${order.recipient_phone}</p>
                                ${order.card_message ? `<p class="text-muted">"${order.card_message}"</p>` : ''}
                            </div>
                            <div>
                                <label class="fw-bold">Ürünler</label>
                                <p>${order.items}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

        // Varsa eski modalı kaldır
        document.querySelector('#orderDetailModal')?.remove();
        
        // Yeni modalı ekle
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Modalı göster
        const modal = new bootstrap.Modal(document.querySelector('#orderDetailModal'));
        modal.show();

    } catch (error) {
        console.error('Sipariş detayları yüklenirken hata:', error);
        showError('Sipariş detayları yüklenemedi');
    }
}

// Teslimat durumuna göre renk belirleme
function getDeliveryStatusColor(status) {
    const colors = {
        'pending': 'primary',
        'assigned': 'info',
        'on_way': 'warning',
        'completed': 'success',
        'failed': 'danger'
    };
    return colors[status] || 'secondary';
}

// Helper fonksiyonlar
function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDayName(date) {
    return new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(date);
}