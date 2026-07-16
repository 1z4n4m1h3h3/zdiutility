// ============================================================
// FITUR: PRINTER DAMAGE LOG
// ============================================================

window.openPrinterDamageModal = function(printerId, printerName) {
    document.getElementById('damage-printer-id').value = printerId;
    document.getElementById('damage-printer-name').textContent = printerName;
    document.getElementById('damage-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('damage-reporter').value = sessionStorage.getItem('arf_active_user') || '';
    document.getElementById('damage-desc').value = '';
    document.getElementById('damage-action').value = 'log_only';
    
    openModal('modal-printer-damage');
}

document.getElementById('form-printer-damage')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const printerId = document.getElementById('damage-printer-id').value;
    const printerName = document.getElementById('damage-printer-name').textContent;
    const damageDate = document.getElementById('damage-date').value;
    const reportedBy = document.getElementById('damage-reporter').value;
    const description = document.getElementById('damage-desc').value;
    const action = document.getElementById('damage-action').value;
    
    const logId = 'PLG' + Date.now() + Math.random().toString(36).substring(2, 7);
    
    const logData = {
        id: logId,
        printerId: printerId,
        printerName: printerName,
        damageDate: damageDate,
        description: description,
        reportedBy: reportedBy,
        status: action === 'set_broken' ? 'Rusak' : 'Dilaporkan',
        createdAt: Date.now()
    };
    
    // Simpan ke tabel printer_logs
    await saveData('printer_logs', logData);
    
    // Jika user memilih untuk mengubah status printer menjadi Rusak
    if (action === 'set_broken') {
        const item = inventory.find(i => i.id === printerId);
        if (item) {
            item.condition = 'Rusak';
            await saveData('inventory', item);
            
            // Log aktivitas umum juga
            logActivity('Ubah Kondisi', printerName, `Kondisi diubah menjadi Rusak. Laporan: ${description}`);
        }
    } else {
        logActivity('Lapor Kerusakan', printerName, `Printer dilaporkan bermasalah: ${description}`);
    }
    
    closeModal('modal-printer-damage');
    showToast('Berhasil', 'Log kerusakan printer berhasil disimpan.', 'success');
});
