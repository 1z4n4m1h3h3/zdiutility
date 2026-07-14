// ============================================================
// EXCEL IMPORT & EXPORT SYSTEM
// ============================================================
window.downloadExcelTemplate = function() {
    // Sheet 1: Aset Umum
    const wsUmumData = [
        ["PANDUAN PENGISIAN ASET UMUM:"],
        ["- Kategori wajib diisi salah satu dari: PC, Laptop, Monitor, CCTV, Doorlock, Consumable"],
        ["- Stok wajib berupa angka."],
        ["- Kondisi bisa diisi: Normal, Rusak, Sedang Servis, dsb."],
        [],
        ["Nama Barang", "Kategori", "Stok", "Kondisi"],
        ["Contoh Laptop ROG", "Laptop", 10, "Normal"],
        ["Contoh Kabel LAN", "Consumable", 50, "Baru"],
        ["Monitor Samsung 24", "Monitor", 5, "Normal"]
    ];
    const wsUmum = XLSX.utils.aoa_to_sheet(wsUmumData);
    wsUmum['!cols'] = [{wch: 30}, {wch: 15}, {wch: 10}, {wch: 15}];
    
    // Sheet 2: Printer Spesifik
    const wsPrinterData = [
        ["PANDUAN PENGISIAN PRINTER:"],
        ["- NAMA PRINTER wajib diisi."],
        ["- VENDOR, IP PRINTER, dan DEPARTEMENT bersifat opsional tapi sangat disarankan."],
        [],
        ["NAMA PRINTER", "VENDOR", "IP PRINTER", "DEPARTEMENT"],
        ["HP LaserJet Pro M404n", "MSTEK", "192.168.1.100", "HRD"],
        ["Epson L3110", "INKNARA", "USB", "Finance"],
        ["Konica Minolta Bizhub", "KOINK", "192.168.1.105", "Operation"]
    ];
    const wsPrinter = XLSX.utils.aoa_to_sheet(wsPrinterData);
    wsPrinter['!cols'] = [{wch: 30}, {wch: 15}, {wch: 15}, {wch: 20}];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsUmum, "Format_Aset_Umum");
    XLSX.utils.book_append_sheet(wb, wsPrinter, "Format_Printer");
    XLSX.writeFile(wb, "Template_Import_Assets.xlsx");
}

const excelFileInput = document.getElementById('excel-file');
if (excelFileInput) {
    excelFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                let headerRowIndex = 0;
                
                // Cari baris yang mengandung header NAMA PRINTER atau Nama Barang
                for (let i = 0; i < Math.min(10, rawData.length); i++) {
                    const row = rawData[i] || [];
                    const isHeader = row.some(c => typeof c === 'string' && (c.trim().toUpperCase() === 'NAMA PRINTER' || c.trim().toUpperCase() === 'NAMA BARANG'));
                    if (isHeader) {
                        headerRowIndex = i;
                        break;
                    }
                }

                // Parse json mulai dari baris header tersebut
                const rawJsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });
                
                // Bersihkan (trim) nama kolom untuk menghindari error karena spasi di excel
                const jsonData = rawJsonData.map(row => {
                    const newRow = {};
                    for (const key in row) {
                        newRow[key.toString().trim()] = row[key];
                    }
                    return newRow;
                });

                if (jsonData.length === 0) {
                    showToast('File Excel kosong atau format tidak sesuai!', 'error', 3000);
                    return;
                }

                let importedCount = 0;
                for (const row of jsonData) {
                    if (row['NAMA PRINTER']) {
                        // Format Spesifik Printer
                        const newItem = {
                            id: generateBarcodeId('Printer'),
                            name: row['NAMA PRINTER'].toString().trim(),
                            category: 'Printer',
                            qty: 1,
                            condition: 'Normal',
                            ip: (row['IP PRINTER'] || row['IP'] || row['IP_ADDRESS']) ? (row['IP PRINTER'] || row['IP'] || row['IP_ADDRESS']).toString().trim() : '',
                            department: (row['DEPARTEMENT'] || row['DEPARTEMEN'] || row['DAPARTEMEN'] || row['AREA']) ? (row['DEPARTEMENT'] || row['DEPARTEMEN'] || row['DAPARTEMEN'] || row['AREA']).toString().trim() : '',
                            vendor: row['VENDOR'] ? row['VENDOR'].toString().trim() : ''
                        };

                        const existingIndex = inventory.findIndex(item =>
                            item.name.toLowerCase() === newItem.name.toLowerCase() && 
                            item.category === newItem.category && 
                            (item.ip || '') === (newItem.ip || '') &&
                            (item.department || '') === (newItem.department || '')
                        );

                        if (existingIndex !== -1) {
                            inventory[existingIndex].qty += newItem.qty;
                            await saveToStore('inventory', inventory[existingIndex]);
                        } else {
                            inventory.push(newItem);
                            await saveToStore('inventory', newItem);
                        }
                        importedCount++;
                    } else if (row['Nama Barang'] && row['Kategori'] && row['Stok'] !== undefined) {
                        // Format Umum Asset
                        const cat = row['Kategori'];
                        if (['PC', 'Laptop', 'Monitor', 'Printer', 'CCTV', 'Doorlock', 'Consumable'].includes(cat)) {
                            const newItem = {
                                id: generateBarcodeId(cat),
                                name: row['Nama Barang'].toString().trim(),
                                category: cat,
                                qty: Math.max(0, parseInt(row['Stok']) || 0),
                                condition: row['Kondisi'] || 'Normal'
                            };

                            const existingIndex = inventory.findIndex(item => {
                                if (newItem.category === 'Printer') {
                                    return item.name.toLowerCase() === newItem.name.toLowerCase() &&
                                           item.category === newItem.category &&
                                           (item.ip || '') === (newItem.ip || '') &&
                                           (item.department || '') === (newItem.department || '');
                                }
                                return item.name.toLowerCase() === newItem.name.toLowerCase() && 
                                       item.category === newItem.category && 
                                       (item.condition || 'Normal') === newItem.condition;
                            });

                            if (existingIndex !== -1) {
                                inventory[existingIndex].qty += newItem.qty;
                                await saveToStore('inventory', inventory[existingIndex]);
                            } else {
                                inventory.push(newItem);
                                await saveToStore('inventory', newItem);
                            }
                            importedCount++;
                        }
                    }
                }

                if (importedCount > 0) {
                    addToActivityLog('ADD_ITEM', 'Bulk Import', `Import ${importedCount} barang dari file Excel berhasil.`);
                    showToast(`Berhasil import ${importedCount} barang! 🎉`, 'success', 4000);
                    updateDashboard();
                    renderSvcItemDropdown();
                } else {
                    showToast('Tidak ada data valid yang bisa diimport. Cek format template.', 'warning', 4000);
                }
            } catch (err) {
                console.error(err);
                showToast('Gagal membaca file Excel!', 'error', 3000);
            }
            excelFileInput.value = '';
        };
        reader.readAsArrayBuffer(file);
    });
}

