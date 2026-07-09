// ============================================================
// BARCODE VIEWER & SCANNER SYSTEM
// ============================================================
window.generateBarcodeId = function (category) {
    let prefix = 'ITEM';
    if (category === 'PC') prefix = 'PC';
    else if (category === 'Laptop') prefix = 'LPTP';
    else if (category === 'Monitor') prefix = 'MNTR';
    else if (category === 'Printer') prefix = 'PRNT';
    else if (category === 'CCTV') prefix = 'CCTV';
    else if (category === 'Doorlock') prefix = 'DRLK';
    else if (category === 'Consumable') prefix = 'CNSM';

    // Random 4 digit 1000-9999
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-ZDI-${randomPart}`;
}

window.viewBarcode = function (id) {
    const item = inventory.find(i => i.id == id);
    if (!item) return;

    const modal = document.getElementById('barcode-modal');
    const modalContent = document.getElementById('barcode-modal-content');
    const itemNameEl = document.getElementById('barcode-item-name');

    if (itemNameEl) itemNameEl.textContent = item.name;

    // Generate Barcode
    if (typeof JsBarcode !== 'undefined') {
        JsBarcode("#barcode-svg", item.id, {
            format: "CODE128",
            displayValue: true,
            fontSize: 14,
            height: 60,
            background: "#ffffff",
            lineColor: "#000000",
            margin: 0
        });
    } else {
        showToast('Library JsBarcode belum termuat.', 'warning');
    }

    modal.classList.remove('hidden');
    // Trigger animation
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
    }, 10);
}

window.closeBarcodeModal = function () {
    const modal = document.getElementById('barcode-modal');
    const modalContent = document.getElementById('barcode-modal-content');

    modal.classList.add('opacity-0');
    modalContent.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

window.printBarcode = function () {
    const barcodeSvg = document.getElementById('barcode-svg').outerHTML;
    const itemName = document.getElementById('barcode-item-name').textContent;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Print Barcode - ${itemName}</title>
            <style>
                body { font-family: sans-serif; text-align: center; margin-top: 50px; }
                .label { border: 2px dashed #333; display: inline-block; padding: 20px; border-radius: 10px; }
                h3 { margin-top: 0; font-size: 16px; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class="label">
                <h3>${itemName}</h3>
                ${barcodeSvg}
            </div>
            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

let html5QrcodeScanner = null;
window.scannerMode = 'IN';

window.setScannerMode = function (mode) {
    window.scannerMode = mode;
    const bg = document.getElementById('scanner-mode-bg');
    const btnIn = document.getElementById('btn-scan-in');
    const btnOut = document.getElementById('btn-scan-out');

    if (mode === 'IN') {
        bg.style.transform = 'translateX(0)';
        bg.className = 'absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-emerald-500 rounded-lg transition-all duration-300 shadow-md';
        btnIn.classList.replace('text-indigo-200', 'text-white');
        btnOut.classList.replace('text-white', 'text-indigo-200');
    } else {
        bg.style.transform = 'translateX(100%)';
        bg.className = 'absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-rose-500 rounded-lg transition-all duration-300 shadow-md';
        btnOut.classList.replace('text-indigo-200', 'text-white');
        btnIn.classList.replace('text-white', 'text-indigo-200');
    }
}

window.openScanner = function (targetInputId) {
    const modal = document.getElementById('scanner-modal');
    const modalContent = document.getElementById('scanner-modal-content');

    // Reset to IN mode by default
    setScannerMode('IN');

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
    }, 10);

    if (typeof Html5QrcodeScanner === 'undefined') {
        showToast('Library Scanner belum termuat!', 'warning');
        return;
    }

    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    }

    html5QrcodeScanner.render((decodedText) => {
        closeScannerModal();
        processScanResult(decodedText, targetInputId);
    }, (error) => {
        // Ignore scan failures
    });
}

function processScanResult(decodedText, targetInputId) {
    const scannedItem = inventory.find(i => i.id === decodedText);
    if (scannedItem) {
        if (window.scannerMode === 'IN') {
            changeQty(scannedItem.id, 1);
            showToast(`Sukses! Stok ${scannedItem.name} +1`, 'success', 4000);
        } else {
            if (scannedItem.qty > 0) {
                changeQty(scannedItem.id, -1);
                showToast(`Sukses! Stok ${scannedItem.name} diambil 1`, 'success', 4000);
            } else {
                showToast(`Gagal! Stok ${scannedItem.name} kosong!`, 'error', 4000);
            }
        }
    } else {
        const inputEl = document.getElementById(targetInputId);
        if (inputEl) {
            inputEl.value = decodedText;
            showToast('Barcode baru. Silakan isi form dan daftarkan barang.', 'info', 4000);
        } else {
            showToast('Barcode tidak terdaftar dalam sistem.', 'warning', 4000);
        }
    }
}

window.handleFileScan = function (event) {
    if (event.target.files.length == 0) return;
    const file = event.target.files[0];

    if (typeof Html5Qrcode === 'undefined') {
        showToast('Library Scanner belum termuat!', 'warning');
        return;
    }

    const html5QrCode = new Html5Qrcode("reader");
    showToast('Sedang membaca foto barcode...', 'info');

    html5QrCode.scanFile(file, true)
        .then(decodedText => {
            closeScannerModal();
            processScanResult(decodedText, 'new-item-id');
            if(html5QrcodeScanner) html5QrcodeScanner.clear().catch(e=>console.log(e));
        })
        .catch(err => {
            showToast('Gagal membaca barcode dari gambar/foto.', 'error', 4000);
        });
    
    event.target.value = ''; // Reset input
}

window.closeScannerModal = function () {
    const modal = document.getElementById('scanner-modal');
    const modalContent = document.getElementById('scanner-modal-content');

    modal.classList.add('opacity-0');
    modalContent.classList.add('scale-95');

    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(e => console.log('Scanner clear error', e));
    }

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

