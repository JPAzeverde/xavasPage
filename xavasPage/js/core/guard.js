// ============================================================
// SECURITY PROTOCOL: ROUTE GUARD
// ============================================================
const enforceSecurityClearance = () => {
    const activeToken = sessionStorage.getItem('portal_pessoal_auth');
    
    // Se não houver token ou for inválido, expulsa para o gateway
    if (!activeToken || activeToken !== 'auth_token_8x99_valid') {
        console.warn("SYS.HUD: Unauthorized access attempt detected. Rerouting...");
        // Ajuste o caminho dependendo de onde o guard.js for chamado
        const isRoot = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html');
        window.location.replace(isRoot ? 'pages/login.html' : 'login.html');
    }
};

enforceSecurityClearance();