// Verifica e protege a rota
const userToken = sessionStorage.getItem('portal_pessoal_auth');

if (!userToken || userToken !== 'auth_token_8x99_valid') {
    window.location.replace('../pages/login.html');
}