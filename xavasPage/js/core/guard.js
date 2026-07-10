// ============================================================
// SECURITY PROTOCOL: ROUTE GUARD (FIREBASE)
// ============================================================
import { auth, onAuthStateChanged } from './firebase-config.js';

const enforceSecurityClearance = () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            console.warn("SYS.HUD: Unauthorized access attempt detected. Rerouting...");
            
            // Verifica se está na raiz (index.html) ou dentro da pasta pages
            const isRoot = window.location.pathname.endsWith('/') || window.location.pathname.includes('index.html');
            
            // Redireciona para o login correto dependendo de onde o invasor tentou entrar
            window.location.replace(isRoot ? 'pages/login.html' : 'login.html');
        }
    });
};

enforceSecurityClearance();