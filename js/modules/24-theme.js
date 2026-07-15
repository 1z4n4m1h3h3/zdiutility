// ============================================================
// UI THEMING & DARK MODE
// ============================================================

const themes = [
    { id: 'default', name: 'Cyan Default', primary: '#06b6d4', secondary: '#2563eb', bg: 'radial-gradient(circle at 50% 0%, #1e293b, #0f172a, #020617)' },
    { id: 'emerald', name: 'Emerald Green', primary: '#10b981', secondary: '#047857', bg: 'radial-gradient(circle at 50% 0%, #064e3b, #022c22, #020617)' },
    { id: 'amber', name: 'Amber Orange', primary: '#f59e0b', secondary: '#b45309', bg: 'radial-gradient(circle at 50% 0%, #451a03, #290f02, #020617)' },
    { id: 'rose', name: 'Rose Red', primary: '#f43f5e', secondary: '#be123c', bg: 'radial-gradient(circle at 50% 0%, #4c0519, #22020a, #020617)' },
    { id: 'purple', name: 'Royal Purple', primary: '#8b5cf6', secondary: '#5b21b6', bg: 'radial-gradient(circle at 50% 0%, #2e1065, #170532, #020617)' }
];

let currentTheme = localStorage.getItem('zdi_theme') || 'default';

const themeModalHTML = `
<div id="modal-theme" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm hidden opacity-0 transition-opacity duration-300">
    <div class="glass-3d w-full max-w-sm p-6 rounded-3xl text-left space-y-6 scale-95 transition-transform duration-300" id="modal-theme-content">
        <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-amber-400 bg-amber-500/10 border border-amber-500/30">
                <i class="fa-solid fa-palette"></i>
            </div>
            <div>
                <h3 class="text-base font-bold text-white">Ganti Tema</h3>
                <p class="text-slate-400 text-[10px] uppercase tracking-wider">Pilih Warna Aksen</p>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-3" id="theme-options-container">
            <!-- Injected dynamically -->
        </div>

        <div class="pt-4 flex gap-3">
            <button onclick="closeThemeModal()" class="btn-action-3d w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border border-slate-700/60">
                Tutup
            </button>
        </div>
    </div>
</div>
<style id="dynamic-theme-style"></style>
`;

document.body.insertAdjacentHTML('beforeend', themeModalHTML);

function renderThemeOptions() {
    const container = document.getElementById('theme-options-container');
    container.innerHTML = '';
    themes.forEach(theme => {
        const isActive = currentTheme === theme.id;
        const div = document.createElement('div');
        div.className = `p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${isActive ? 'border-amber-400 bg-slate-800/80 shadow-[0_0_15px_rgba(245,158,11,0.2)] scale-105' : 'border-slate-700/50 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-600'}`;
        div.onclick = () => applyTheme(theme.id);
        
        div.innerHTML = `
            <div class="w-8 h-8 rounded-full shadow-inner border border-slate-700 flex items-center justify-center" style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary})">
                ${isActive ? '<i class="fa-solid fa-check text-white text-xs text-shadow"></i>' : ''}
            </div>
            <span class="text-xs font-bold text-slate-300">${theme.name}</span>
        `;
        container.appendChild(div);
    });
}

function applyTheme(themeId) {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;
    
    currentTheme = themeId;
    localStorage.setItem('zdi_theme', themeId);
    renderThemeOptions();
    
    // Inject dynamic CSS to override common colors
    const styleEl = document.getElementById('dynamic-theme-style');
    if (themeId === 'default') {
        styleEl.innerHTML = `
            body { background: ${theme.bg} !important; }
        `;
    } else {
        styleEl.innerHTML = `
            body { background: ${theme.bg} !important; }
            .text-cyan-400 { color: ${theme.primary} !important; }
            .bg-cyan-500\\/10 { background-color: ${theme.primary}20 !important; }
            .border-cyan-500\\/30 { border-color: ${theme.primary}50 !important; }
            .border-cyan-500 { border-color: ${theme.primary} !important; }
            .focus\\:border-cyan-500:focus { border-color: ${theme.primary} !important; }
            .focus\\:ring-cyan-500:focus { --tw-ring-color: ${theme.primary} !important; }
            .from-cyan-500 { --tw-gradient-from: ${theme.primary} !important; }
            .to-blue-600 { --tw-gradient-to: ${theme.secondary} !important; }
            .hover\\:from-cyan-600:hover { --tw-gradient-from: ${theme.secondary} !important; }
            .hover\\:to-blue-700:hover { --tw-gradient-to: ${theme.primary} !important; }
            .shadow-cyan-500\\/20 { --tw-shadow-color: ${theme.primary}40 !important; }
            
            /* Add some generic mappings if needed */
            .text-cyan-500 { color: ${theme.primary} !important; }
            .hover\\:text-cyan-400:hover { color: ${theme.primary} !important; }
        `;
    }
}

function toggleTheme() {
    renderThemeOptions();
    const modal = document.getElementById('modal-theme');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('modal-theme-content').classList.remove('scale-95');
    }, 10);
}

function closeThemeModal() {
    const modal = document.getElementById('modal-theme');
    modal.classList.add('opacity-0');
    document.getElementById('modal-theme-content').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(currentTheme);
});
