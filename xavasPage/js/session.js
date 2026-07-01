/**
 * xavasPage — Session Manager
 * Codename: WATCHTOWER
 * Uses localStorage to maintain a simple session.
 */

const SESSION_KEY = 'xavas_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

function loginSession() {
  const sessionData = {
    user: 'joao',
    timestamp: Date.now()
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

function logoutSession() {
  localStorage.removeItem(SESSION_KEY);
}

function isSessionValid() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return false;
  try {
    const session = JSON.parse(raw);
    const elapsed = Date.now() - session.timestamp;
    return session.user === 'joao' && elapsed < SESSION_DURATION_MS;
  } catch (e) {
    return false;
  }
}

function requireAuth() {
  if (!isSessionValid()) {
    window.location.href = 'login.html';
  }
}

function logoutSession() {
  localStorage.removeItem(SESSION_KEY);
}
