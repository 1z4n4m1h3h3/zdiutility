// ============================================================
// SYSTEM FINANCIAL REPORT
// ============================================================
let reportChartInstance = null;

window.renderReport = function () {
    const yearSelect = document.getElementById('report-year');
    if (!yearSelect) return;
    const selectedYear = parseInt(yearSelect.value);

    // Calculate metrics
    let totalYear = 0;
    let totalMonth = 0;
    let totalCompleted = 0;

    const currentMonth = new Date().getMonth(); // 0-11
    
    // Group costs by month (0-11)
    const monthlyCosts = new Array(12).fill(0);

    // We use maintenanceList which holds all service records
    if (typeof maintenanceList !== 'undefined') {
        maintenanceList.forEach(svc => {
            let dateToUse = svc.status === 'completed' ? svc.completionDate : svc.sendDate;
            if (!dateToUse) return;

            const svcDate = new Date(dateToUse);
            if (svcDate.getFullYear() === selectedYear) {
                const cost = parseInt(svc.estCost) || 0;
                totalYear += cost;
                
                const month = svcDate.getMonth();
                monthlyCosts[month] += cost;

                if (month === currentMonth && new Date().getFullYear() === selectedYear) {
                    totalMonth += cost;
                }

                if (svc.status === 'completed') {
                    totalCompleted++;
                }
            }
        });
    }

    // Update DOM
    document.getElementById('report-total-year').textContent = `Rp ${totalYear.toLocaleString('id-ID')}`;
    document.getElementById('report-total-month').textContent = `Rp ${totalMonth.toLocaleString('id-ID')}`;
    document.getElementById('report-total-services').textContent = totalCompleted;

    // Render Chart
    const ctx = document.getElementById('report-chart');
    if (ctx) {
        if (reportChartInstance) {
            reportChartInstance.destroy();
        }

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        if (typeof Chart !== 'undefined') {
            reportChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Total Biaya Servis (Rp)',
                        data: monthlyCosts,
                        backgroundColor: 'rgba(16, 185, 129, 0.7)', // Emerald 500
                        borderColor: 'rgb(16, 185, 129)',
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#94a3b8' // text-slate-400
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: '#1e293b' // border-slate-800
                            },
                            ticks: {
                                color: '#94a3b8',
                                callback: function(value) {
                                    if (value >= 1000000) {
                                        return 'Rp ' + (value / 1000000) + ' Jt';
                                    } else if (value >= 1000) {
                                        return 'Rp ' + (value / 1000) + 'k';
                                    }
                                    return 'Rp ' + value;
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#94a3b8'
                            }
                        }
                    }
                }
            });
        }
    }
}
