// Preferencia de tema (claro / oscuro).
//
// Vive aparte del provider por la misma razón que services/tokenStorage.js:
// varios módulos lo necesitan sin depender de React, y así ninguno importa a
// otro. El atributo `data-theme` va en <html> porque las variables de
// src/index.css están declaradas en :root y [data-theme='dark'].
//
// Ojo: el arranque de index.html repite esta lógica en línea para aplicar el
// tema antes del primer pintado. Si cambias la clave o las reglas, cambia los
// dos sitios.

export const THEME_KEY = 'eventflow.tema';
export const THEMES = ['light', 'dark'];
export const DEFAULT_THEME = 'light';

const isTheme = (value) => THEMES.includes(value);

const getStorage = () => {
  try {
    return window.localStorage;
  } catch {
    // Modo privado o almacenamiento bloqueado: la preferencia no se persiste y
    // el tema queda solo para esta sesión.
    return null;
  }
};

/** Tema guardado, o null si no hay ninguno válido. */
export const readStoredTheme = () => {
  const stored = getStorage()?.getItem(THEME_KEY);
  return isTheme(stored) ? stored : null;
};

export const persistTheme = (theme) => {
  if (!isTheme(theme)) {
    return;
  }

  try {
    getStorage()?.setItem(THEME_KEY, theme);
  } catch {
    // Cuota agotada o almacenamiento bloqueado: el tema sigue activo en esta
    // pestaña, solo que no se recuerda al recargar.
  }
};

/** Lo que pide el sistema cuando la persona no ha elegido nada. */
export const getSystemTheme = () => {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

/** Tema inicial: la preferencia guardada si existe, si no la del sistema. */
export const resolveInitialTheme = () => readStoredTheme() ?? getSystemTheme();

/** Escribe el atributo en <html>, que es lo que lee src/index.css. */
export const applyTheme = (theme) => {
  const next = isTheme(theme) ? theme : DEFAULT_THEME;

  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.dataset.theme = next;
  }

  return next;
};

/** Deja el tema listo antes de montar React y lo devuelve. */
export const initializeTheme = () => {
  const theme = resolveInitialTheme();
  applyTheme(theme);
  return theme;
};