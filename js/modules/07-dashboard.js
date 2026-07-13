// ============================================================
// CORE DASHBOARD SYSTEM & DATA MIGRATION
// ============================================================
let currentFilter = 'All';
const form = document.getElementById('stock-form');
const tableBody = document.getElementById('stock-table-body');
const emptyState = document.getElementById('empty-state');
const totalItemsEl = document.getElementById('total-items');

function updateDashboard() {
    renderTable();
    if (totalItemsEl) totalItemsEl.innerText = inventory.length;
    updateActivityLog();
    updateChart();
    checkLowStock();
}

function checkLowStock() {
    const lowStockWidget = document.getElementById('low-stock-widget');
    const lowStockList = document.getElementById('low-stock-list');
    if (!lowStockWidget || !lowStockList) return;

    const lowItems = inventory.filter(item => item.qty <= 5);

    if (lowItems.length > 0) {
        lowStockWidget.classList.remove('hidden');
        lowStockList.innerHTML = lowItems.map(item =>
            `<div class="flex justify-between items-center py-1 border-b border-rose-500/20 last:border-0">
                <span class="font-bold text-rose-300">${item.name}</span>
                <span class="bg-rose-500/20 px-2 py-0.5 rounded text-rose-400 font-bold">${item.qty} tersisa</span>
            </div>`
        ).join('');
    } else {
        lowStockWidget.classList.add('hidden');
    }
}

function getQtyStyle(qty) {
    if (qty <= 3) return 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[inset_0_0_8px_rgba(244,63,94,0.1)]';
    if (qty <= 10) return 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[inset_0_0_8px_rgba(245,158,11,0.1)]';
    return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-[inset_0_0_8px_rgba(34,211,238,0.1)]';
}

function getCatBadge(item) {
    if (item.category === 'PC') return `<button onclick="cycleCategory('${item.id}')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 shadow-sm cursor-pointer hover:bg-blue-500/20 transition-colors"><i class="fa-solid fa-desktop text-[10px]"></i> PC/Laptop</button>`;
    if (item.category === 'Laptop') return `<button onclick="cycleCategory('${item.id}')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 shadow-sm cursor-pointer hover:bg-sky-500/20 transition-colors"><i class="fa-solid fa-laptop text-[10px]"></i> Laptop</button>`;
    if (item.category === 'Monitor') return `<button onclick="cycleCategory('${item.id}')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 shadow-sm cursor-pointer hover:bg-pink-500/20 transition-colors"><i class="fa-solid fa-desktop text-[10px]"></i> Monitor PC</button>`;
    if (item.category === 'Printer') return `<button onclick="cycleCategory('${item.id}')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 shadow-sm cursor-pointer hover:bg-teal-500/20 transition-colors"><i class="fa-solid fa-print text-[10px]"></i> Printer</button>`;
    if (item.category === 'CCTV') return `<button onclick="cycleCategory('${item.id}')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 shadow-sm cursor-pointer hover:bg-purple-500/20 transition-colors"><i class="fa-solid fa-video text-[10px]"></i> CCTV</button>`;
    if (item.category === 'Doorlock') return `<button onclick="cycleCategory('${item.id}')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 shadow-sm cursor-pointer hover:bg-orange-500/20 transition-colors"><i class="fa-solid fa-key text-[10px]"></i> Doorlock</button>`;
    if (item.category === 'Consumable') return `<button onclick="cycleCategory('${item.id}')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 shadow-sm cursor-pointer hover:bg-yellow-500/20 transition-colors"><i class="fa-solid fa-box text-[10px]"></i> Consumable</button>`;
    return '';
}

function getConditionBadge(item) {
    let cond = item.condition || 'Normal';
    if (item.category === 'Consumable' && (cond === 'Normal' || cond === 'Baru')) {
        return `<button onclick="toggleCondition('${item.id}')" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-sm cursor-pointer hover:bg-emerald-500/20 transition-colors"><i class="fa-solid fa-check text-[10px]"></i> Baru</button>`;
    } else if (item.category === 'Consumable' && (cond === 'Rusak' || cond === 'Bekas')) {
        return `<button onclick="toggleCondition('${item.id}')" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 shadow-sm cursor-pointer hover:bg-amber-500/20 transition-colors"><i class="fa-solid fa-clock-rotate-left text-[10px]"></i> Bekas</button>`;
    } else if (cond === 'Normal' || cond === 'Baru') {
        return `<button onclick="toggleCondition('${item.id}')" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-sm cursor-pointer hover:bg-emerald-500/20 transition-colors"><i class="fa-solid fa-check text-[10px]"></i> Normal</button>`;
    } else {
        return `<button onclick="toggleCondition('${item.id}')" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 shadow-sm cursor-pointer hover:bg-rose-500/20 transition-colors"><i class="fa-solid fa-xmark text-[10px]"></i> Rusak</button>`;
    }
}

function getActionsHtml(item) {
    return `
        <div class="flex justify-center items-center gap-1.5 md:gap-2.5">
            <button onclick="changeQty('${item.id}', -1)" class="btn-action-3d w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer border border-slate-700/60">
                <i class="fa-solid fa-minus text-[10px] md:text-xs"></i>
            </button>
            <button onclick="viewBarcode('${item.id}')" class="btn-action-3d w-7 h-7 md:w-8 md:h-8 rounded-lg bg-indigo-950/40 hover:bg-indigo-600 text-indigo-400 hover:text-white flex items-center justify-center cursor-pointer border border-indigo-900/30 transition-colors shadow-sm" title="Lihat Barcode">
                <i class="fa-solid fa-barcode text-[10px] md:text-xs"></i>
            </button>
            <button onclick="changeQty('${item.id}', 1)" class="btn-action-3d w-7 h-7 md:w-8 md:h-8 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center cursor-pointer border border-cyan-500/30">
                <i class="fa-solid fa-plus text-[10px] md:text-xs"></i>
            </button>
            <div class="w-[1px] h-3 md:h-4 bg-slate-800 mx-0.5"></div>
            <button onclick="deleteItem('${item.id}')" class="btn-action-3d w-7 h-7 md:w-8 md:h-8 rounded-lg bg-rose-950/40 hover:bg-rose-600 text-rose-400 hover:text-white flex items-center justify-center cursor-pointer border border-rose-900/30 transition-colors">
                <i class="fa-solid fa-trash-can text-[10px] md:text-xs"></i>
            </button>
        </div>
    `;
}

function createGeneralRow(item) {
    const tr = document.createElement('tr');
    tr.className = 'row-animate hover:bg-slate-800/20 text-sm';
    const qtyStyle = getQtyStyle(item.qty);
    
    tr.innerHTML = `
        <td class="p-2 md:p-4 pl-3 md:pl-6 font-semibold tracking-wide min-w-[130px] whitespace-normal break-words">
            <button onclick="viewItemHistory('${item.name.replace(/'/g, "\\'")}')" class="text-slate-200 hover:text-cyan-400 flex items-center gap-1.5 group transition-colors text-left text-xs md:text-sm">
                ${item.name}
                <i class="fa-solid fa-clock-rotate-left text-[9px] md:text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
            </button>
        </td>
        <td class="p-2 md:p-4 text-center whitespace-nowrap">${getCatBadge(item)}</td>
        <td class="p-2 md:p-4 text-center whitespace-nowrap">${getConditionBadge(item)}</td>
        <td class="p-2 md:p-4 text-center whitespace-nowrap">
            <span class="inline-block px-2 md:px-3 py-1 md:py-1.5 rounded-xl text-[11px] md:text-xs font-black tracking-wider ${qtyStyle} border min-w-[45px] md:min-w-[55px] shadow-sm">
                ${item.qty}
            </span>
        </td>
        <td class="p-2 md:p-4 whitespace-nowrap">
            ${getActionsHtml(item)}
        </td>
    `;
    return tr;
}

function createPrinterRow(item) {
    const tr = document.createElement('tr');
    tr.className = 'row-animate hover:bg-slate-800/20 text-sm';
    const qtyStyle = getQtyStyle(item.qty);

    tr.innerHTML = `
        <td class="p-2 md:p-4 pl-3 md:pl-6 font-semibold tracking-wide min-w-[130px] whitespace-normal break-words">
            <button onclick="viewItemHistory('${item.name.replace(/'/g, "\\'")}')" class="text-slate-200 hover:text-cyan-400 flex items-center gap-1.5 group transition-colors text-left text-xs md:text-sm">
                ${item.name}
                <i class="fa-solid fa-clock-rotate-left text-[9px] md:text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
            </button>
        </td>
        <td class="p-2 md:p-4 text-center whitespace-nowrap">
            <span class="text-teal-400 text-xs font-mono font-semibold">${item.ip || '-'}</span>
        </td>
        <td class="p-2 md:p-4 text-center whitespace-nowrap">
            <span class="text-rose-300 text-xs font-semibold">${item.department || '-'}</span>
        </td>
        <td class="p-2 md:p-4 text-center whitespace-nowrap">
            <span class="text-blue-300 text-xs font-semibold">${item.vendor || '-'}</span>
        </td>
        <td class="p-2 md:p-4 text-center whitespace-nowrap">${getConditionBadge(item)}</td>
        <td class="p-2 md:p-4 text-center whitespace-nowrap">
            <span class="inline-block px-2 md:px-3 py-1 md:py-1.5 rounded-xl text-[11px] md:text-xs font-black tracking-wider ${qtyStyle} border min-w-[45px] md:min-w-[55px] shadow-sm">
                ${item.qty}
            </span>
        </td>
        <td class="p-2 md:p-4 whitespace-nowrap">
            ${getActionsHtml(item)}
        </td>
    `;
    return tr;
}

function renderTable() {
    const searchInput = document.getElementById('search-monitor');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    const tableBody = document.getElementById('stock-table-body');
    const printerTableBody = document.getElementById('printer-table-body');
    const emptyState = document.getElementById('empty-state');
    const printerEmptyState = document.getElementById('printer-empty-state');
    const generalContainer = document.getElementById('general-table-container');
    const printerContainer = document.getElementById('printer-table-container');

    const filteredData = inventory.filter(item => {
        const matchesCategory = currentFilter === 'All' || item.category === currentFilter;
        const matchesSearch = searchTerm === '' ||
            item.name.toLowerCase().includes(searchTerm) ||
            (item.id && item.id.toLowerCase().includes(searchTerm)) ||
            (item.ip && item.ip.toLowerCase().includes(searchTerm)) ||
            (item.area && item.area.toLowerCase().includes(searchTerm)) ||
            (item.vendor && item.vendor.toLowerCase().includes(searchTerm)) ||
            (item.department && item.department.toLowerCase().includes(searchTerm)) ||
            (item.condition && item.condition.toLowerCase().includes(searchTerm));
        return matchesCategory && matchesSearch;
    });

    const generalItems = filteredData.filter(item => item.category !== 'Printer');
    const printerItems = filteredData.filter(item => item.category === 'Printer');

    // General Items Logic
    if (currentFilter === 'Printer') {
        if (generalContainer) generalContainer.classList.add('hidden');
        if (emptyState) emptyState.classList.add('hidden');
    } else {
        if (generalContainer) generalContainer.classList.remove('hidden');
        if (generalItems.length === 0) {
            if (tableBody) tableBody.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
        } else {
            if (emptyState) emptyState.classList.add('hidden');
            if (tableBody) {
                tableBody.innerHTML = '';
                generalItems.forEach((item) => {
                    tableBody.appendChild(createGeneralRow(item));
                });
            }
        }
    }

    // Printer Items Logic
    if (currentFilter !== 'All' && currentFilter !== 'Printer') {
        if (printerContainer) printerContainer.classList.add('hidden');
    } else {
        if (printerContainer) printerContainer.classList.remove('hidden');
        if (printerItems.length === 0) {
            if (printerTableBody) printerTableBody.innerHTML = '';
            if (printerEmptyState) printerEmptyState.classList.remove('hidden');
        } else {
            if (printerEmptyState) printerEmptyState.classList.add('hidden');
            if (printerTableBody) {
                printerTableBody.innerHTML = '';
                printerItems.forEach((item) => {
                    printerTableBody.appendChild(createPrinterRow(item));
                });
            }
        }
        
        // Render Printer Summary
        const printerSummary = document.getElementById('printer-summary');
        if (printerSummary) {
            const total = printerItems.length;
            const mstekCount = printerItems.filter(i => i.vendor && i.vendor.toUpperCase().includes('MSTEK')).length;
            const inknaraCount = printerItems.filter(i => i.vendor && i.vendor.toUpperCase().includes('INKNARA')).length;
            const konicaCount = printerItems.filter(i => i.vendor && (i.vendor.toUpperCase().includes('KONICA') || i.vendor.toUpperCase().includes('KOINK'))).length;
            const otherCount = total - (mstekCount + inknaraCount + konicaCount);
            
            printerSummary.innerHTML = `
                <span class="px-2.5 py-1 bg-slate-800/80 text-slate-300 text-[11px] font-medium rounded border border-slate-700 shadow-sm">Total Unit: <strong class="text-white ml-1">${total}</strong></span>
                <span class="px-2.5 py-1 bg-blue-900/30 text-blue-300 text-[11px] font-medium rounded border border-blue-800/50 shadow-sm">MSTEK: <strong class="text-white ml-1">${mstekCount}</strong></span>
                <span class="px-2.5 py-1 bg-rose-900/30 text-rose-300 text-[11px] font-medium rounded border border-rose-800/50 shadow-sm">INKNARA: <strong class="text-white ml-1">${inknaraCount}</strong></span>
                <span class="px-2.5 py-1 bg-emerald-900/30 text-emerald-300 text-[11px] font-medium rounded border border-emerald-800/50 shadow-sm">KOINK / KONICA: <strong class="text-white ml-1">${konicaCount}</strong></span>
                ${otherCount > 0 ? `<span class="px-2.5 py-1 bg-slate-800/40 text-slate-400 text-[11px] font-medium rounded border border-slate-700/50 shadow-sm">Lainnya: <strong class="text-white ml-1">${otherCount}</strong></span>` : ''}
            `;
        }
    }
}

