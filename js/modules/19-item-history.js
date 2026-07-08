// ============================================================
// BUKU RIWAYAT PER-BARANG (ITEM HISTORY)
// ============================================================
window.viewItemHistory = function (itemName) {
    const modal = document.getElementById('item-history-modal');
    const modalContent = document.getElementById('item-history-modal-content');
    const titleEl = document.getElementById('history-item-name');
    const listEl = document.getElementById('item-history-list');
    const emptyState = document.getElementById('item-history-empty');

    titleEl.innerText = itemName;
    listEl.innerHTML = '';

    // Filter logs for this item
    const logs = activityLog.filter(l => l.itemName === itemName);

    if (logs.length === 0) {
        listEl.classList.add('hidden');
        emptyState.classList.remove('hidden');
    } else {
        listEl.classList.remove('hidden');
        emptyState.classList.add('hidden');

        logs.forEach((log, index) => {
            const isLast = index === logs.length - 1;
            let iconClass = 'fa-circle text-slate-500';

            if (log.action === 'ADD_ITEM') iconClass = 'fa-plus-circle text-emerald-400';
            else if (log.action === 'DELETE_ITEM') iconClass = 'fa-trash-can text-rose-400';
            else if (log.action === 'EDIT_QUANTITY') iconClass = 'fa-boxes-stacked text-cyan-400';
            else if (log.action === 'SERVICE') iconClass = 'fa-screwdriver-wrench text-amber-400';

            const div = document.createElement('div');
            div.className = 'relative flex gap-4';
            div.innerHTML = `
                <div class="absolute -left-[27px] top-1 bg-slate-900 border border-slate-700 w-6 h-6 rounded-full flex items-center justify-center z-10">
                    <i class="fa-solid ${iconClass} text-[10px]"></i>
                </div>
                ${!isLast ? '<div class="absolute -left-3 top-7 bottom-[-24px] w-[1px] bg-slate-700"></div>' : ''}
                <div class="flex-1 bg-slate-800/30 border border-slate-700/50 rounded-xl p-3 hover:bg-slate-800/60 transition-colors">
                    <div class="flex justify-between items-start mb-1">
                        <span class="text-white text-sm font-bold">${log.details}</span>
                        <span class="text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded-md border border-slate-700 shadow-sm shrink-0 ml-3">${log.date} ${log.time.replace(/\./g, ':')}</span>
                    </div>
                    <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mt-2">
                        <i class="fa-solid fa-user"></i> Oleh: ${log.user || 'System'}
                    </div>
                </div>
            `;
            listEl.appendChild(div);
        });
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
    }, 10);
}

window.closeItemHistoryModal = function () {
    const modal = document.getElementById('item-history-modal');
    const modalContent = document.getElementById('item-history-modal-content');

    modal.classList.add('opacity-0');
    modalContent.classList.add('scale-95');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

