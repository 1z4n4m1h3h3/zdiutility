// ============================================================
// NOTIFICATION TOAST SYSTEM (Real-time user feedback)
// ============================================================
function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    // Set duration for CSS animation
    toast.style.setProperty('--toast-duration', `${duration}ms`);

    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <div class="flex items-center gap-3 relative z-10 w-full">
            <span class="toast-icon"><i class="fa-solid ${iconMap[type]}"></i></span>
            <span class="flex-1">${message}</span>
        </div>
        <div class="toast-progress"></div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, duration);
}
