// ============================================================
// SETTINGS & TELEGRAM NOTIFICATIONS
// ============================================================
window.openSettingsModal = function () {
    const modal = document.getElementById('settings-modal');
    const modalContent = document.getElementById('settings-modal-content');

    fetch(`${API_URL}/api/settings`)
        .then(res => res.json())
        .then(data => {
            if (data.telegramBotToken) document.getElementById('setting-bot-token').value = data.telegramBotToken;
            if (data.telegramChatId) document.getElementById('setting-chat-id').value = data.telegramChatId;
        })
        .catch(err => console.error('Failed to load settings', err));

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
    }, 10);
}

window.closeSettingsModal = function () {
    const modal = document.getElementById('settings-modal');
    const modalContent = document.getElementById('settings-modal-content');

    modal.classList.add('opacity-0');
    modalContent.classList.add('scale-95');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

window.saveSettings = function () {
    const botToken = document.getElementById('setting-bot-token').value.trim();
    const chatId = document.getElementById('setting-chat-id').value.trim();

    const settings = {
        telegramBotToken: botToken,
        telegramChatId: chatId
    };

    fetch(`${API_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast('Pengaturan berhasil disimpan!', 'success');
                closeSettingsModal();
            } else {
                showToast('Gagal menyimpan pengaturan.', 'error');
            }
        })
        .catch(err => {
            console.error(err);
            showToast('Koneksi ke server gagal.', 'error');
        });
}

window.sendTelegramNotification = function (message) {
    fetch(`${API_URL}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) console.error('Telegram Error:', data.error);
        })
        .catch(err => console.error('Telegram Notification Failed:', err));
}

window.testTelegram = function () {
    const botToken = document.getElementById('setting-bot-token').value.trim();
    const chatId = document.getElementById('setting-chat-id').value.trim();
    if (!botToken || !chatId) {
        showToast('Isi Bot Token dan Chat ID dulu!', 'warning');
        return;
    }

    // Save first to ensure the latest token is used
    saveSettings();
    setTimeout(() => {
        window.sendTelegramNotification('🤖 *ZDI Stock Utility*\nTes pesan berhasil! Bot Telegram sudah terkoneksi dengan aplikasi.');
    }, 500);
}

window.changeQty = function (id, amount) {
    const item = inventory.find(i => i.id == id);
    if (!item) return;

    const itemName = item.name;
    const oldQty = item.qty;

    item.qty += amount;
    if (item.qty < 0) item.qty = 0;

    const newQty = item.qty;

    // Telegram Alert for Low Stock
    if (newQty <= 3 && oldQty > 3) {
        if (window.sendTelegramNotification) {
            window.sendTelegramNotification(`⚠️ *PERINGATAN STOK MENIPIS*\nBarang: *${itemName}*\nSisa Stok: *${newQty}*\nKategori: ${item.category}\n\nSegera lakukan restock!`);
        }
    }
    const action = amount > 0 ? 'ditambah' : 'dikurangi';
    const diff = Math.abs(amount);

    saveToStore('inventory', item).catch(console.error);
    addToActivityLog('EDIT_QUANTITY', itemName, `${action} ${diff} unit (${oldQty} → ${newQty})`);
    showToast(`Stok "${itemName}" ${action} ${diff} unit (${oldQty} → ${newQty})`, 'info', 2000);
    updateDashboard();
}

window.cycleCategory = function (id) {
    const item = inventory.find(i => i.id == id);
    if (!item) return;

    const categories = ['PC', 'CCTV', 'Doorlock', 'Consumable'];
    const currentIndex = categories.indexOf(item.category);
    const nextIndex = (currentIndex + 1) % categories.length;

    const oldCat = item.category;
    item.category = categories[nextIndex];

    // Normalize condition if changing TO Consumable or FROM Consumable
    if (item.category === 'Consumable' && item.condition === 'Normal') item.condition = 'Baru';
    if (item.category === 'Consumable' && item.condition === 'Rusak') item.condition = 'Bekas';
    if (item.category !== 'Consumable' && item.condition === 'Baru') item.condition = 'Normal';
    if (item.category !== 'Consumable' && item.condition === 'Bekas') item.condition = 'Rusak';

    saveToStore('inventory', item).catch(console.error);
    addToActivityLog('EDIT_ITEM', item.name, `Peruntukan diubah dari ${oldCat} menjadi ${item.category}`);
    updateDashboard();
}

window.toggleCondition = function (id) {
    const item = inventory.find(i => i.id == id);
    if (!item) return;

    const oldCond = item.condition || 'Normal';

    if (item.category === 'Consumable') {
        item.condition = (oldCond === 'Baru' || oldCond === 'Normal') ? 'Bekas' : 'Baru';
    } else {
        item.condition = (oldCond === 'Normal' || oldCond === 'Baru') ? 'Rusak' : 'Normal';
    }

    saveToStore('inventory', item).catch(console.error);
    addToActivityLog('EDIT_ITEM', item.name, `Kondisi diubah dari ${oldCond} menjadi ${item.condition}`);
    updateDashboard();
}

// Sistem Hapus Item Kustom
window.deleteItem = function (id) {
    const index = inventory.findIndex(i => i.id == id);
    if (index === -1) return;

    showCustomConfirm({
        title: 'Hapus Barang',
        message: `Apakah anda yakin ingin menghapus "${inventory[index].name}" dari daftar stok?`,
        type: 'danger',
        onConfirm: () => {
            const itemToDelete = inventory[index];
            const itemName = itemToDelete.name;
            inventory.splice(index, 1);

            deleteFromStore('inventory', itemToDelete.id).catch(console.error);
            addToActivityLog('DELETE_ITEM', itemName, 'Barangnya udah dibuang dari sistem');
            showToast(`Item "${itemName}" telah dihapus dari stok 🗑️`, 'warning', 2500);
            updateDashboard();
            renderSvcItemDropdown();
        }
    });
}

