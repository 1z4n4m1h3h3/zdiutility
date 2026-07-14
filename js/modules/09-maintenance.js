// ============================================================
// MAINTENANCE & SERVICES SYSTEM
// ============================================================
const maintenanceForm = document.getElementById('maintenance-form');
const servicesTableBody = document.getElementById('services-table-body');
const servicesEmptyState = document.getElementById('services-empty-state');

function renderSvcItemDropdown() {
    const dropdown = document.getElementById('svc-item');
    if (!dropdown) return;

    // Simpan selected value jika ada
    const currentVal = dropdown.value;

    dropdown.innerHTML = '<option value="" disabled selected class="bg-slate-950 text-slate-500">Pilih Barang Rusak</option>';

    // Hanya tampilkan barang yang stoknya > 0 dan kondisinya Rusak
    inventory.filter(i => i.qty > 0 && i.condition && i.condition.toLowerCase() === 'rusak').forEach(item => {
        dropdown.innerHTML += `<option value="${item.id}">${item.name} (Sisa: ${item.qty})</option>`;
    });

    // Restore selected value
    if (currentVal && dropdown.querySelector(`option[value="${currentVal}"]`)) {
        dropdown.value = currentVal;
    }
}

function renderServicesTable() {
    if (!servicesTableBody) return;

    servicesTableBody.innerHTML = '';

    if (maintenanceList.length === 0) {
        if (servicesEmptyState) servicesEmptyState.classList.remove('hidden');
        return;
    }

    if (servicesEmptyState) servicesEmptyState.classList.add('hidden');

    let totalBiaya = 0;

    maintenanceList.forEach(svc => {
        totalBiaya += parseInt(svc.estCost) || 0;
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-800/20 text-sm transition-colors';
        tr.innerHTML = `
            <td class="p-4 pl-4 font-bold text-orange-400 whitespace-nowrap">${svc.itemName}</td>
            <td class="p-4 text-slate-300 flex items-center gap-2"><i class="fa-solid fa-location-dot text-slate-500"></i> ${svc.location}</td>
            <td class="p-4 text-slate-400 text-xs tracking-wider">Rp ${parseInt(svc.estCost).toLocaleString('id-ID')}</td>
            <td class="p-4 font-bold text-amber-400">${svc.completionDate}</td>
            <td class="p-4 text-right">
                <button onclick="finishService('${svc.id}')" class="btn-action-3d h-8 px-4 rounded-lg bg-emerald-950/40 hover:bg-emerald-600 text-emerald-400 hover:text-white flex items-center justify-center cursor-pointer border border-emerald-900/30 transition-colors text-[10px] font-bold uppercase tracking-wider shadow-sm ml-auto">
                    <i class="fa-solid fa-check mr-1.5"></i> Selesai
                </button>
            </td>
        `;
        servicesTableBody.appendChild(tr);
    });

    if (maintenanceList.length > 0) {
        const trTotal = document.createElement('tr');
        trTotal.className = 'bg-slate-900/80 text-sm border-t-2 border-slate-700/50';
        trTotal.innerHTML = `
            <td class="p-4 pl-4 font-black text-white whitespace-nowrap uppercase tracking-wider" colspan="2">TOTAL (${maintenanceList.length} ITEM)</td>
            <td class="p-4 font-black text-emerald-400 text-xs tracking-wider" colspan="3">Rp ${totalBiaya.toLocaleString('id-ID')}</td>
        `;
        servicesTableBody.appendChild(trTotal);
    }
}

if (maintenanceForm) {
    maintenanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const itemId = document.getElementById('svc-item').value;
        const location = document.getElementById('svc-location').value;
        const cost = document.getElementById('svc-cost').value;
        const dateStr = document.getElementById('svc-date').value;

        if (!itemId) {
            showToast('Pilih barang terlebih dahulu!', 'warning');
            return;
        }

        const invItem = inventory.find(i => i.id === itemId);
        if (!invItem) return;

        // Kurangi stok barang 1 unit
        invItem.qty -= 1;
        await saveToStore('inventory', invItem);
        addToActivityLog('MAINTENANCE_OUT', invItem.name, `Dikirim ke servis di ${location} (Stok dikurangi 1)`);

        const newService = {
            id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
            itemId: invItem.id,
            itemName: invItem.name,
            location: location,
            estCost: parseInt(cost),
            completionDate: dateStr,
            createdAt: Date.now()
        };

        maintenanceList.push(newService);
        await saveToStore('services', newService);

        if (window.sendTelegramNotification) {
            window.sendTelegramNotification(`🔧 *INFO MAINTENANCE*\nBarang: *${invItem.name}*\nDikirim ke: *${location}*\nEstimasi Selesai: *${dateStr}*\nBiaya Est: *Rp ${parseInt(cost).toLocaleString('id-ID')}*`);
        }

        renderServicesTable();
        updateDashboard();
        renderSvcItemDropdown(); // Update opsi dropdown karena stok berkurang

        maintenanceForm.reset();
        showToast(`Barang "${invItem.name}" berhasil masuk daftar servis!`, 'success', 3000);
    });
}

window.finishService = async function (id) {
    const svcIndex = maintenanceList.findIndex(s => s.id === id);
    if (svcIndex === -1) return;

    const svc = maintenanceList[svcIndex];

    // Kembalikan stok 1 unit
    const invItem = inventory.find(i => i.id === svc.itemId);
    if (invItem) {
        invItem.qty += 1;
        await saveToStore('inventory', invItem);
        addToActivityLog('MAINTENANCE_IN', invItem.name, `Servis selesai dari ${svc.location} (Stok ditambah 1)`);
    } else {
        addToActivityLog('MAINTENANCE_IN', svc.itemName, `Servis selesai dari ${svc.location}`);
    }

    maintenanceList.splice(svcIndex, 1);
    await deleteFromStore('services', id);

    renderServicesTable();
    updateDashboard();
    renderSvcItemDropdown();
    showToast(`Servis "${svc.itemName}" telah selesai! Stok dikembalikan.`, 'success', 3000);
}

// Export Functionality for Services
window.exportServicesCSV = function () {
    if (maintenanceList.length === 0) {
        showToast('Tidak ada data servis untuk diekspor.', 'warning');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "BARANG,LOKASI,BIAYA EST.,TGL SELESAI\n";

    maintenanceList.forEach(svc => {
        const row = `"${svc.itemName}","${svc.location}","Rp ${parseInt(svc.estCost).toLocaleString('id-ID')}","${svc.completionDate}"`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ZDI_Servis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV Servis berhasil diunduh.', 'success');
}

window.exportServicesPDF = function () {
    if (maintenanceList.length === 0) {
        showToast('Tidak ada data servis untuk diekspor.', 'warning');
        return;
    }

    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        showToast('Library PDF belum dimuat, harap tunggu.', 'warning');
        return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Daftar Barang Dalam Servis - ZDI", 14, 20);

    const tableColumn = ["BARANG", "LOKASI", "BIAYA EST.", "TGL SELESAI"];
    const tableRows = [];

    maintenanceList.forEach(svc => {
        tableRows.push([
            svc.itemName,
            svc.location,
            `Rp ${parseInt(svc.estCost).toLocaleString('id-ID')}`,
            svc.completionDate
        ]);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] } // orange-500
    });

    doc.save(`ZDI_Servis_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('File PDF Servis berhasil diunduh.', 'success');
}

// Database-driven App Initialization Function
async function initializeApp() {
    try {
        await initDB();

        // 1. Load users
        userList = await getAllFromStore('users');
        if (userList.length === 0) {
            // Seed default user
            const defaultUser = { username: 'admin', password: 'admin123' };
            await saveToStore('users', defaultUser);
            userList.push(defaultUser);
        }

        // 2. Load inventory
        inventory = await getAllFromStore('inventory');
        // Let's migrate from localStorage if present
        const legacyInventory = JSON.parse(localStorage.getItem('arf_3d_stock_data'));
        if (inventory.length === 0 && legacyInventory && legacyInventory.length > 0) {
            for (let item of legacyInventory) {
                if (!item.id) {
                    item.id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
                }
                if (!item.category) {
                    item.category = 'PC';
                } else if (item.category === 'PC/Laptop') {
                    item.category = 'PC';
                }
                await saveToStore('inventory', item);
                inventory.push(item);
            }
            localStorage.removeItem('arf_3d_stock_data');
        } else {
            // Assign IDs to any existing items that don't have one (for safety)
            for (let item of inventory) {
                if (!item.id) {
                    item.id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
                    await saveToStore('inventory', item);
                }
            }
        }

        // 3. Load activity logs
        activityLog = await getAllFromStore('activity_log');
        // Sort by timestamp desc or sort by createdAt desc if available
        activityLog.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        const legacyLogs = JSON.parse(localStorage.getItem('arf_activity_log'));
        if (activityLog.length === 0 && legacyLogs && legacyLogs.length > 0) {
            for (let log of legacyLogs) {
                if (!log.id) {
                    log.id = Date.now() + Math.random();
                }
                await saveToStore('activity_log', log);
                activityLog.push(log);
            }
            activityLog.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            localStorage.removeItem('arf_activity_log');
        }

        // Load maintenance/services
        maintenanceList = await getAllFromStore('services');

        // Load borrowings
        borrowingsList = await getAllFromStore('borrowings');
        renderBorrowItemDropdown();
        renderBorrowingsTable();

        // MIGRATION SCRIPT FOR CLEAN BARCODE IDs
        for (let i = 0; i < inventory.length; i++) {
            let item = inventory[i];
            // Old format was e.g. "1782354436654-h62ba8sbp" (> 20 chars). New format is like "PC-240625-1234" (~14 chars)
            if (item.id && item.id.length > 18) {
                let oldId = item.id;
                let newId = generateBarcodeId(item.category);

                item.id = newId;

                for (let svc of maintenanceList) {
                    if (svc.itemId === oldId) {
                        svc.itemId = newId;
                        await saveToStore('services', svc);
                    }
                }

                await deleteFromStore('inventory', oldId);
                await saveToStore('inventory', item);
            }
        }

        // 4. (Legacy) Auth codes dimatikan. Bisa dibiarkan jika masih ada di db.json.

        // Cek Auth first time after data is loaded
        checkAuth();

    } catch (error) {
        console.error('Initialization error:', error);
        // Fallback to local variables so the app still functions
        userList = [{ username: 'admin', password: 'admin123' }];
        checkAuth();
    }
}

const categoryInputDropdown = document.getElementById('item-category');
const printerExtraFields = document.getElementById('printer-extra-fields');

if (categoryInputDropdown && printerExtraFields) {
    categoryInputDropdown.addEventListener('change', (e) => {
        if (e.target.value === 'Printer') {
            printerExtraFields.classList.remove('hidden');
        } else {
            printerExtraFields.classList.add('hidden');
        }
    });
}

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('item-name');
        const categoryInput = document.getElementById('item-category');
        const qtyInput = document.getElementById('item-qty');
        const conditionInput = document.getElementById('item-condition');

        const newItem = {
            id: generateBarcodeId(categoryInput.value),
            name: nameInput.value.trim(),
            category: categoryInput.value,
            qty: Math.max(0, parseInt(qtyInput.value)),
            condition: conditionInput ? conditionInput.value : 'Normal'
        };

        if (categoryInput.value === 'Printer') {
            const vendorInput = document.getElementById('item-vendor');
            const ipInput = document.getElementById('item-ip');
            const deptInput = document.getElementById('item-department');
            if (vendorInput) newItem.vendor = vendorInput.value.trim();
            if (ipInput) newItem.ip = ipInput.value.trim();
            if (deptInput) newItem.department = deptInput.value.trim();
        }

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
            const oldQty = inventory[existingIndex].qty;
            inventory[existingIndex].qty += newItem.qty;
            const newQty = inventory[existingIndex].qty;
            
            // Update printer specific fields if they were provided and category is Printer
            if (newItem.category === 'Printer') {
                if (newItem.vendor) inventory[existingIndex].vendor = newItem.vendor;
                if (newItem.ip) inventory[existingIndex].ip = newItem.ip;
                if (newItem.department) inventory[existingIndex].department = newItem.department;
            }

            saveToStore('inventory', inventory[existingIndex]).catch(console.error);
            addToActivityLog('EDIT_QUANTITY', inventory[existingIndex].name, `Stok ditambah sebanyak ${newItem.qty} unit via Form (${oldQty} → ${newQty})`);
            showToast(`Stok "${newItem.name}" ditambah sebanyak ${newItem.qty} unit ✓`, 'info', 3000);
        } else {
            inventory.push(newItem);

            saveToStore('inventory', newItem).catch(console.error);
            addToActivityLog('ADD_ITEM', newItem.name, `Barang baru udah masuk dengan stok awal ${newItem.qty} unit`);
            showToast(`Item "${newItem.name}" sukses ditambahin bro ke stok 🎉`, 'success', 3000);
        }

        nameInput.value = '';
        categoryInput.selectedIndex = 0;
        qtyInput.value = '';
        if (conditionInput) conditionInput.selectedIndex = 0;
        
        if (printerExtraFields) {
            printerExtraFields.classList.add('hidden');
            const vendorInput = document.getElementById('item-vendor');
            const ipInput = document.getElementById('item-ip');
            const deptInput = document.getElementById('item-department');
            if (vendorInput) vendorInput.value = '';
            if (ipInput) ipInput.value = '';
            if (deptInput) deptInput.value = '';
        }

        updateDashboard();
        renderSvcItemDropdown();
        if (typeof renderBorrowItemDropdown === 'function') renderBorrowItemDropdown();
    });
}

