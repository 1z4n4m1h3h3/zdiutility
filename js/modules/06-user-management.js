// ============================================================
// ADMIN USER & PIN MANAGEMENT SYSTEM
// ============================================================
window.renderUsersList = function () {
    const listEl = document.getElementById('admin-users-list');
    const emptyEl = document.getElementById('admin-users-empty');
    if (!listEl) return;

    listEl.innerHTML = '';

    const normalUsers = userList.filter(u => u.username.toLowerCase() !== 'admin');

    if (normalUsers.length === 0) {
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');

    normalUsers.forEach(user => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl hover:border-cyan-500/20 transition-all duration-300 gap-2';

        div.innerHTML = `
            <div class="text-left flex-1">
                <p class="text-sm font-black tracking-wide text-cyan-400">@${user.username}</p>
                <p class="text-[9px] text-slate-500 mt-0.5"><i class="fa-solid fa-key mr-1 text-[8px]"></i>PIN terdaftar</p>
            </div>
            <div class="flex items-center gap-1.5">
                <button onclick="changeUserPasswordAdmin('${user.username}')" class="btn-action-3d h-7 px-2.5 rounded-lg bg-blue-950/40 hover:bg-blue-600 text-blue-400 hover:text-white flex items-center justify-center cursor-pointer border border-blue-900/30 transition-colors" title="Ubah Password">
                    <i class="fa-solid fa-lock text-[10px]"></i>
                </button>
                <button onclick="resetUserPin('${user.username}')" class="btn-action-3d h-7 px-2.5 rounded-lg bg-amber-950/40 hover:bg-amber-600 text-amber-400 hover:text-white flex items-center justify-center cursor-pointer border border-amber-900/30 transition-colors" title="Reset PIN ke 123456">
                    <i class="fa-solid fa-rotate-left text-[10px]"></i>
                </button>
                <button onclick="deleteUserAdmin('${user.username}')" class="btn-action-3d h-7 px-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-600 text-rose-400 hover:text-white flex items-center justify-center cursor-pointer border border-rose-900/30 transition-colors" title="Hapus User">
                    <i class="fa-solid fa-trash-can text-[10px]"></i>
                </button>
            </div>
        `;
        listEl.appendChild(div);
    });
}

window.resetUserPin = async function (username) {
    showCustomConfirm({
        title: 'Reset PIN Pengguna',
        message: `Apakah anda yakin ingin mereset PIN untuk user "@${username}" menjadi "123456"?`,
        type: 'warning',
        onConfirm: async () => {
            try {
                const userIndex = userList.findIndex(u => u.username === username);
                if (userIndex !== -1) {
                    userList[userIndex].pin = '123456';
                    await saveToStore('users', userList[userIndex]);
                    showToast(`PIN untuk @${username} berhasil direset ke 123456 ✓`, 'success', 3000);
                }
            } catch (e) {
                console.error('Failed to reset PIN:', e);
                showToast('Gagal mereset PIN!', 'error', 3000);
            }
        }
    });
}

const adminChangePasswordModal = document.getElementById('admin-change-password-modal');
const adminPasswordModalContent = document.getElementById('admin-password-modal-content');
const adminChangePasswordForm = document.getElementById('admin-change-password-form');
const adminChangePasswordError = document.getElementById('admin-change-password-error');
const adminTargetUsername = document.getElementById('admin-target-username');
const adminChangePasswordSubtitle = document.getElementById('admin-change-password-subtitle');

window.openAdminChangePasswordModal = function (username) {
    if (adminChangePasswordForm) adminChangePasswordForm.reset();
    if (adminChangePasswordError) adminChangePasswordError.classList.add('hidden');
    if (adminTargetUsername) adminTargetUsername.value = username;
    if (adminChangePasswordSubtitle) adminChangePasswordSubtitle.innerText = `Masukkan password baru untuk user @${username}.`;

    if (adminChangePasswordModal) {
        adminChangePasswordModal.classList.remove('hidden');
        setTimeout(() => {
            adminChangePasswordModal.classList.remove('opacity-0');
            if (adminPasswordModalContent) adminPasswordModalContent.classList.remove('scale-95');
        }, 10);
    }
}

window.closeAdminChangePasswordModal = function () {
    if (!adminChangePasswordModal) return;
    adminChangePasswordModal.classList.add('opacity-0');
    if (adminPasswordModalContent) adminPasswordModalContent.classList.add('scale-95');
    setTimeout(() => {
        adminChangePasswordModal.classList.add('hidden');
    }, 300);
}

if (adminChangePasswordForm) {
    adminChangePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPass = document.getElementById('admin-new-password').value;
        const username = adminTargetUsername.value;

        if (newPass.length < 4) {
            adminChangePasswordError.innerText = 'Password baru minimal 4 karakter!';
            adminChangePasswordError.classList.remove('hidden');
            return;
        }

        try {
            const userIndex = userList.findIndex(u => u.username === username);
            if (userIndex !== -1) {
                userList[userIndex].password = newPass;
                await saveToStore('users', userList[userIndex]);
                showToast(`Password untuk @${username} berhasil diubah! ✓`, 'success', 3000);
                closeAdminChangePasswordModal();
            }
        } catch (e) {
            console.error('Failed to change password:', e);
            adminChangePasswordError.innerText = 'Gagal merubah password!';
            adminChangePasswordError.classList.remove('hidden');
        }
    });
}

window.changeUserPasswordAdmin = function (username) {
    openAdminChangePasswordModal(username);
}

window.deleteUserAdmin = async function (username) {
    showCustomConfirm({
        title: 'Hapus Akun Pengguna',
        message: `Apakah anda yakin ingin menghapus akun "@${username}" secara permanen?`,
        type: 'danger',
        onConfirm: async () => {
            try {
                await deleteFromStore('users', username);
                userList = userList.filter(u => u.username !== username);
                showToast(`Akun @${username} berhasil dihapus! 🗑️`, 'info', 3000);
                renderUsersList();
            } catch (e) {
                console.error('Failed to delete user:', e);
                showToast('Gagal menghapus akun!', 'error', 3000);
            }
        }
    });
}

