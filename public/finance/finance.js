let paymentChart;

document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadFinanceData();
    loadRecentTransactions();
    setInterval(loadFinanceData, 60000);
});

async function loadFinanceData() {
    try {
        const response = await fetch(`${API_URL}/api/finance/stats`);
        if (!response.ok) throw new Error('API Hatası');
        const data = await response.json();

        // Finansal kartları güncelle
        document.getElementById('dailyRevenue').textContent = formatCurrency(data.dailyRevenue);
        document.getElementById('pendingPayments').textContent = formatCurrency(data.pendingPayments);
        document.getElementById('monthlyIncome').textContent = formatCurrency(data.monthlyIncome);
        document.getElementById('profitMargin').textContent = `%${data.profitMargin}`;

        // Ödeme durumu grafiğini güncelle
        updatePaymentChart(data.paymentStatus);

        document.getElementById('status').innerHTML = `
            <i class="bi bi-check-circle"></i> Son güncelleme: ${new Date().toLocaleTimeString()}
        `;
    } catch (error) {
        console.error('Finans verisi yüklenirken hata:', error);
        document.getElementById('status').innerHTML = `
            <i class="bi bi-exclamation-triangle"></i> Bağlantı hatası!
        `;
    }
}

async function loadRecentTransactions() {
    try {
        const response = await fetch(`${API_URL}/api/finance/transactions`);
        if (!response.ok) throw new Error('API Hatası');
        const transactions = await response.json();

        const tbody = document.getElementById('recentTransactions').getElementsByTagName('tbody')[0];
        
        if (transactions.length > 0) {
            tbody.innerHTML = transactions.map(t => `
                <tr>
                    <td>${formatDate(t.created_at)}</td>
                    <td>${t.order_id}</td>
                    <td>${t.customer_name}</td>
                    <td>${formatCurrency(t.amount)}</td>
                    <td>${getPaymentStatusBadge(t.status)}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">İşlem bulunamadı</td></tr>';
        }
    } catch (error) {
        console.error('İşlemler yüklenirken hata:', error);
    }
}

function updatePaymentChart(data) {
    const ctx = document.getElementById('paymentStatusChart').getContext('2d');
    
    if (paymentChart) {
        paymentChart.destroy();
    }

    paymentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ödendi', 'Bekliyor', 'İptal'],
            datasets: [{
                data: [data.paid, data.pending, data.cancelled],
                backgroundColor: ['#198754', '#ffc107', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function getPaymentStatusBadge(status) {
    const statusMap = {
        paid: ['Ödendi', 'success'],
        pending: ['Bekliyor', 'warning'],
        cancelled: ['İptal', 'danger']
    };

    const [text, color] = statusMap[status] || ['Bilinmiyor', 'secondary'];
    return `<span class="badge bg-${color}">${text}</span>`;
}
