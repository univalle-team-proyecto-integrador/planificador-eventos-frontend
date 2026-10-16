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

/**
 * Duración de la transición de tema, en ms. Tiene que coincidir con el valor
 * de `src/index.css` (la transición de `:root`): el temporizador de aquí
 * solo decide cuándo quitar la clase que protege la animación, no cuándo
 * termina el movimiento. Si uno cambia y el otro no, la clase se queda puesta
 * o se quita antes de tiempo.
 */
export const THEME_TRANSITION_MS = 400;

const isTheme = (value) => THEMES.includes(value);

// Timer de la última transición en curso. Se guarda a nivel de módulo para que
// dos cambios seguidos no acumulen temporizadores: el segundo cancela al
// primero, y la clase se queda exactamente el tiempo de la última.
let transitionTimer = null;

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
  const root = document?.documentElement;

  if (root) {
    // La transición de :root solo arranca si el elemento ya está pintado con
    // el valor anterior. Escribir el atributo en el mismo task que el pintado
    // hace que el navegador resuelva el cambio de golpe, sin frame
    // intermedio, y la transición no se ve. Forzar el reflow con offsetHeight
    // asegura que existe un valor previo con el que interpolar.
    if (root.dataset.theme) {
      void root.offsetHeight;
    }

    // La clase marca "estamos transicionando": sin ella, un cambio de tema
    // a mitad de otro se mezclaría con las transiciones propias de cada
    // elemento (colores, sombras, transforms de hover) y el resultado es
    // irregular. Con ella, solo se animan los tokens del tema.
    root.classList.add('theme-animating');

    if (transitionTimer !== null) {
      clearTimeout(transitionTimer);
    }
    transitionTimer = setTimeout(() => {
      root.classList.remove('theme-animating');
      transitionTimer = null;
    }, THEME_TRANSITION_MS);

    root.dataset.theme = next;
  }

  return next;
};

/** Deja el tema listo antes de montar React y lo devuelve. */
export const initializeTheme = () => {
  const theme = resolveInitialTheme();
  applyTheme(theme);
  return theme;
};
