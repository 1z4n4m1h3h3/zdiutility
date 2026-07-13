// ============================================================
// ACTIVITY LOG SYSTEM (Mencatat setiap perubahan data)
// ============================================================
function getFormattedDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const time = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(/\./g, ':');
    return { date, time, fullDateTime: `${date} ${time}` };
}

function addToActivityLog(action, itemName, details) {
    const { date, time, fullDateTime } = getFormattedDateTime();
    const activeUser = sessionStorage.getItem('arf_active_user') || 'System';
    const logEntry = {
        id: Date.now(),
        timestamp: fullDateTime,
        date,
        time,
        action,
        itemName,
        details,
        user: activeUser,
        createdAt: new Date().getTime()
    };

    activityLog.unshift(logEntry); // Add to beginning (newest first)

    // Keep only last 100 logs
    if (activityLog.length > 100) {
        const removedLogs = activityLog.slice(100);
        activityLog = activityLog.slice(0, 100);
        // Hapus log lama dari database IndexedDB secara asinkron
        removedLogs.forEach(log => {
            deleteFromStore('activity_log', log.id).catch(console.error);
        });
    }

    saveToStore('activity_log', logEntry).catch(console.error);
    updateActivityLog();
}

function updateActivityLog() {
    const logBody = document.getElementById('activity-log-body');
    if (!logBody) return;

    if (activityLog.length === 0) {
        logBody.innerHTML = '';
        document.getElementById('empty-log-state').classList.remove('hidden');
        return;
    }

    document.getElementById('empty-log-state').classList.add('hidden');
    logBody.innerHTML = '';

    activityLog.forEach(log => {
        const tr = document.createElement('tr');
        tr.className = 'row-animate hover:bg-slate-800/20 text-sm';

        let actionBadge = '';
        let actionColor = '';
        let actionIcon = '';

        if (log.action === 'EDIT_QUANTITY') {
            actionBadge = '📊 Ngubah Stok';
            actionColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            actionIcon = 'fa-solid fa-pen-to-square';
        } else if (log.action === 'CLEAR_LOG') {
            actionBadge = '🧹 Bersihin Jejak';
            actionColor = 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20';
            actionIcon = 'fa-solid fa-broom';
        } else if (log.action === 'DELETE_ITEM') {
            actionBadge = '🗑️ Buang Barang';
            actionColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            actionIcon = 'fa-solid fa-trash-can';
        } else if (log.action === 'ADD_ITEM') {
            actionBadge = '➕ Nambah Barang';
            actionColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            actionIcon = 'fa-solid fa-plus-circle';
        } else if (log.action === 'LOGIN') {
            actionBadge = '🔑 Masuk Sistem';
            actionColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            actionIcon = 'fa-solid fa-right-to-bracket';
        } else if (log.action === 'LOGOUT') {
            actionBadge = '🚪 Cabut dari Sistem';
            actionColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            actionIcon = 'fa-solid fa-power-off';
        } else if (log.action === 'MAINTENANCE_OUT') {
            actionBadge = '🛠️ Kirim Servis';
            actionColor = 'text-orange-400 bg-orange-500/10 border-orange-500/20';
            actionIcon = 'fa-solid fa-wrench';
        } else if (log.action === 'MAINTENANCE_IN') {
            actionBadge = '✅ Selesai Servis';
            actionColor = 'text-teal-400 bg-teal-500/10 border-teal-500/20';
            actionIcon = 'fa-solid fa-check-double';
        } else if (log.action === 'EDIT_ITEM') {
            actionBadge = '📝 Ngubah Data';
            actionColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            actionIcon = 'fa-solid fa-pen';
        }

        tr.innerHTML = `
            <td class="p-3 md:p-4 pl-4 md:pl-6 text-xs text-slate-400 whitespace-nowrap">${log.date}</td>
            <td class="p-3 md:p-4 text-xs font-bold text-cyan-400 whitespace-nowrap">${log.time.replace(/\./g, ':')}</td>
            <td class="p-3 md:p-4 text-xs font-medium text-slate-300 whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5"><i class="fa-solid fa-user-tag text-[10px] text-slate-500"></i> ${log.user || 'System'}</span>
            </td>
            <td class="p-3 md:p-4 whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${actionColor} border shadow-sm">
                    <i class="${actionIcon} text-[10px]"></i> ${actionBadge}
                </span>
            </td>
            <td class="p-3 md:p-4 font-semibold text-slate-200 min-w-[120px] whitespace-normal break-words">${log.itemName}</td>
            <td class="p-3 md:p-4 text-xs text-slate-400 min-w-[200px] whitespace-normal break-words">${log.details}</td>
        `;
        logBody.appendChild(tr);
    });
}

