// ============================================================
// SECURITY GATEWAY: AUTHENTICATION LOGIC
// ============================================================
const DOM = {
    form: document.getElementById('auth-form'),
    inputUser: document.getElementById('input-username'),
    inputPass: document.getElementById('input-password'),
    errorBox: document.getElementById('auth-error')
};

// Hashes autorizados (Mantidos os originais do seu código)
const CLEARANCE_USER = "ed2befb11499489e2570cb053f774b8ed93e89eddab3f78867a2a5f32c58845e"; 
const CLEARANCE_PASS = "b54c95b91c90428742d2b069cde2de4e92d155acc2af7a6a0b36f14028ae5aa9";

// Criptografia nativa
const generateHash = async (text) => {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

const setTerminalError = (active) => {
    if (active) {
        DOM.inputPass.value = '';
        DOM.errorBox.style.display = 'block';
        DOM.inputUser.focus();
    } else {
        DOM.errorBox.style.display = 'none';
    }
};

const processUplink = async (event) => {
    event.preventDefault();
    
    const operativeId = DOM.inputUser.value.trim();
    const accessCode = DOM.inputPass.value.trim();
    
    try {
        const [userHash, passHash] = await Promise.all([
            generateHash(operativeId),
            generateHash(accessCode)
        ]);
        
        if (userHash === CLEARANCE_USER && passHash === CLEARANCE_PASS) {
            setTerminalError(false);
            sessionStorage.setItem('portal_pessoal_auth', 'auth_token_8x99_valid');
            window.location.replace('../index.html'); // Acesso concedido
        } else {
            setTerminalError(true);
        }
    } catch (error) {
        console.error("Encryption  failed.", error);
        setTerminalError(true);
    }
};

// Se o operador já tiver autorização, redireciona para o HUD central
window.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('portal_pessoal_auth') === 'auth_token_8x99_valid') {
        window.location.replace('../index.html');
    }
});

DOM.form.addEventListener('submit', processUplink);