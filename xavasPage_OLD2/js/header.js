const btnMenu = document.getElementById('btn-menu');
const mainNav = document.getElementById('main-nav');
const btnLogout = document.getElementById('btn-logout');

btnMenu?.addEventListener('click', () => {
    mainNav.classList.toggle('is-open');
    btnMenu.textContent = mainNav.classList.contains('is-open') ? 'Close' : 'Menu';
});

btnLogout?.addEventListener('click', () => {
    sessionStorage.removeItem('portal_pessoal_auth');
    window.location.replace('pages/login.html');
});