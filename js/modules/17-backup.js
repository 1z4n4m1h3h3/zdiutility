// ============================================================
// EXPORT & BACKUP LOGIC
// ============================================================
window.openModal = function (id) {
    const modal = document.getElementById(id);
    const content = document.getElementById(id + '-content');
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            if (content) {
                content.classList.remove('scale-95');
                content.classList.add('scale-100');
            }
        }, 10);
    }
}

window.closeModal = function (id) {
    const modal = document.getElementById(id);
    const content = document.getElementById(id + '-content');
    if (modal) {
        modal.classList.add('opacity-0');
        if (content) {
            content.classList.remove('scale-100');
            content.classList.add('scale-95');
        }
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

window.toggleExportInvColumns = function () {
    const format = document.getElementById('export-inv-format');
    const colsContainer = document.getElementById('export-inv-columns-container');
    if (format && colsContainer) {
        if (format.value === 'label') {
            colsContainer.classList.add('hidden');
        } else {
            colsContainer.classList.remove('hidden');
        }
    }
};

window.submitExportInventory = async function () {
    const formatSelect = document.getElementById('export-inv-format');
    const format = formatSelect ? formatSelect.value : 'table';
    const category = document.getElementById('export-inv-category').value;

    const showId = document.getElementById('chk-inv-id').checked;
    const showName = document.getElementById('chk-inv-name').checked;
    const showCat = document.getElementById('chk-inv-cat').checked;
    const showQty = document.getElementById('chk-inv-qty').checked;
    const showCond = document.getElementById('chk-inv-cond').checked;

    const { jsPDF } = window.jspdf;

    const filteredData = inventory.filter(item => {
        if (category === 'All') return true;
        return item.category === category;
    });

    if (filteredData.length === 0) {
        showToast('Tidak ada data stok untuk kategori terpilih.', 'warning', 3000);
        return;
    }

    closeModal('modal-export-inv');

    if (format === 'label') {
        showToast('Menyiapkan file PDF Label Barcode...', 'info');
        setTimeout(() => {
            try {
                const doc = new jsPDF();
                const canvas = document.createElement('canvas');

                const pageWidth = 210;
                const pageHeight = 297;
                const margin = 10;
                const columns = 5;
                const labelWidth = (pageWidth - (margin * 2)) / columns;
                const labelHeight = 22;

                let x = margin;
                let y = margin;

                let successCount = 0;

                for (let i = 0; i < filteredData.length; i++) {
                    const item = filteredData[i];
                    const itemIdStr = String(item.id || 'N/A');
                    const nameStr = String(item.name || 'Tanpa Nama');

                    try {
                        canvas.width = 1;
                        canvas.height = 1;

                        JsBarcode(canvas, itemIdStr, {
                            format: "CODE128",
                            displayValue: false,
                            width: 1,
                            height: 25,
                            margin: 0
                        });

                        const barcodeDataUrl = canvas.toDataURL("image/png");

                        doc.setDrawColor(200, 200, 200);
                        doc.rect(x, y, labelWidth, labelHeight);

                        // Header Text
                        doc.setFontSize(5);
                        doc.setTextColor(0, 0, 0);
                        doc.text("ZDI STOCK UTILITY", x + (labelWidth / 2), y + 3, { align: 'center' });

                        // Add image to PDF
                        doc.addImage(barcodeDataUrl, 'PNG', x + 3, y + 4, labelWidth - 6, 10);

                        doc.setFontSize(7);
                        doc.setTextColor(50, 50, 50);
                        const truncatedName = nameStr.length > 20 ? nameStr.substring(0, 20) + '...' : nameStr;
                        doc.text(truncatedName, x + (labelWidth / 2), y + 17, { align: 'center' });

                        doc.setFontSize(6);
                        doc.text(`ID: ${itemIdStr}`, x + (labelWidth / 2), y + 20, { align: 'center' });

                        successCount++;

                        x += labelWidth;
                        if (x + labelWidth > pageWidth - margin + 1) {
                            x = margin;
                            y += labelHeight;
                        }

                        if (y + labelHeight > pageHeight - margin) {
                            if (i !== filteredData.length - 1) {
                                doc.addPage();
                                x = margin;
                                y = margin;
                            }
                        }

                    } catch (err) {
                        console.error("Error generating barcode for", itemIdStr, err);
                    }
                }

                if (successCount === 0) {
                    showToast('Gagal membuat barcode untuk semua barang.', 'error');
                    return;
                }

                const timestamp = new Date().toISOString().slice(0, 10);
                const catName = category === 'All' ? 'Semua' : category;
                doc.save(`Label_Barcode_${catName}_${timestamp}.pdf`);

                showToast('File Label Barcode berhasil diunduh!', 'success');
            } catch (mainErr) {
                console.error("Critical error in print barcode:", mainErr);
                alert("Terjadi error: " + mainErr.message);
                showToast('Gagal: ' + mainErr.message, 'error', 10000);
            }
        }, 100);
        return;
    }

    // Default Table format
    const doc = new jsPDF({ orientation: 'landscape' });

    const tableColumn = ["No."];
    if (showId) tableColumn.push("ID Item");
    if (showName) tableColumn.push("Nama Item");
    if (showCat) tableColumn.push("Kategori");
    if (showQty) tableColumn.push("Jumlah Stok");
    if (showCond) tableColumn.push("Kondisi");

    const tableRows = [];
    filteredData.forEach((item, index) => {
        const row = [(index + 1).toString()];
        if (showId) row.push(item.id);
        if (showName) row.push(item.name);
        if (showCat) row.push(item.category);
        if (showQty) row.push(item.qty.toString());
        if (showCond) row.push(item.condition || 'Normal');
        tableRows.push(row);
    });

    const img = new Image();
    img.src = 'Logo.png/Logo.png';

    img.onload = function () {
        const pageWidth = doc.internal.pageSize.getWidth();
        const xPos = (pageWidth / 2) - 20;
        doc.addImage(img, 'PNG', xPos, 10, 40, 40);
        drawInventoryHeaderAndSave(doc, tableColumn, tableRows, category);
    };
    img.onerror = function () {
        drawInventoryHeaderAndSave(doc, tableColumn, tableRows, category);
    };
}

function drawInventoryHeaderAndSave(doc, tableColumn, tableRows, category) {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("ZDI Stock Utility", pageWidth / 2, 58, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Laporan Inventory (${category})`, pageWidth / 2, 65, { align: 'center' });
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, 71, { align: 'center' });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 78,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 10, halign: 'center', valign: 'middle', overflow: 'linebreak' },
        headStyles: { fillColor: [16, 185, 129], halign: 'center' }, // emerald-500
        alternateRowStyles: { fillColor: [241, 245, 249] } // slate-100
    });

    doc.save(`ZDI_Stock_Inventory_${category}_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('Berhasil download file PDF Inventory!', 'success', 3000);
}

window.submitExportLogs = async function () {
    const timeRange = document.getElementById('export-logs-time').value;
    const showDate = document.getElementById('chk-log-date').checked;
    const showTime = document.getElementById('chk-log-time').checked;
    const showOp = document.getElementById('chk-log-op').checked;
    const showAct = document.getElementById('chk-log-act').checked;
    const showItem = document.getElementById('chk-log-item').checked;
    const showDetail = document.getElementById('chk-log-detail').checked;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' }); // Use landscape

    let limitDate = null;
    if (timeRange === 'Today') {
        limitDate = new Date();
        limitDate.setHours(0, 0, 0, 0);
    } else if (timeRange === '7Days') {
        limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 7);
        limitDate.setHours(0, 0, 0, 0);
    }

    const filteredData = activityLog.filter(log => {
        if (!limitDate) return true;
        const [day, month, year] = log.date.split('/');
        const logDateObj = new Date(`${year}-${month}-${day}T00:00:00`);
        return logDateObj >= limitDate;
    });

    if (filteredData.length === 0) {
        showToast('Tidak ada log aktivitas untuk rentang waktu terpilih.', 'warning', 3000);
        return;
    }

    const tableColumn = ["No."];
    if (showDate) tableColumn.push("Tanggal");
    if (showTime) tableColumn.push("Jam");
    if (showOp) tableColumn.push("Siapa Nih");
    if (showAct) tableColumn.push("Tindakan");
    if (showItem) tableColumn.push("Objek / Target");
    if (showDetail) tableColumn.push("Infonya");

    const tableRows = [];
    filteredData.forEach((log, index) => {
        const row = [(index + 1).toString()];
        if (showDate) row.push(log.date);
        if (showTime) row.push(log.time);
        if (showOp) row.push(log.user);
        if (showAct) row.push(log.action);
        if (showItem) row.push(log.itemName || '-');
        if (showDetail) row.push(log.details || '-');
        tableRows.push(row);
    });

    closeModal('modal-export-logs');

    const img = new Image();
    img.src = 'Logo.png/Logo.png';

    img.onload = function () {
        const pageWidth = doc.internal.pageSize.getWidth();
        const xPos = (pageWidth / 2) - 20; // 40 width / 2
        doc.addImage(img, 'PNG', xPos, 10, 40, 40);
        drawLogsHeaderAndSave(doc, tableColumn, tableRows, timeRange);
    };
    img.onerror = function () {
        drawLogsHeaderAndSave(doc, tableColumn, tableRows, timeRange);
    };
}

function drawLogsHeaderAndSave(doc, tableColumn, tableRows, timeRange) {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text("ZDI Stock Utility", pageWidth / 2, 58, { align: 'center' });

    let timeLabel = "Semua Waktu";
    if (timeRange === "Today") timeLabel = "Hari Ini";
    if (timeRange === "7Days") timeLabel = "7 Hari Terakhir";

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Laporan Log Aktivitas (${timeLabel})`, pageWidth / 2, 65, { align: 'center' });
    doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, 71, { align: 'center' });

    // Identify which index is "Infonya" column to apply left align wrapping if it exists
    const detailIndex = tableColumn.indexOf("Infonya");
    const colStyles = {};
    if (detailIndex !== -1) {
        colStyles[detailIndex] = { halign: 'left', cellWidth: 'auto' };
    }

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 78,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 9, halign: 'center', overflow: 'linebreak' },
        columnStyles: colStyles,
        headStyles: { fillColor: [6, 182, 212], halign: 'center' }, // cyan-500
        alternateRowStyles: { fillColor: [241, 245, 249] }
    });

    doc.save(`ZDI_Stock_Logs_${timeRange}_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('Berhasil download file PDF Logs!', 'success', 3000);
}

window.submitClearLogs = async function () {
    const timeRange = document.getElementById('clear-logs-time').value;
    const actionType = document.getElementById('clear-logs-action').value;

    let limitDate = null;
    if (timeRange === 'Today') {
        limitDate = new Date();
        limitDate.setHours(0, 0, 0, 0);
    } else if (timeRange === '7Days') {
        limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 7);
        limitDate.setHours(0, 0, 0, 0);
    } else if (timeRange === 'OlderThan30Days') {
        limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 30);
        limitDate.setHours(0, 0, 0, 0);
    }

    const filteredLogs = activityLog.filter(log => {
        let timeMatch = true;
        if (limitDate) {
            const [day, month, year] = log.date.split('/');
            const logDateObj = new Date(`${year}-${month}-${day}T00:00:00`);
            if (timeRange === 'OlderThan30Days') {
                timeMatch = logDateObj < limitDate;
            } else {
                timeMatch = logDateObj >= limitDate;
            }
        }

        let actionMatch = true;
        if (actionType === 'Access') {
            actionMatch = (log.action === 'LOGIN' || log.action === 'LOGOUT');
        } else if (actionType === 'Transaction') {
            actionMatch = (log.action === 'ADD_ITEM' || log.action === 'EDIT_QUANTITY' || log.action === 'DELETE_ITEM');
        }

        return timeMatch && actionMatch;
    });

    if (filteredLogs.length === 0) {
        showToast('Tidak ada log yang cocok dengan filter.', 'warning', 3000);
        return;
    }

    closeModal('modal-clear-logs');

    showCustomConfirm({
        title: 'Clear Activity Logs',
        message: `Yakin lu mau ngebuang ${filteredLogs.length} data log permanen? Tindakan ini tidak bisa dibatalkan.`,
        type: 'danger',
        onConfirm: async () => {
            const idsToDelete = filteredLogs.map(l => String(l.id));
            await deleteBulkFromStore('activity_log', idsToDelete);

            // Remove from local array
            activityLog = activityLog.filter(l => !idsToDelete.includes(String(l.id)));

            addToActivityLog('CLEAR_LOG', 'System Maintenance', `Admin ngebersihin ${idsToDelete.length} data log aktivitas.`);
            updateActivityLog();
            showToast(`Sukses ngebuang ${idsToDelete.length} log aktivitas 🗑️`, 'warning', 3000);
        }
    });
}

window.backupDatabase = function () {
    showToast('Sedang mendownload database SQLite...', 'info', 2000);
    const link = document.createElement("a");
    link.setAttribute("href", "/api/backup");
    link.setAttribute("download", `ZDI_Stock_Backup.sqlite`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

