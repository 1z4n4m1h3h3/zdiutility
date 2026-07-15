// ============================================================
// VENDOR MANAGEMENT SYSTEM
// ============================================================

let vendorsList = [];

// Inject Modal HTML for Vendor
const vendorModalHTML = `
<div id="modal-vendor" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm hidden opacity-0 transition-opacity duration-300">
    <div class="glass-3d w-full max-w-md p-6 rounded-3xl text-left space-y-6 scale-95 transition-transform duration-300" id="modal-vendor-content">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-cyan-400 bg-cyan-500/10 border border-cyan-500/30">
                <i class="fa-solid fa-handshake-angle"></i>
            </div>
            <div>
                <h3 class="text-base font-bold text-white" id="vendor-modal-title">Tambah Vendor</h3>
                <p class="text-slate-400 text-[10px] uppercase tracking-wider">Form Data Vendor</p>
            </div>
        </div>

        <form id="vendor-form" class="space-y-4">
            <input type="hidden" id="vendor-id">
            <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Nama Vendor</label>
                <input type="text" id="vendor-name" required placeholder="Contoh: PT. Sumber Makmur" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all">
            </div>
            <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Kontak (HP/Telp)</label>
                <input type="text" id="vendor-contact" placeholder="Contoh: 08123456789" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all">
            </div>
            <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Alamat / Keterangan</label>
                <input type="text" id="vendor-address" placeholder="Contoh: Jakarta" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all">
            </div>

            <div class="flex gap-3 pt-2">
                <button type="button" onclick="closeVendorModal()" class="btn-action-3d flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border border-slate-700/60">
                    Batal
                </button>
                <button type="submit" class="btn-3d flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-cyan-500/20">
                    Simpan
                </button>
            </div>
        </form>
    </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', vendorModalHTML);

function openVendorModal(id = null) {
    const modal = document.getElementById('modal-vendor');
    const title = document.getElementById('vendor-modal-title');
    
    if (id) {
        title.textContent = 'Edit Vendor';
        const vendor = vendorsList.find(v => v.id === id);
        if (vendor) {
            document.getElementById('vendor-id').value = vendor.id;
            document.getElementById('vendor-name').value = vendor.name;
            document.getElementById('vendor-contact').value = vendor.contact || '';
            document.getElementById('vendor-address').value = vendor.address || '';
        }
    } else {
        title.textContent = 'Tambah Vendor';
        document.getElementById('vendor-form').reset();
        document.getElementById('vendor-id').value = '';
    }
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('modal-vendor-content').classList.remove('scale-95');
    }, 10);
}

function closeVendorModal() {
    const modal = document.getElementById('modal-vendor');
    modal.classList.add('opacity-0');
    document.getElementById('modal-vendor-content').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

document.getElementById('vendor-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('vendor-id').value;
    const item = {
        id: id || Date.now().toString(),
        name: document.getElementById('vendor-name').value,
        contact: document.getElementById('vendor-contact').value,
        address: document.getElementById('vendor-address').value,
        createdAt: Date.now()
    };
    
    await saveToStore('vendors', item);
    closeVendorModal();
    showToast('Vendor berhasil disimpan!', 'success', 'fa-check-circle');
    await refreshData(false);
});

async function renderVendorList() {
    const body = document.getElementById('vendor-list-body');
    const emptyState = document.getElementById('vendor-empty-state');
    
    if (!body || !emptyState) return;

    body.innerHTML = '';
    if (vendorsList.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');
    
    vendorsList.sort((a, b) => b.createdAt - a.createdAt).forEach(vendor => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-900/50 transition-colors group';
        row.innerHTML = `
            <td class="p-3 md:p-5 pl-4 md:pl-6">
                <p class="font-bold text-white">${vendor.name}</p>
            </td>
            <td class="p-3 md:p-5 text-slate-300">
                ${vendor.contact || '-'}
            </td>
            <td class="p-3 md:p-5 text-slate-300">
                ${vendor.address || '-'}
            </td>
            <td class="p-3 md:p-5 pr-4 md:pr-6 text-right">
                <div class="flex justify-end gap-2">
                    <button onclick="openVendorModal('${vendor.id}')" class="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-700 transition-colors flex items-center justify-center">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="deleteVendor('${vendor.id}')" class="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors flex items-center justify-center">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        body.appendChild(row);
    });
}

function deleteVendor(id) {
    showCustomConfirm(
        'Hapus Vendor',
        'Yakin mau hapus vendor ini? Data nggak bisa dikembalikan.',
        'fa-triangle-exclamation',
        async () => {
            await deleteFromStore('vendors', id);
            showToast('Vendor dihapus', 'error', 'fa-trash');
            await refreshData(false);
        }
    );
}

function updateVendorDropdown() {
    const selects = [document.getElementById('item-vendor'), document.getElementById('edit-item-vendor')];
    selects.forEach(select => {
        if (!select) return;
        if(select.tagName === 'SELECT') {
            const currentVal = select.value;
            select.innerHTML = '<option value="" disabled selected class="bg-slate-950 text-slate-500">Pilih Vendor (Opsional)</option>';
            vendorsList.forEach(v => {
                select.innerHTML += `<option value="${v.name}" class="bg-slate-950 text-white">${v.name}</option>`;
            });
            if(currentVal) select.value = currentVal;
        }
    });
}

const originalRefreshDataVendor = window.refreshData;
window.refreshData = async function(showLoading = true) {
    if (originalRefreshDataVendor) {
        await originalRefreshDataVendor(showLoading);
    }
    vendorsList = await getAllFromStore('vendors');
    renderVendorList();
    updateVendorDropdown();
};
