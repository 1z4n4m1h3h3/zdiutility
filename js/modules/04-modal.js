// ============================================================
// SYSTEM CUSTOM CONFIRMATION MODAL (Menggantikan confirm() bawaan)
// ============================================================
const confirmModal = document.getElementById('custom-confirm-modal');
const modalContent = document.getElementById('modal-content');
const modalIconContainer = document.getElementById('modal-icon-container');
const modalIcon = document.getElementById('modal-icon');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const btnModalCancel = document.getElementById('btn-modal-cancel');
const btnModalConfirm = document.getElementById('btn-modal-confirm');

let modalCallback = null;

function showCustomConfirm({ title, message, type, onConfirm }) {
    modalTitle.innerText = title;
    modalMessage.innerText = message;
    modalCallback = onConfirm;

    // Atur tema warna berdasarkan tipe aksi (logout / hapus)
    if (type === 'danger') {
        // Tema warna Merah/Rose untuk Hapus Item
        modalIconContainer.className = "w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-xl text-rose-400 bg-rose-500/10 border border-rose-500/30 shadow-[inset_0_0_10px_rgba(244,63,94,0.2)]";
        modalIcon.className = "fa-solid fa-trash-can";
        btnModalConfirm.className = "btn-3d flex-1 py-3 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-rose-500/20";
        btnModalConfirm.style.boxShadow = "0 4px 0px 0px rgba(225, 29, 72, 0.4), 0 8px 16px rgba(0, 0, 0, 0.3)";
    } else {
        // Tema warna Amber/Orange untuk Logout
        modalIconContainer.className = "w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-xl text-amber-400 bg-amber-500/10 border border-amber-500/30 shadow-[inset_0_0_10px_rgba(245,158,11,0.2)]";
        modalIcon.className = "fa-solid fa-power-off";
        btnModalConfirm.className = "btn-3d flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/20";
        btnModalConfirm.style.boxShadow = "0 4px 0px 0px rgba(217, 119, 6, 0.4), 0 8px 16px rgba(0, 0, 0, 0.3)";
    }

    // Tampilkan dengan animasi fade-in & scale-up
    confirmModal.classList.remove('hidden', 'modal-leave');
    confirmModal.classList.add('modal-enter');
}

function closeCustomConfirm() {
    confirmModal.classList.remove('modal-enter');
    confirmModal.classList.add('modal-leave');
    setTimeout(() => {
        if (confirmModal.classList.contains('modal-leave')) {
            confirmModal.classList.add('hidden');
        }
    }, 300);
}

// Event klik tombol di dalam modal
btnModalCancel.addEventListener('click', closeCustomConfirm);
btnModalConfirm.addEventListener('click', () => {
    if (modalCallback) modalCallback();
    closeCustomConfirm();
});
