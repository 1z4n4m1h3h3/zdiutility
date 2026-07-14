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

    // Generate QR Code
    const qrContainer = document.getElementById('qrcode-container');
    if (qrContainer) {
        qrContainer.innerHTML = '';
        if (typeof QRCode !== 'undefined') {
            new QRCode(qrContainer, {
                text: item.id,
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
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
    window.currentScannerTargetId = targetInputId; // Store globally for handleFileScan
    const modal = document.getElementById('scanner-modal');
    const modalContent = document.getElementById('scanner-modal-content');

    // Reset to IN mode by default
    setScannerMode('IN');

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
    }, 10);

    if (typeof Html5Qrcode === 'undefined') {
        showToast('Library Scanner belum termuat!', 'warning');
        return;
    }
}

function processScanResult(decodedText, targetInputId) {
    const scannedItem = inventory.find(i => i.id === decodedText);

    if (targetInputId) {
        const inputEl = document.getElementById(targetInputId);
        if (inputEl) {
            if (scannedItem) {
                inputEl.value = scannedItem.id;
            } else {
                inputEl.value = decodedText;
            }
            inputEl.dispatchEvent(new Event('input'));
            inputEl.dispatchEvent(new Event('change'));
            showToast('Barcode berhasil di-scan.', 'info', 4000);
        }
        return;
    }

    if (scannedItem) {
        if (window.scannerMode === 'IN') {
            changeQty(scannedItem.id, 1);
        } else {
            if (scannedItem.qty > 0) {
                changeQty(scannedItem.id, -1);
            } else {
                showToast(`Gagal! Stok ${scannedItem.name} kosong!`, 'error', 4000);
            }
        }
    } else {
        showToast('Barcode tidak terdaftar dalam sistem.', 'warning', 4000);
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
            const targetId = window.currentScannerTargetId || 'search-monitor';
            processScanResult(decodedText, targetId);
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

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

