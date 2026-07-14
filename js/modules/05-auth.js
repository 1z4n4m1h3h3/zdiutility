// ============================================================
// FITUR AUTHENTICATION (LOGIN, REGISTRASI & EDIT PASSWORD)
// ============================================================
const loginPage = document.getElementById('login-page');
const dashboardPage = document.getElementById('dashboard-page');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

// --- PREVENT LOGIN PAGE FLASH ---
if (sessionStorage.getItem('arf_session_active') === 'true') {
    if (loginPage) loginPage.classList.add('hidden');
    if (dashboardPage) {
        dashboardPage.classList.remove('hidden');
        dashboardPage.classList.add('flex');
    }
    document.body.classList.remove('justify-center');
}

const registerForm = document.getElementById('register-form');
const registerError = document.getElementById('register-error');

const changePasswordModal = document.getElementById('change-password-modal');
const passwordModalContent = document.getElementById('password-modal-content');
const changePasswordForm = document.getElementById('change-password-form');
const changePasswordError = document.getElementById('change-password-error');

// State untuk Two-Step Verification (OTP)
let pendingUser = null;
let isOtpStep = false;

// Helper dihapus karena sudah verifikasi PIN lokal

window.cancelOtpStep = function () {
    pendingUser = null;
    isOtpStep = false;

    const otpSection = document.getElementById('login-otp-section');
    const otpActions = document.getElementById('otp-actions');
    const credsSection = document.getElementById('login-credentials-section');
    const loginSubmitBtn = document.getElementById('btn-login-submit');
    const authCodeInp = document.getElementById('auth-code');
    const otpError = document.getElementById('otp-error');
    const loginErrorEl = document.getElementById('login-error');

    if (otpSection) otpSection.classList.add('hidden');
    if (otpActions) otpActions.classList.add('hidden');
    if (credsSection) credsSection.classList.remove('hidden');
    if (loginSubmitBtn) loginSubmitBtn.classList.remove('hidden');

    if (authCodeInp) {
        authCodeInp.value = '';
        authCodeInp.required = false;
    }
    if (otpError) otpError.classList.add('hidden');
    if (loginErrorEl) loginErrorEl.classList.add('hidden');

    const usernameInp = document.getElementById('username');
    const passwordInp = document.getElementById('password');
    if (usernameInp) usernameInp.required = true;
    if (passwordInp) passwordInp.required = true;
}

function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('arf_session_active');
    if (isLoggedIn === 'true') {
        loginPage.classList.add('hidden');
        dashboardPage.classList.remove('hidden');
        dashboardPage.classList.add('flex');
        document.body.classList.remove('justify-center');

        // Tampilkan username yang sedang login di dashboard
        const activeUser = sessionStorage.getItem('arf_active_user') || 'Admin';
        const displayEl = document.getElementById('active-user-display');
        if (displayEl) {
            displayEl.innerHTML = `
                ${activeUser}
                <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
            `;
        }

        const btnSettings = document.getElementById('btn-settings');
        if (btnSettings) {
            if (activeUser.toLowerCase() === 'admin') {
                btnSettings.classList.remove('hidden');
                btnSettings.classList.add('flex');
            } else {
                btnSettings.classList.add('hidden');
                btnSettings.classList.remove('flex');
            }
        }

        const mobileDisplayEl = document.getElementById('mobile-active-user-display');
        if (mobileDisplayEl) {
            mobileDisplayEl.innerHTML = `
                ${activeUser}
                <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
            `;
        }

        // Atur visibilitas panel manajemen user admin
        const adminPanel = document.getElementById('admin-auth-panel');
        if (adminPanel) {
            if (activeUser.toLowerCase() === 'admin') {
                adminPanel.classList.remove('hidden');
                adminPanel.classList.add('block', 'lg:block');
                renderUsersList();
                const btnClearLogs = document.getElementById('btn-clear-logs');
                if (btnClearLogs) btnClearLogs.classList.remove('hidden');
            } else {
                adminPanel.classList.add('hidden');
                adminPanel.classList.remove('block', 'lg:block');
                const btnClearLogs = document.getElementById('btn-clear-logs');
                if (btnClearLogs) btnClearLogs.classList.add('hidden');
            }
        }

        if (!stockChartInstance) {
            initChart();
        }
        updateDashboard();
        renderServicesTable();
        renderSvcItemDropdown();
        if (typeof renderBorrowItemDropdown === 'function') renderBorrowItemDropdown();
        if (typeof renderBorrowingsTable === 'function') renderBorrowingsTable();

        if (window.innerWidth < 1024) {
            // Default to 'monitor' tab on mobile load
            setTimeout(() => {
                if (typeof switchMobileTab === 'function') {
                    switchMobileTab('monitor');
                }
            }, 50);
        }
    } else {
        loginPage.classList.remove('hidden');
        dashboardPage.classList.add('hidden');
        dashboardPage.classList.remove('flex');
        document.body.classList.add('justify-center');
        cancelOtpStep(); // Bersihkan form dan state OTP saat logout / ke halaman login
    }
}

// Handler Switch Tab Antara Masuk & Daftar
window.switchAuthTab = function (mode) {
    loginError.classList.add('hidden');
    registerError.classList.add('hidden');
    cancelOtpStep(); // Pastikan state OTP dibersihkan saat pindah tab

    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    if (mode === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        tabLogin.className = "flex-1 pb-3 text-xs font-bold border-b-2 border-cyan-500 text-cyan-400 focus:outline-none transition-all cursor-pointer";
        tabRegister.className = "flex-1 pb-3 text-xs font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-300 focus:outline-none transition-all cursor-pointer";
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        tabLogin.className = "flex-1 pb-3 text-xs font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-300 focus:outline-none transition-all cursor-pointer";
        tabRegister.className = "flex-1 pb-3 text-xs font-bold border-b-2 border-cyan-500 text-cyan-400 focus:outline-none transition-all cursor-pointer";
    }
}

// Handler Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const loginErrorEl = document.getElementById('login-error');
    const otpErrorEl = document.getElementById('otp-error');

    if (loginErrorEl) loginErrorEl.classList.add('hidden');
    if (otpErrorEl) otpErrorEl.classList.add('hidden');

    if (!isOtpStep) {
        const usernameInp = document.getElementById('username');
        const passwordInp = document.getElementById('password');
        const userInp = usernameInp ? usernameInp.value.trim() : '';
        const passInp = passwordInp ? passwordInp.value : '';

        // Ambil data terbaru dari server untuk sinkronisasi instan
        let foundUser = null;
        let requirePin = false;
        let authRes = null;
        try {
            const res = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ username: userInp, password: passInp })
            });
            authRes = await res.json();
            if (authRes && authRes.success) {
                foundUser = authRes.user;
                requirePin = authRes.requirePin;
            }
        } catch (e) {
            console.error('Login error:', e);
            if (loginErrorEl) {
                loginErrorEl.innerText = 'Koneksi ke server gagal! Pastikan server jalan di port 3000.';
                loginErrorEl.classList.remove('hidden');
            }
            showToast('Koneksi ke server gagal!', 'error', 3000);
            return;
        }

        if (foundUser) {
            if (!requirePin) {
                // Admin langsung masuk bypass OTP
                sessionStorage.setItem('arf_session_active', 'true');
                sessionStorage.setItem('arf_active_user', foundUser.username);
                if (authRes.token) sessionStorage.setItem('arf_token', authRes.token);
                loginForm.reset();

                const deviceStr = getDeviceDetails();
                getIpAndLocation().then(geo => {
                    addToActivityLog('LOGIN', 'Sistem Akses', `User @${foundUser.username} berhasil masuk ke markas. Device: ${deviceStr}. IP: ${geo.ip}. Lokasi: ${geo.location}`);
                });

                showToast(`Login berhasil! Selamat datang, ${foundUser.username} 🎉`, 'success', 3000);
                setTimeout(() => checkAuth(), 500);
            } else {
                // User biasa: tampilkan step OTP
                pendingUser = foundUser;
                isOtpStep = true;

                document.getElementById('login-credentials-section').classList.add('hidden');
                document.getElementById('btn-login-submit').classList.add('hidden');

                document.getElementById('login-otp-section').classList.remove('hidden');
                document.getElementById('otp-actions').classList.remove('hidden');

                if (usernameInp) usernameInp.required = false;
                if (passwordInp) passwordInp.required = false;

                const authCodeInp = document.getElementById('auth-code');
                if (authCodeInp) {
                    authCodeInp.required = true;
                    authCodeInp.value = '';
                    authCodeInp.focus();
                }

                showToast('Kredensial valid! Masukkan PIN Keamanan Anda. 🔑', 'info', 4000);
            }
        } else {
            if (loginErrorEl) loginErrorEl.classList.remove('hidden');
            showToast('Username atau password salah!', 'error', 3000);
        }
    } else {
        const authCodeInp = document.getElementById('auth-code');
        const codeInp = authCodeInp ? authCodeInp.value.trim() : '';

        if (!codeInp) {
            if (otpErrorEl) otpErrorEl.classList.remove('hidden');
            return;
        }

        let isValid = false;
        let authRes = null;
        try {
            const res = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ username: pendingUser.username, pin: codeInp })
            });
            authRes = await res.json();
            if (authRes && authRes.success) {
                isValid = true;
                pendingUser = authRes.user;
            }
        } catch (e) {
            console.error('Login PIN error:', e);
        }

        if (isValid && pendingUser) {
            // Selesaikan login
            sessionStorage.setItem('arf_session_active', 'true');
            sessionStorage.setItem('arf_active_user', pendingUser.username);
            if (authRes.token) sessionStorage.setItem('arf_token', authRes.token);

            const activeUser = pendingUser.username;
            const deviceStr = getDeviceDetails();
            getIpAndLocation().then(geo => {
                addToActivityLog('LOGIN', 'Sistem Akses', `User @${activeUser} berhasil masuk ke markas. Device: ${deviceStr}. IP: ${geo.ip}. Lokasi: ${geo.location}`);
            });

            cancelOtpStep();
            loginForm.reset();
            showToast(`Login berhasil! Selamat datang, ${activeUser} 🎉`, 'success', 3000);
            setTimeout(() => checkAuth(), 500);
        } else {
            if (otpErrorEl) otpErrorEl.classList.remove('hidden');
            showToast('PIN Keamanan tidak valid!', 'error', 3000);
            if (authCodeInp) {
                authCodeInp.value = '';
                authCodeInp.focus();
            }
        }
    }
});

// Handler Registrasi
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const regUser = document.getElementById('reg-username').value.trim();
    const regPass = document.getElementById('reg-password').value;
    const regConfirm = document.getElementById('reg-confirm-password').value;
    const regPin = document.getElementById('reg-pin').value;

    if (regPass !== regConfirm) {
        registerError.innerText = 'Konfirmasi password tidak cocok!';
        registerError.classList.remove('hidden');
        showToast('Konfirmasi password tidak cocok!', 'error', 3000);
        return;
    }

    if (regPass.length < 4) {
        registerError.innerText = 'Password minimal 4 karakter!';
        registerError.classList.remove('hidden');
        showToast('Password minimal 4 karakter!', 'error', 3000);
        return;
    }

    

    if (regPin.length !== 6 || !/^\d{6}$/.test(regPin)) {
        registerError.innerText = 'PIN harus terdiri dari 6 angka!';
        registerError.classList.remove('hidden');
        showToast('PIN harus terdiri dari 6 angka!', 'error', 3000);
        return;
    }

    fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ username: regUser, password: regPass, pin: regPin })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast(`Akun "${regUser}" berhasil dibuat! Silakan masuk 🎉`, 'success', 3000);
            registerForm.reset();
            registerError.classList.add('hidden');
            switchAuthTab('login');
        } else {
            registerError.innerText = data.error || 'Gagal mendaftar!';
            registerError.classList.remove('hidden');
            showToast(data.error || 'Gagal mendaftar!', 'error', 3000);
        }
    })
    .catch(err => {
        console.error(err);
        showToast('Terjadi kesalahan!', 'error', 3000);
    });
});

// Sistem Ganti Password Kustom
window.openChangePasswordModal = function () {
    changePasswordForm.reset();
    changePasswordError.classList.add('hidden');
    changePasswordModal.classList.remove('hidden');
    setTimeout(() => {
        changePasswordModal.classList.remove('opacity-0');
        passwordModalContent.classList.remove('scale-95');
    }, 10);
}

window.closeChangePasswordModal = function () {
    changePasswordModal.classList.add('opacity-0');
    passwordModalContent.classList.add('scale-95');
    setTimeout(() => {
        changePasswordModal.classList.add('hidden');
    }, 300);
}

changePasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const oldPass = document.getElementById('old-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirmNewPass = document.getElementById('confirm-new-password').value;

    const activeUser = sessionStorage.getItem('arf_active_user') || 'admin';
    
    if (newPass !== confirmNewPass) {
        changePasswordError.innerText = 'Konfirmasi password baru tidak cocok!';
        changePasswordError.classList.remove('hidden');
        showToast('Konfirmasi password baru tidak cocok!', 'error', 3000);
        return;
    }

    if (newPass.length < 4) {
        changePasswordError.innerText = 'Password baru minimal 4 karakter!';
        changePasswordError.classList.remove('hidden');
        showToast('Password baru minimal 4 karakter!', 'error', 3000);
        return;
    }

    fetch(`${API_URL}/api/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ username: activeUser, oldPassword: oldPass, newPassword: newPass })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Password berhasil diubah! ✓', 'success', 3000);
            closeChangePasswordModal();
        } else {
            changePasswordError.innerText = data.error || 'Gagal mengubah password!';
            changePasswordError.classList.remove('hidden');
            showToast(data.error || 'Gagal mengubah password!', 'error', 3000);
        }
    })
    .catch(err => {
        console.error(err);
        showToast('Terjadi kesalahan!', 'error', 3000);
    });
});

// Sistem Logout Kustom
window.handleLogout = function () {
    showCustomConfirm({
        title: 'Konfirmasi Keluar',
        message: 'Apakah anda yakin ingin cabut dari sistem ZDI STOCK UTILITY?',
        type: 'warning',
        onConfirm: () => {
            const activeUser = sessionStorage.getItem('arf_active_user') || 'Unknown';
            const deviceStr = getDeviceDetails();
            getIpAndLocation().then(geo => {
                addToActivityLog('LOGOUT', 'Sistem Akses', `User @${activeUser} cabut dari sistem. Device: ${deviceStr}. IP: ${geo.ip}. Lokasi: ${geo.location}`);
            });

            sessionStorage.removeItem('arf_session_active');
            sessionStorage.removeItem('arf_active_user');
            sessionStorage.removeItem('arf_token');
            showToast('Anda telah logout. Sampai jumpa!', 'info', 2500);
            setTimeout(() => checkAuth(), 300);
        }
    });
}
