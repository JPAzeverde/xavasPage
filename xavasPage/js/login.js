// =========================================
//  LOGIN LOGIC
// =========================================
const authForm = document.getElementById('auth-form');
const inputUser = document.getElementById('input-username');
const inputPass = document.getElementById('input-password');
const errorMessage = document.getElementById('auth-error');

const VALID_USER_HASH = "ed2befb11499489e2570cb053f774b8ed93e89eddab3f78867a2a5f32c58845e"; 
const VALID_PASS_HASH = "b54c95b91c90428742d2b069cde2de4e92d155acc2af7a6a0b36f14028ae5aa9";

// Encrypt credentials
const createHash = async (text) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Toggle Error State
const toggleError = (show) => {
    if (show) {
        inputPass.value = '';
        errorMessage.style.display = 'block';
        requestAnimationFrame(() => {
            errorMessage.classList.remove('auth__alert--hidden');
        });
    } else {
        errorMessage.classList.add('auth__alert--hidden');
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 250); // Matches CSS transition time
    }
};

// Handle Authentication
const handleLogin = async (event) => {
    event.preventDefault();
    
    const username = inputUser.value.trim();
    const password = inputPass.value.trim();
    
    try {
        const [userHash, passHash] = await Promise.all([
            createHash(username),
            createHash(password)
        ]);
        
        if (userHash === VALID_USER_HASH && passHash === VALID_PASS_HASH) {
            toggleError(false);
            sessionStorage.setItem('portal_pessoal_auth', 'auth_token_8x99_valid');
            window.location.href = '../index.html';
        } else {
            toggleError(true);
        }
    } catch (error) {
        console.error("Hashing failed", error);
        toggleError(true);
    }
};

// Initialization
authForm.addEventListener('submit', handleLogin);

window.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('portal_pessoal_auth') === 'auth_token_8x99_valid') {
        window.location.replace('../index.html');
    }
});