let incomeExpenseChart, profitChart;

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    initReportsPage();
});

async function initReportsPage() {
    await Promise.all([
        loadIncomeExpenseData(),
        loadProfitData(),
        loadAccounts()
    ]);
}

async function loadIncomeExpenseData() {
    try {
        const response = await fetch(`${API_URL}/finance/reports/income-expense`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderIncomeExpenseChart(data);
    } catch (error) {
        console.error('Income/Expense data error:', error);
        showError('Gelir/Gider verileri yüklenemedi');
    }
}

async function loadProfitData() {
    try {
        const response = await fetch(`${API_URL}/finance/reports/profit`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderProfitChart(data);
    } catch (error) {
        console.error('Profit data error:', error);
        showError('Kar/Zarar verileri yüklenemedi');
    }
}

function renderIncomeExpenseChart(data) {
    const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
    
    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }

    incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Gelir',
                    data: data.income,
                    backgroundColor: 'rgba(40, 167, 69, 0.5)',
                    borderColor: 'rgb(40, 167, 69)',
                    borderWidth: 1
                },
                {
                    label: 'Gider',
                    data: data.expense,
                    backgroundColor: 'rgba(220, 53, 69, 0.5)',
                    borderColor: 'rgb(220, 53, 69)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderProfitChart(data) {
    const ctx = document.getElementById('profitChart').getContext('2d');
    
    if (profitChart) {
        profitChart.destroy();
    }

    profitChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Kar/Zarar',
                data: data.profit,
                borderColor: 'rgb(0, 123, 255)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true
        }
    });
}

async function downloadReport(type) {
    try {
        const response = await fetch(`${API_URL}/finance/reports/${type}/download`);
        if (!response.ok) throw new Error('API Hatası');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-report.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
        console.error('Download error:', error);
        showError('Rapor indirilemedi');
    }
}

// ... Diğer yardımcı fonksiyonlar ...
