const loginForm = document.getElementById('login-form');
const inputUser = document.getElementById('input-username');
const inputPass = document.getElementById('input-password');
const errorMessage = document.getElementById('error-message');

const VALID_USER_HASH = "ed2befb11499489e2570cb053f774b8ed93e89eddab3f78867a2a5f32c58845e"; 
const VALID_PASS_HASH = "b54c95b91c90428742d2b069cde2de4e92d155acc2af7a6a0b36f14028ae5aa9";

async function criarHash(texto) {
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

loginForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const usernameDigitado = inputUser.value.trim();
    const passwordDigitada = inputPass.value.trim();
    const hashDoUsuarioDigitado = await criarHash(usernameDigitado);
    const hashDaSenhaDigitada = await criarHash(passwordDigitada);
    
    if (hashDoUsuarioDigitado === VALID_USER_HASH && hashDaSenhaDigitada === VALID_PASS_HASH) {
        errorMessage.style.display = 'none';
        sessionStorage.setItem('portal_pessoal_auth', 'auth_token_8x99_valid');
        window.location.href = '../index.html';
        
    } else {
        inputPass.value = '';
        errorMessage.style.display = 'block';
    }
});

loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const usernameDigitado = inputUser.value.trim();
    const passwordDigitada = inputPass.value.trim();
    
    if (usernameDigitado === VALID_USER && passwordDigitada === VALID_PASS) {
        
        errorMessage.style.display = 'none';
        sessionStorage.setItem('portal_pessoal_auth', 'joao_logado_com_sucesso');
        
        window.location.href = '../index.html';
        
    } else {
        inputPass.value = '';
        errorMessage.style.display = 'block';
    }
});

window.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('portal_pessoal_auth') === 'auth_token_8x99_valid') {
        window.location.replace('../index.html');
    }
});

