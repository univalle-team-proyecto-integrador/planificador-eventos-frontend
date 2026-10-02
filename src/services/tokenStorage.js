// Almacén del token JWT.
//
// Vive en su propio módulo a propósito: services/api.js y services/authService.js
// necesitan leerlo, y si authService importara de api.js y api.js importara de
// authService se formsaría un ciclo. Aquí solo hay localStorage, sin dependencias.

const TOKEN_KEY = 'eventflow.token';
const SESSION_KEY = 'eventflow.sesion';

const getStorage = () => {
  try {
    return window.localStorage;
  } catch {
    // Modo privado de Safari o almacenamiento bloqueado: la sesión queda solo
    // en memoria, y el usuario tendrá que volver a iniciar sesión al recargar.
    return null;
  }
};

export const getStoredToken = () => getStorage()?.getItem(TOKEN_KEY) ?? null;

export const saveSession = (session) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(TOKEN_KEY, session.token);
  storage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const readStoredSession = () => {
  const raw = getStorage()?.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearStoredSession = () => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(SESSION_KEY);
};

// ─── Aviso de sesión expirada ───────────────────────────────────────────────
// Un 401 en cualquier llamada significa que el token caducó o que se cambió
// el secreto. Se avisa por evento en lugar de que cada vista mire su propio
// error, para que el providers/SessionProvider pueda cerrar la sesión una vez.
const listeners = new Set();

export const onSessionExpired = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const notifySessionExpired = () => {
  clearStoredSession();
  listeners.forEach((listener) => listener());
};
