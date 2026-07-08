// ============================================================
// EXCEL IMPORT & EXPORT SYSTEM
// ============================================================
window.downloadExcelTemplate = function() {
    const ws = XLSX.utils.json_to_sheet([{
        "Nama Barang": "Contoh Laptop ROG",
        "Kategori": "Laptop",
        "Stok": 10,
        "Kondisi": "Normal"
    }, {
        "Nama Barang": "Contoh Kabel LAN",
        "Kategori": "Consumable",
        "Stok": 50,
        "Kondisi": "Baru"
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Assets");
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

