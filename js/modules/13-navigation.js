// ============================================================
// SYSTEM MOBILE TAB NAVIGATION
// ============================================================
window.switchMobileTab = function (tabName) {
    // 1. Update active tab button style for both mobile and sidebar
    document.querySelectorAll('.mobile-nav-btn, .sidebar-nav-btn').forEach(btn => {
        btn.classList.remove('active', 'text-cyan-400');
        if (btn.classList.contains('mobile-nav-btn')) {
            btn.classList.add('text-slate-500');
        } else {
            // sidebar buttons
            btn.classList.add('text-slate-400');
            btn.classList.remove('bg-cyan-500/10', 'border-cyan-500/20', 'shadow-[0_0_15px_rgba(34,211,238,0.1)]');
            btn.classList.add('border-transparent');

            // update icon container
            const iconContainer = btn.querySelector('div');
            if (iconContainer) {
                iconContainer.classList.remove('bg-cyan-500/20', 'text-cyan-400');
                iconContainer.classList.add('bg-slate-800', 'text-slate-400');
            }
        }
    });

    const activeMobileBtn = document.getElementById(`nav-${tabName}`);
    if (activeMobileBtn) {
        activeMobileBtn.classList.add('active', 'text-cyan-400');
        activeMobileBtn.classList.remove('text-slate-500');
    }

    const activeSideBtn = document.getElementById(`side-nav-${tabName}`);
    if (activeSideBtn) {
        activeSideBtn.classList.add('active', 'text-cyan-400', 'bg-cyan-500/10', 'border-cyan-500/20', 'shadow-[0_0_15px_rgba(34,211,238,0.1)]');
        activeSideBtn.classList.remove('text-slate-400', 'border-transparent');

        const iconContainer = activeSideBtn.querySelector('div');
        if (iconContainer) {
            iconContainer.classList.add('bg-cyan-500/20', 'text-cyan-400');
            iconContainer.classList.remove('bg-slate-800', 'text-slate-400');
        }
    }

    // Update page title text
    const pageTitleEl = document.getElementById('page-title-text');
    if (pageTitleEl) {
        if (tabName === 'monitor') pageTitleEl.textContent = 'Dashboard';
        else if (tabName === 'add') pageTitleEl.textContent = 'Tambah Item Baru';
        else if (tabName === 'logs') pageTitleEl.textContent = 'Log Aktivitas';
        else if (tabName === 'maintenance') pageTitleEl.textContent = 'Maintenance & Servis';
        else if (tabName === 'borrow') pageTitleEl.textContent = 'Peminjaman Aset';
        else if (tabName === 'printer') pageTitleEl.textContent = 'Manajemen Printer';
        else if (tabName === 'report') pageTitleEl.textContent = 'Laporan Keuangan';
    }

    // Toggle Total Items topbar widget
    const topbarStats = document.getElementById('topbar-stats');
    if (topbarStats) {
        if (tabName === 'monitor') {
            topbarStats.classList.remove('hidden');
            topbarStats.classList.add('flex');
        } else {
            topbarStats.classList.remove('flex');
            topbarStats.classList.add('hidden');
        }
    }

    // 2. Define panels for each tab
    const panels = {
        monitor: ['filter-panel', 'monitor-panel'],
        add: ['add-item-panel', 'admin-auth-panel'],
        logs: ['chart-panel', 'logs-panel'],
        maintenance: ['maintenance-panel'],
        borrow: ['borrow-panel'],
        printer: ['printer-panel'],
        report: ['report-panel']
    };

    // Hide all panels, completely! (Remove lg:flex and lg:block since they override hidden on desktop)
    Object.keys(panels).forEach(key => {
        panels[key].forEach(panelId => {
            const el = document.getElementById(panelId);
            if (el) {
                el.classList.add('hidden');
                el.classList.remove('lg:flex', 'lg:block', 'flex', 'block');
            }
        });
    });

    // Show only the selected tab's panels on mobile and desktop view
    panels[tabName].forEach(panelId => {
        const el = document.getElementById(panelId);
        if (el) {
            // Respect admin-only restrictions
            if (panelId === 'admin-auth-panel') {
                const activeUser = sessionStorage.getItem('arf_active_user') || 'Admin';
                if (activeUser.toLowerCase() !== 'admin') {
                    return;
                }
            }

            el.classList.remove('hidden');
            if (panelId === 'filter-panel') {
                el.classList.add('flex', 'lg:flex');
            } else {
                el.classList.add('block', 'lg:block');
            }
        }
    });

    // Scroll smoothly back to top when switching views
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Cek Auth pertama kali setelah IndexedDB inisialisasi
initializeApp();

