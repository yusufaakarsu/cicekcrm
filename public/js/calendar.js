// Temel state yönetimi
let state = {
    currentDate: new Date(),
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
    state.currentDate = new Date();
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

    let html = `
        <div class="delivery-legend p-3">
            <div class="d-flex justify-content-center gap-4">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-warning">Sabah</span>
                    <small>09:00-12:00</small>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-info">Öğlen</span>
                    <small>12:00-17:00</small>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-success">Akşam</span>
                    <small>17:00-21:00</small>
                </div>
            </div>
        </div>
        <div class="calendar-grid p-3">
    `;

    // Günleri oluştur
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), i);
        const isToday = date.toDateString() === today.toDateString();

        html += `
            <div class="calendar-day ${isToday ? 'today' : ''}" onclick="switchToDay('${formatDateISO(date)}')" data-date="${formatDateISO(date)}">
                <div class="day-header">
                    <div class="day-info">
                        <div class="day-number">${i}</div>
                        <div class="day-name">${formatDayName(date)}</div>
                    </div>
                    <div class="badge bg-primary rounded-pill">0</div>
                </div>
                <div class="delivery-slots mt-2">
                    <div class="badge bg-warning w-100 mb-1">0</div>
                    <div class="badge bg-info w-100 mb-1">0</div>
                    <div class="badge bg-success w-100">0</div>
                </div>
            </div>
        `;
    }

    html += '</div>';
    calendar.innerHTML = html;
    loadMonthData();
}

// Gün görünümü render
function renderDayView() {
    const calendar = document.getElementById('calendar');
    
    calendar.innerHTML = `
        <div class="delivery-columns p-3">
            <div class="col">
                <div class="card h-100">
                    <div class="card-header bg-warning bg-opacity-25">
                        <h5 class="mb-0">Sabah</h5>
                        <small>09:00-12:00</small>
                    </div>
                    <div class="card-body" id="morning-deliveries">
                        <div class="text-center text-muted">Yükleniyor...</div>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card h-100">
                    <div class="card-header bg-info bg-opacity-25">
                        <h5 class="mb-0">Öğlen</h5>
                        <small>12:00-17:00</small>
                    </div>
                    <div class="card-body" id="afternoon-deliveries">
                        <div class="text-center text-muted">Yükleniyor...</div>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card h-100">
                    <div class="card-header bg-success bg-opacity-25">
                        <h5 class="mb-0">Akşam</h5>
                        <small>17:00-21:00</small>
                    </div>
                    <div class="card-body" id="evening-deliveries">
                        <div class="text-center text-muted">Yükleniyor...</div>
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
        
        console.log('Tarih aralığı:', startDate, endDate); // Debug

        const response = await fetch(`${API_URL}/orders/filtered?start_date=${startDate}&end_date=${endDate}&per_page=1000`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        console.log('API yanıtı:', data.orders.length, 'sipariş bulundu'); // Debug

        // Siparişleri tarihe göre grupla
        const ordersByDay = {};
        data.orders.forEach(order => {
            // Tarihi doğru formatta al (YYYY-MM-DD)
            const deliveryDate = order.delivery_date.split(' ')[0];
            
            // Her tarih için sayaçları başlat
            if (!ordersByDay[deliveryDate]) {
                ordersByDay[deliveryDate] = {
                    morning: 0,
                    afternoon: 0,
                    evening: 0,
                    total: 0
                };
            }
            
            // Teslimat saatine göre say
            if (order.delivery_time_slot) {
                ordersByDay[deliveryDate][order.delivery_time_slot]++;
                ordersByDay[deliveryDate].total++;
            }
        });

        console.log('Gruplanmış veriler:', ordersByDay); // Debug

        // Takvim günlerini güncelle
        document.querySelectorAll('.calendar-day').forEach(dayEl => {
            const date = dayEl.dataset.date;
            const dayData = ordersByDay[date] || { morning: 0, afternoon: 0, evening: 0, total: 0 };

            // Toplam rozeti güncelle
            const totalBadge = dayEl.querySelector('.badge.bg-primary');
            if (totalBadge) {
                totalBadge.textContent = dayData.total;
                if (dayData.total > 0) {
                    totalBadge.classList.remove('bg-primary');
                    totalBadge.classList.add('bg-success');
                }
            }

            // Zaman dilimleri rozetlerini güncelle
            const slots = dayEl.querySelectorAll('.delivery-slots .badge');
            if (slots.length === 3) {
                slots[0].textContent = dayData.morning || '0';
                slots[1].textContent = dayData.afternoon || '0';
                slots[2].textContent = dayData.evening || '0';

                // Sıfır olanları soluk göster
                slots.forEach((slot, index) => {
                    const count = index === 0 ? dayData.morning : 
                                index === 1 ? dayData.afternoon : 
                                dayData.evening;
                    slot.style.opacity = count > 0 ? '1' : '0.5';
                });
            }
        });

    } catch (error) {
        console.error('Veri yükleme hatası:', error);
    }
}

// Gün verilerini yükle
async function loadDayData() {
    try {
        const date = formatDateISO(state.currentDate);
        console.log('Gün verileri yükleniyor:', date); // Debug

        const response = await fetch(`${API_URL}/orders/filtered?start_date=${date}&end_date=${date}&per_page=1000`);
        if (!response.ok) throw new Error('API Hatası: ' + response.status);
        
        const data = await response.json();
        console.log('Günlük sipariş sayısı:', data.orders.length); // Debug

        // Gün görünümünü güncelle
        ['morning', 'afternoon', 'evening'].forEach(slot => {
            const orders = data.orders.filter(order => order.delivery_time_slot === slot);
            const container = document.getElementById(`${slot}-deliveries`);
            
            if (container) {
                if (orders.length > 0) {
                    container.innerHTML = orders.map(order => `
                        <div class="card mb-2 border-${order.status === 'delivered' ? 'success' : 'primary'}">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h6 class="mb-0">${order.recipient_name}</h6>
                                    ${getStatusBadge(order.status)}
                                </div>
                                <div class="small text-muted mb-1">${order.delivery_address}</div>
                                <div class="small"><i class="bi bi-telephone"></i> ${order.recipient_phone}</div>
                                ${order.card_message ? `<div class="small text-primary mt-1"><i class="bi bi-chat-quote"></i> ${order.card_message}</div>` : ''}
                            </div>
                        </div>
                    `).join('');
                } else {
                    container.innerHTML = '<div class="text-center text-muted">Teslimat yok</div>';
                }
            }
        });

    } catch (error) {
        console.error('Gün verileri yüklenirken hata:', error);
    }
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
