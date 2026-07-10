// ============================================================
// SECURITY GATEWAY: FIREBASE AUTHENTICATION LOGIC
// ============================================================
import { auth, signInWithEmailAndPassword, onAuthStateChanged } from '../core/firebase-config.js';

const DOM = {
    form: document.getElementById('auth-form'),
    inputUser: document.getElementById('input-username'),
    inputPass: document.getElementById('input-password'),
    errorBox: document.getElementById('auth-error')
};

// Se o operador já possuir um token válido, redireciona para o HUD central
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.replace('../index.html');
    }
});

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
    
    // O Firebase exige um formato de email. Ex: admin@sys.hud
    const operativeEmail = DOM.inputUser.value.trim(); 
    const accessCode = DOM.inputPass.value.trim();
    
    try {
        await signInWithEmailAndPassword(auth, operativeEmail, accessCode);
        setTerminalError(false);
        // O onAuthStateChanged interceptará o sucesso e fará o redirecionamento
    } catch (error) {
        console.error("SYS.ERR: Uplink failed. Authorization denied.", error.message);
        setTerminalError(true);
    }
};

DOM.form.addEventListener('submit', processUplink);