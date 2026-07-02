/* * ARQUIVO: js/guard.js */

const userToken = sessionStorage.getItem('portal_pessoal_auth');

// Atualizado com o novo valor do token
if (!userToken || userToken !== 'auth_token_8x99_valid') {
    window.location.replace('pages/login.html');
}