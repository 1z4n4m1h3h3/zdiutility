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

    if (borrowingsList.length === 0) {
        tableBody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    tableBody.innerHTML = '';

    borrowingsList.forEach(b => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-800/20 transition-colors';
        tr.innerHTML = `
            <td class="p-4 font-semibold text-white whitespace-nowrap">${b.itemName}</td>
            <td class="p-4 text-slate-300 whitespace-nowrap"><i class="fa-solid fa-user-tag text-xs text-slate-500 mr-1.5"></i>${b.borrower}</td>
            <td class="p-4 text-slate-300 whitespace-nowrap">${b.dateBorrowed}</td>
            <td class="p-4 text-right">
                <button onclick="finishBorrow('${b.id}')" class="btn-action-3d h-8 px-4 rounded-xl bg-indigo-950/40 hover:bg-indigo-600 text-indigo-400 hover:text-white flex items-center justify-center cursor-pointer border border-indigo-900/30 transition-colors text-xs font-bold shadow-sm ml-auto">
                    Kembalikan
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const borrowForm = document.getElementById('borrow-form');
    if (borrowForm) {
        borrowForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const itemId = document.getElementById('borrow-item').value;
            const borrower = document.getElementById('borrow-name').value.trim();
            const dateBorrowed = document.getElementById('borrow-date').value;

            if (!itemId) {
                showToast('Pilih barang yang mau dipinjam!', 'warning');
                return;
            }

            const item = inventory.find(i => i.id === itemId);
            if (!item || item.qty <= 0) {
                showToast('Barang tidak tersedia atau stok habis.', 'error');
                return;
            }

            // Deduct stock
            item.qty -= 1;
            await saveToStore('inventory', item);

            const newBorrowing = {
                id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
                itemId: item.id,
                itemName: item.name,
                borrower: borrower,
                dateBorrowed: dateBorrowed,
                createdAt: Date.now()
            };

            borrowingsList.push(newBorrowing);
            await saveToStore('borrowings', newBorrowing);

            addToActivityLog('EDIT_QUANTITY', item.name, `Aset dipinjam oleh ${borrower}. Stok -1`);

            if (window.sendTelegramNotification) {
                window.sendTelegramNotification(`🤝 *INFO PEMINJAMAN*\n\nBarang: *${item.name}*\nPeminjam: *${borrower}*\nTanggal: ${dateBorrowed}\n\nStok gudang sisa: ${item.qty}`);
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

