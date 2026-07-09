// ============================================================
// HUD HEADER & COMMS CONTROLLER
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const btnMenu = document.getElementById('btn-menu');
    const mainNav = document.getElementById('main-nav');
    const btnLogout = document.getElementById('btn-logout');

    if (btnMenu && mainNav) {
        btnMenu.addEventListener('click', () => {
            const isOpen = mainNav.style.display === 'flex';
            mainNav.style.display = isOpen ? 'none' : 'flex';
            mainNav.style.flexDirection = 'column';
            mainNav.style.position = 'absolute';
            mainNav.style.top = '100%';
            mainNav.style.right = '0';
            mainNav.style.background = 'var(--bg-surface)';
            mainNav.style.border = '1px solid var(--border-base)';
            mainNav.style.padding = 'var(--sp-4)';
            mainNav.style.zIndex = '100';
            btnMenu.textContent = isOpen ? 'Uplink' : 'Close';
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('portal_pessoal_auth');
            window.location.replace('pages/login.html'); // Gateway termination
        });
    }
});