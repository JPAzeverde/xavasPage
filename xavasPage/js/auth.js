/**
 * xavasPage — Authentication Module
 * Codename: GATEKEEPER
 * Verifies credentials using SHA-256 hash comparison.
 */

// ---------- EXPECTED CREDENTIALS ----------
// Paste the SHA-256 hash of your password below.
const EXPECTED_USER = 'joao';
const EXPECTED_HASH = 'b54c95b91c90428742d2b069cde2de4e92d155acc2af7a6a0b36f14028ae5aa9'; // <-- substitua pelo hash gerado

/**
 * Computes SHA-256 hash of a string.
 * Uses the SubtleCrypto API (available in modern browsers).
 * @param {string} message
 * @returns {Promise<string>} hex string
 */
async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Attempts to authenticate the user.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<boolean>} true if credentials are valid
 */
async function authenticate(username, password) {
  if (username !== EXPECTED_USER) return false;
  const inputHash = await sha256(password);
  return inputHash === EXPECTED_HASH;
}