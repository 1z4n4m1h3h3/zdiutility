// ============================================================
// STOCK INVENTORY CHART SYSTEM (Chart.js)
// ============================================================
const chartInstances = {};

function initChart() {
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
    Chart.defaults.color = '#94a3b8'; // slate-400

    const categories = ['PC', 'Laptop', 'Monitor', 'Printer', 'CCTV', 'Doorlock', 'Consumable'];

    categories.forEach(cat => {
        const ctx = document.getElementById(`chart-${cat}`);
        if (!ctx) return;

        chartInstances[cat] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderColor: 'rgba(15, 23, 42, 1)', // slate-900 border for gaps
                    borderWidth: 2,
                    borderRadius: 4,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#cbd5e1',
                            font: {
                                size: 10,
                                family: "'Plus Jakarta Sans', sans-serif",
                                weight: '600'
                            },
                            usePointStyle: true,
                            boxWidth: 8,
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#ffffff',
                        bodyColor: '#e2e8f0',
                        borderColor: 'rgba(34, 211, 238, 0.2)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 12,
                        callbacks: {
                            label: function (context) {
                                return ` Stok: ${context.parsed} unit`;
                            }
                        }
                    }
                }
            }
        });
    });
}

function updateChart() {
    const emptyChartState = document.getElementById('empty-chart-state');
    const chartGrid = document.getElementById('chart-grid');

    const filteredData = inventory.filter(item => {
        if (currentFilter === 'All') return true;
        return item.category === currentFilter;
    });

    if (filteredData.length === 0) {
        if (chartGrid) chartGrid.classList.add('hidden');
        if (emptyChartState) emptyChartState.classList.remove('hidden');
    } else {
        if (chartGrid) chartGrid.classList.remove('hidden');
        if (emptyChartState) emptyChartState.classList.add('hidden');
    }

    const categories = ['PC', 'Laptop', 'Monitor', 'Printer', 'CCTV', 'Doorlock', 'Consumable'];
    const palettes = {
        'PC': ['rgba(59, 130, 246, 0.8)', 'rgba(96, 165, 250, 0.8)', 'rgba(37, 99, 235, 0.8)', 'rgba(147, 197, 253, 0.8)', 'rgba(29, 78, 216, 0.8)'],
        'Laptop': ['rgba(14, 165, 233, 0.8)', 'rgba(56, 189, 248, 0.8)', 'rgba(2, 132, 199, 0.8)', 'rgba(125, 211, 252, 0.8)', 'rgba(3, 105, 161, 0.8)'],
        'Monitor': ['rgba(236, 72, 153, 0.8)', 'rgba(244, 114, 182, 0.8)', 'rgba(219, 39, 119, 0.8)', 'rgba(251, 161, 198, 0.8)', 'rgba(190, 24, 93, 0.8)'],
        'Printer': ['rgba(20, 184, 166, 0.8)', 'rgba(45, 212, 191, 0.8)', 'rgba(13, 148, 136, 0.8)', 'rgba(94, 234, 212, 0.8)', 'rgba(15, 118, 110, 0.8)'],
        'CCTV': ['rgba(168, 85, 247, 0.8)', 'rgba(192, 132, 252, 0.8)', 'rgba(147, 51, 234, 0.8)', 'rgba(216, 180, 254, 0.8)', 'rgba(126, 34, 206, 0.8)'],
        'Doorlock': ['rgba(249, 115, 22, 0.8)', 'rgba(251, 146, 60, 0.8)', 'rgba(234, 88, 12, 0.8)', 'rgba(253, 186, 116, 0.8)', 'rgba(194, 65, 12, 0.8)'],
        'Consumable': ['rgba(234, 179, 8, 0.8)', 'rgba(250, 204, 21, 0.8)', 'rgba(202, 138, 4, 0.8)', 'rgba(254, 240, 138, 0.8)', 'rgba(161, 98, 7, 0.8)']
    };

    categories.forEach(cat => {
        const catData = filteredData.filter(i => i.category === cat);
        const chart = chartInstances[cat];
        if (!chart) return;

        const parentDiv = chart.canvas.parentElement;
        if (currentFilter !== 'All' && currentFilter !== cat) {
            parentDiv.classList.add('hidden');
        } else {
            parentDiv.classList.remove('hidden');
        }

        if (catData.length === 0) {
            chart.data.labels = ['Kosong'];
            chart.data.datasets[0].data = [1];
            chart.data.datasets[0].backgroundColor = ['rgba(30, 41, 59, 0.3)'];
            chart.options.plugins.tooltip.enabled = false;
            chart.options.plugins.legend.display = false;
        } else {
            let sortedData = [...catData].sort((a, b) => b.qty - a.qty);
            let displayData = sortedData;

            if (sortedData.length > 5) {
                displayData = sortedData.slice(0, 5);
                const othersQty = sortedData.slice(5).reduce((sum, item) => sum + item.qty, 0);
                if (othersQty > 0) {
                    displayData.push({ name: 'Lainnya', qty: othersQty, isOther: true });
                }
            }

            chart.data.labels = displayData.map(i => i.name.length > 15 ? i.name.substring(0, 15) + '...' : i.name);
            chart.data.datasets[0].data = displayData.map(i => i.qty);
            chart.data.datasets[0].backgroundColor = displayData.map((item, idx) => {
                if (item.isOther) return 'rgba(71, 85, 105, 0.8)';
                return palettes[cat][idx % palettes[cat].length];
            });
            chart.options.plugins.tooltip.enabled = true;
            chart.options.plugins.legend.display = true;
        }
        chart.update();
    });

    updateTop5Analytics();
}

function updateTop5Analytics() {
    let outCounts = {};
    activityLog.forEach(log => {
        if (log.action === 'EDIT_QUANTITY' && log.details.includes('dikurangi')) {
            const match = log.details.match(/dikurangi (\d+) unit/);
            if (match && match[1]) {
                const amount = parseInt(match[1]);
                outCounts[log.itemName] = (outCounts[log.itemName] || 0) + amount;
            }
        }
    });

    const top5 = Object.entries(outCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    let top5Container = document.getElementById('top5-analytics');
    if (!top5Container) {
        top5Container = document.createElement('div');
        top5Container.id = 'top5-analytics';
        top5Container.className = 'bg-slate-950/40 border border-slate-800/50 p-4 rounded-2xl w-full mt-6 transition-all duration-300 flex flex-col';

        const chartPanel = document.getElementById('chart-grid');
        if (chartPanel && chartPanel.parentNode) {
            chartPanel.parentNode.insertBefore(top5Container, chartPanel.nextSibling);
        }
    }

    if (top5.length > 0) {
        top5Container.classList.remove('hidden');
        top5Container.innerHTML = `
            <h3 class="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                <i class="fa-solid fa-fire text-orange-500"></i> Top 5 Barang Paling Cepat Keluar
            </h3>
            <div class="space-y-2">
                ${top5.map((item, idx) => `
                    <div class="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                        <div class="flex items-center gap-3">
                            <span class="w-6 h-6 rounded-full bg-slate-800 text-xs flex items-center justify-center font-bold text-slate-400">${idx + 1}</span>
                            <span class="text-sm font-bold text-white">${item[0]}</span>
                        </div>
                        <span class="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded-md border border-orange-500/20">${item[1]} unit keluar</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        top5Container.classList.add('hidden');
    }
}

window.filterCategory = function (category) {
    currentFilter = category;
    document.querySelectorAll('.filter-tab').forEach(btn => {
        btn.classList.remove('active', 'text-white');
        btn.classList.add('text-slate-400');
    });
    const activeBtn = document.getElementById(`btn-filter-${category}`);
    if (activeBtn) activeBtn.classList.add('active', 'text-white');
    renderTable();
    updateChart();
}
