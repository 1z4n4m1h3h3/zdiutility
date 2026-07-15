// ============================================================
// LOCATION MANAGEMENT SYSTEM
// ============================================================

const locationModalHTML = `
<div id="modal-location" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm hidden opacity-0 transition-opacity duration-300">
    <div class="glass-3d w-full max-w-md p-6 rounded-3xl text-left space-y-6 scale-95 transition-transform duration-300" id="modal-location-content">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-cyan-400 bg-cyan-500/10 border border-cyan-500/30">
                <i class="fa-solid fa-map-location-dot"></i>
            </div>
            <div>
                <h3 class="text-base font-bold text-white" id="location-modal-title">Tambah Lokasi</h3>
                <p class="text-slate-400 text-[10px] uppercase tracking-wider">Gudang / Rak</p>
            </div>
        </div>

        <form id="location-form" class="space-y-4">
            <input type="hidden" id="location-id">
            <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Nama Lokasi / Rak</label>
                <input type="text" id="location-name" required placeholder="Contoh: Gudang A - Rak 2" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all">
            </div>
            <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Deskripsi / Area</label>
                <input type="text" id="location-description" placeholder="Contoh: Gedung Utara" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all">
            </div>

            <div class="flex gap-3 pt-2">
                <button type="button" onclick="closeLocationModal()" class="btn-action-3d flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border border-slate-700/60">
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
document.body.insertAdjacentHTML('beforeend', locationModalHTML);

function openLocationModal(id = null) {
    const modal = document.getElementById('modal-location');
    const title = document.getElementById('location-modal-title');
    
    if (id) {
        title.textContent = 'Edit Lokasi';
        const location = locationsList.find(l => l.id === id);
        if (location) {
            document.getElementById('location-id').value = location.id;
            document.getElementById('location-name').value = location.name;
            document.getElementById('location-description').value = location.description || '';
        }
    } else {
        title.textContent = 'Tambah Lokasi';
        document.getElementById('location-form').reset();
        document.getElementById('location-id').value = '';
    }
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('modal-location-content').classList.remove('scale-95');
    }, 10);
}

function closeLocationModal() {
    const modal = document.getElementById('modal-location');
    modal.classList.add('opacity-0');
    document.getElementById('modal-location-content').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

document.getElementById('location-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('location-id').value;
    const item = {
        id: id || Date.now().toString(),
        name: document.getElementById('location-name').value,
        description: document.getElementById('location-description').value,
        createdAt: Date.now()
    };
    
    await saveToStore('locations', item);
    closeLocationModal();
    showToast('Lokasi berhasil disimpan!', 'success', 'fa-check-circle');
    await refreshData(false);
});

async function renderLocationList() {
    const body = document.getElementById('location-list-body');
    const emptyState = document.getElementById('location-empty-state');
    
    if (!body || !emptyState) return;

    body.innerHTML = '';
    if (locationsList.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');
    
    locationsList.sort((a, b) => b.createdAt - a.createdAt).forEach(location => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-900/50 transition-colors group';
        row.innerHTML = `
            <td class="p-3 md:p-5 pl-4 md:pl-6">
                <p class="font-bold text-white">${location.name}</p>
            </td>
            <td class="p-3 md:p-5 text-slate-300">
                ${location.description || '-'}
            </td>
            <td class="p-3 md:p-5 pr-4 md:pr-6 text-right">
                <div class="flex justify-end gap-2">
                    <button onclick="openLocationModal('${location.id}')" class="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-700 transition-colors flex items-center justify-center">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="deleteLocation('${location.id}')" class="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors flex items-center justify-center">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        body.appendChild(row);
    });
}

function deleteLocation(id) {
    showCustomConfirm(
        'Hapus Lokasi',
        'Yakin mau hapus lokasi ini? Data nggak bisa dikembalikan.',
        'fa-triangle-exclamation',
        async () => {
            await deleteFromStore('locations', id);
            showToast('Lokasi dihapus', 'error', 'fa-trash');
            await refreshData(false);
        }
    );
}

function updateLocationDropdown() {
    const selects = [document.getElementById('item-department'), document.getElementById('edit-item-department')];
    selects.forEach(select => {
        if (!select) return;
        if(select.tagName === 'SELECT') {
            const currentVal = select.value;
            select.innerHTML = '<option value="" disabled selected class="bg-slate-950 text-slate-500">Pilih Lokasi Gudang / Area</option>';
            locationsList.forEach(l => {
                select.innerHTML += `<option value="${l.name}" class="bg-slate-950 text-white">${l.name}</option>`;
            });
            if(currentVal) select.value = currentVal;
        }
    });
}

const originalRefreshDataLocation = window.refreshData;
window.refreshData = async function(showLoading = true) {
    if (originalRefreshDataLocation) {
        await originalRefreshDataLocation(showLoading);
    }
    locationsList = await getAllFromStore('locations');
    renderLocationList();
    updateLocationDropdown();
};
