// ============================================================
// PWA INSTALLATION LOGIC
// ============================================================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;

    // Show the install buttons
    const sideNavInstall = document.getElementById('side-nav-install');
    const navInstall = document.getElementById('nav-install');

    if (sideNavInstall) {
        sideNavInstall.classList.remove('hidden');
        sideNavInstall.classList.add('flex');
    }
    if (navInstall) {
        navInstall.classList.remove('hidden');
        navInstall.classList.add('flex');
    }

    console.log("'beforeinstallprompt' event was fired. Install buttons shown.");
});

window.installPWA = async function () {
    if (!deferredPrompt) {
        showToast('Aplikasi sudah di-install atau browser tidak mendukung fitur ini.', 'info', 3000);
        return;
    }

    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        // Hide the buttons after successful install prompt
        const sideNavInstall = document.getElementById('side-nav-install');
        const navInstall = document.getElementById('nav-install');
        if (sideNavInstall) { sideNavInstall.classList.add('hidden'); sideNavInstall.classList.remove('flex'); }
        if (navInstall) { navInstall.classList.add('hidden'); navInstall.classList.remove('flex'); }
        showToast('Terima kasih telah meng-install aplikasi ini!', 'success', 3000);
    } else {
        console.log('User dismissed the install prompt');
    }

    // We've used the prompt, and can't use it again, throw it away
    deferredPrompt = null;
}

