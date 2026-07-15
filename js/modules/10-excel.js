// ============================================================
// EXCEL IMPORT & EXPORT SYSTEM
// ============================================================
window.downloadExcelTemplate = function() {
    // Sheet 1: Data Aset (Clean table starting from row 1)
    const wsData = [
        ["Nama Barang", "Kategori", "Stok", "Kondisi", "Vendor", "Area", "IP Address"],
        ["Laptop ROG", "Laptop", 10, "Normal", "PT. Asus", "IT Dept", ""],
        ["Kabel LAN", "Consumable", 50, "Baru", "Toko Komputer", "Gudang", ""],
        ["Monitor Samsung 24", "Monitor", 5, "Normal", "PT. Samsung", "Operation", ""],
        ["Epson L3110", "Printer", 2, "Baru", "PT. Epson", "HRD", "USB"],
        ["Konica Minolta", "Printer", 1, "Normal", "PT. Konica", "Finance", "192.168.1.100"]
    ];
    const wsAset = XLSX.utils.aoa_to_sheet(wsData);
    
    // Add bold header style if supported (basic styling)
    wsAset['!cols'] = [{wch: 30}, {wch: 15}, {wch: 10}, {wch: 15}, {wch: 20}, {wch: 20}, {wch: 15}];
    
    // Sheet 2: Panduan (Instructions)
    const wsPanduanData = [
        ["PANDUAN PENGISIAN DATA ASET:"],
        [""],
        ["1. Nama Barang", "Wajib diisi dengan nama aset/barang."],
        ["2. Kategori", "Wajib diisi salah satu dari: PC, Laptop, Monitor, Printer, CCTV, Doorlock, Consumable."],
        ["3. Stok", "Wajib diisi dengan angka (contoh: 10)."],
        ["4. Kondisi", "Opsional. Default: Normal. (Pilihan: Normal, Rusak, Baru, Bekas)"],
        ["5. Vendor", "Opsional. Nama vendor atau supplier barang."],
        ["6. Area", "Opsional. Lokasi atau departemen tempat barang berada."],
        ["7. IP Address", "Opsional. Khusus untuk Printer atau PC/CCTV yang memiliki IP."]
    ];
    const wsPanduan = XLSX.utils.aoa_to_sheet(wsPanduanData);
    wsPanduan['!cols'] = [{wch: 15}, {wch: 80}];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsAset, "Data_Aset");
    XLSX.utils.book_append_sheet(wb, wsPanduan, "Panduan");
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
                
                // Cari sheet yang namanya mirip Data_Aset atau Sheet1
                let targetSheetName = workbook.SheetNames[0];
                for(const name of workbook.SheetNames) {
                    if(name.toLowerCase().includes('data') || name.toLowerCase().includes('aset')) {
                        targetSheetName = name;
                        break;
                    }
                }
                const worksheet = workbook.Sheets[targetSheetName];
                const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                let headerRowIndex = 0;
                
                // Cari baris header
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
                
                // Bersihkan nama kolom
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
                    // Fallback untuk format lama (NAMA PRINTER)
                    if (row['NAMA PRINTER']) {
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
                    } 
                    // Format standar gabungan
                    else if (row['Nama Barang'] && row['Kategori'] && row['Stok'] !== undefined) {
                        const cat = row['Kategori'].toString().trim();
                        // Validasi kategori secara case-insensitive
                        const validCategories = ['PC', 'Laptop', 'Monitor', 'Printer', 'CCTV', 'Doorlock', 'Consumable'];
                        const matchedCat = validCategories.find(c => c.toLowerCase() === cat.toLowerCase());
                        
                        if (matchedCat) {
                            const newItem = {
                                id: generateBarcodeId(matchedCat),
                                name: row['Nama Barang'].toString().trim(),
                                category: matchedCat,
                                qty: Math.max(0, parseInt(row['Stok']) || 0),
                                condition: row['Kondisi'] ? row['Kondisi'].toString().trim() : 'Normal',
                                vendor: row['Vendor'] ? row['Vendor'].toString().trim() : '',
                                department: (row['Area'] || row['Departemen'] || row['Department']) ? (row['Area'] || row['Departemen'] || row['Department']).toString().trim() : '',
                                ip: (row['IP Address'] || row['IP']) ? (row['IP Address'] || row['IP']).toString().trim() : ''
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

