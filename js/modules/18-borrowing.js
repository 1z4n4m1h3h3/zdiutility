// ============================================================
// SISTEM PEMINJAMAN ASET
// ============================================================
window.renderBorrowItemDropdown = function () {
    const borrowItemSelect = document.getElementById('borrow-item');
    if (!borrowItemSelect) return;

    // Only show items with qty > 0 and NOT consumable
    const availableItems = inventory.filter(i => i.qty > 0 && i.category !== 'Consumable');

    let html = '<option value="" disabled selected class="bg-slate-950 text-slate-500">Pilih Barang yang Mau Dipinjam</option>';
    availableItems.forEach(item => {
        html += `<option value="${item.id}" class="bg-slate-950 text-white">[Stok: ${item.qty}] ${item.name} (${item.category})</option>`;
    });

    borrowItemSelect.innerHTML = html;
}

window.renderBorrowingsTable = function () {
    const tableBody = document.getElementById('borrowings-table-body');
    const emptyState = document.getElementById('borrowings-empty-state');
    if (!tableBody || !emptyState) return;

    const filterName = document.getElementById('filter-borrow-name')?.value.toLowerCase() || '';
    const filterDate = document.getElementById('filter-borrow-date')?.value || '';

    const filteredBorrowings = borrowingsList.filter(b => {
        const matchesName = !filterName || (b.borrower && b.borrower.toLowerCase().includes(filterName));
        const matchesDate = !filterDate || b.dateBorrowed === filterDate;
        return matchesName && matchesDate;
    });

    if (filteredBorrowings.length === 0) {
        tableBody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    tableBody.innerHTML = '';

    filteredBorrowings.forEach(b => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-800/20 transition-colors';
        tr.innerHTML = `
            <td class="p-4 font-semibold text-white whitespace-nowrap">${b.itemName}</td>
            <td class="p-4 text-slate-300 whitespace-nowrap"><i class="fa-solid fa-user-tag text-xs text-slate-500 mr-1.5"></i>${b.borrower} <span class="ml-2 text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">${b.location || '-'}</span></td>
            <td class="p-4 text-slate-300 whitespace-nowrap">${b.dateBorrowed}</td>
            <td class="p-4 font-bold text-slate-400 whitespace-nowrap">${b.dateReturn || '-'}</td>
            <td class="p-4 whitespace-nowrap">
                ${b.attachment ? `<a href="${API_URL}${b.attachment}" target="_blank" class="text-cyan-400 hover:text-cyan-300 text-[10px] uppercase font-bold flex items-center gap-1"><i class="fa-solid fa-image"></i> Lihat</a>` : '-'}
            </td>
            <td class="p-4 text-right">
                <button onclick="finishBorrow('${b.id}')" class="btn-action-3d h-8 px-4 rounded-xl bg-indigo-950/40 hover:bg-indigo-600 text-indigo-400 hover:text-white flex items-center justify-center cursor-pointer border border-indigo-900/30 transition-colors text-xs font-bold shadow-sm ml-auto">
                    Kembalikan
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Update Summary Badges
    const summaryDiv = document.getElementById('borrow-summary');
    if (summaryDiv) {
        let totalReturned = parseInt(localStorage.getItem('arf_total_returned') || '0');
        
        if (borrowingsList.length > 0 || totalReturned > 0) {
            const itemNames = borrowingsList.map(b => b.itemName).join(', ');
            let html = '';
            
            if (borrowingsList.length > 0) {
                html += `
                    <div class="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/50 flex items-center gap-2 max-w-2xl">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Total Dipinjam:</span>
                        <span class="text-xs font-black text-white truncate" title="${itemNames}">${borrowingsList.length} Barang (${itemNames})</span>
                    </div>
                `;
            }
            
            if (totalReturned > 0) {
                html += `
                    <div class="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-900/50 flex items-center gap-2">
                        <span class="text-[10px] font-bold text-emerald-500/70 uppercase tracking-wider whitespace-nowrap">Total Dikembalikan:</span>
                        <span class="text-xs font-black text-emerald-400 whitespace-nowrap">${totalReturned} Barang</span>
                    </div>
                `;
            }
            
            summaryDiv.innerHTML = html;
        } else {
            summaryDiv.innerHTML = '';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const borrowForm = document.getElementById('borrow-form');
    if (borrowForm) {
        borrowForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const itemId = document.getElementById('borrow-item').value;
            const borrowerName = document.getElementById('borrow-name').value;
            const borrowerLocation = document.getElementById('borrow-location').value;
            const dateBorrowed = document.getElementById('borrow-date').value;
            const dateReturn = document.getElementById('borrow-return-date').value;
            const fileInput = document.getElementById('borrow-attachment');
            const attachmentFile = fileInput.files[0];
            
            const itemIndex = inventory.findIndex(i => i.id === itemId);
            if (itemIndex === -1) {
                showToast('Barang tidak ditemukan!', 'error', 'fa-triangle-exclamation');
                return;
            }

            const item = inventory[itemIndex];
            if (item.qty <= 0) {
                showToast('Stok barang habis!', 'error', 'fa-triangle-exclamation');
                return;
            }

            // Deduct stock
            item.qty -= 1;
            await saveToStore('inventory', item);

            // Handle file upload
            let attachmentUrl = null;
            if (attachmentFile) {
                const formData = new FormData();
                formData.append('attachment', attachmentFile);
                try {
                    const res = await fetch(`${API_URL}/api/upload`, {
                        method: 'POST',
                        headers: { ...getAuthHeaders() },
                        body: formData
                    });
                    const data = await res.json();
                    if (data.success) attachmentUrl = data.url;
                } catch (e) {
                    console.error('File upload failed:', e);
                }
            }

            const newBorrowing = {
                id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
                itemId: item.id,
                itemName: item.name,
                borrower: borrowerName,
                location: borrowerLocation,
                dateBorrowed: dateBorrowed,
                dateReturn: dateReturn,
                attachment: attachmentUrl,
                reminderSent: 0,
                createdAt: Date.now()
            };

            borrowingsList.push(newBorrowing);
            await saveToStore('borrowings', newBorrowing);

            addToActivityLog('EDIT_QUANTITY', item.name, `Aset dipinjam oleh ${borrowerName} (${borrowerLocation}). Stok -1`);

            if (window.sendTelegramNotification) {
                window.sendTelegramNotification(`🤝 *INFO PEMINJAMAN*\n\nBarang: *${item.name}*\nPeminjam: *${borrowerName}*\nLokasi: *${borrowerLocation}*\nTanggal: ${dateBorrowed}\n\nStok gudang sisa: ${item.qty}`);
            }

            borrowForm.reset();
            renderBorrowItemDropdown();
            renderBorrowingsTable();
            updateDashboard();
            updateChart();
            showToast(`Aset ${item.name} berhasil dipinjamkan.`, 'success');
        });
    }
});

window.finishBorrow = async function (id) {
    const bIndex = borrowingsList.findIndex(b => b.id === id);
    if (bIndex === -1) return;

    const b = borrowingsList[bIndex];

    showCustomConfirm({
        title: 'Kembalikan Aset',
        message: `Aset ${b.itemName} akan dikembalikan oleh ${b.borrower}. Lanjutkan?`,
        type: 'info',
        onConfirm: async () => {
            // Restore stock
            const item = inventory.find(i => i.id === b.itemId);
            if (item) {
                item.qty += 1;
                await saveToStore('inventory', item);
            }

            // Delete borrowing record
            await deleteFromStore('borrowings', b.id);
            borrowingsList.splice(bIndex, 1);

            // Increment total returned counter
            let totalReturned = parseInt(localStorage.getItem('arf_total_returned') || '0');
            localStorage.setItem('arf_total_returned', totalReturned + 1);

            addToActivityLog('EDIT_QUANTITY', b.itemName, `Aset dikembalikan oleh ${b.borrower}. Stok +1`);

            if (window.sendTelegramNotification) {
                window.sendTelegramNotification(`✅ *ASET DIKEMBALIKAN*\n\nBarang: *${b.itemName}*\nPeminjam: *${b.borrower}*\n\nStok barang bertambah +1.`);
            }

            renderBorrowItemDropdown();
            renderBorrowingsTable();
            updateDashboard();
            updateChart();
            showToast(`Aset ${b.itemName} berhasil dikembalikan.`, 'success');
        }
    });
}

