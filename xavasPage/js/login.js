/* * ARQUIVO: js/login.js
 * OBJETIVO: Validar as credenciais digitadas e gerar o token de acesso.
 */

const loginForm = document.getElementById('login-form');
const inputUser = document.getElementById('input-username');
const inputPass = document.getElementById('input-password');
const errorMessage = document.getElementById('error-message');

const VALID_USER_HASH = "ed2befb11499489e2570cb053f774b8ed93e89eddab3f78867a2a5f32c58845e"; 
const VALID_PASS_HASH = "b54c95b91c90428742d2b069cde2de4e92d155acc2af7a6a0b36f14028ae5aa9";

// Função nativa do navegador para transformar o texto digitado em um Hash SHA-256
async function criarHash(texto) {
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Interceptamos o formulário. Note a palavra "async" aqui!
loginForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const usernameDigitado = inputUser.value.trim();
    const passwordDigitada = inputPass.value.trim();
    
    // Transformamos o que o usuário digitou em Hash para comparar com o Hash salvo
    const hashDoUsuarioDigitado = await criarHash(usernameDigitado);
    const hashDaSenhaDigitada = await criarHash(passwordDigitada);
    
    // Comparamos os Hashes em vez do texto limpo
    if (hashDoUsuarioDigitado === VALID_USER_HASH && hashDaSenhaDigitada === VALID_PASS_HASH) {
        
        errorMessage.style.display = 'none';
        
        // Criamos um token um pouco mais complexo só para dificultar adivinhações
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
        
        // SUCESSO! Voltamos uma pasta (..) para encontrar o index.html na raiz
        window.location.href = '../index.html';
        
    } else {
        inputPass.value = '';
        errorMessage.style.display = 'block';
    }
});

// Verificação: se já estiver logado
window.addEventListener('DOMContentLoaded', () => {
    // Lembre-se de checar o novo valor do token aqui também
    if (sessionStorage.getItem('portal_pessoal_auth') === 'auth_token_8x99_valid') {
        window.location.replace('../index.html');
    }
});

