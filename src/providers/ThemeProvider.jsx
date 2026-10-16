import { useCallback, useMemo, useRef, useState } from 'react';
import { ThemeContext } from './theme-context';
import {
  applyTheme,
  initializeTheme,
  persistTheme,
  THEME_TRANSITION_MS,
} from '../utils/theme';

/**
 * Tema claro u oscuro.
 *
 * El atributo `data-theme` ya quedó puesto en <html> por el arranque inline de
 * index.html, así que aquí no hace falta esperar a montar para evitar el
 * destello. Este provider solo refleja el estado en React para poder pintar el
 * interruptor y guardarlo al cambiarlo.
 */
export const ThemeProvider = ({ children }) => {
  // El arranque inline ya resolvió el tema en el DOM: se lee de ahí para que el
  // primer render coincida con lo que la persona ve.
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || initializeTheme()
  );

  // Marca temporal del último cambio, para no encadenar transiciones.
  const ultimoCambio = useRef(0);

  // Los efectos van fuera del actualizador de setState: en StrictMode puede
  // ejecutarse dos veces y escribir el atributo o el storage repetido.
  const setThemeAndPersist = useCallback((next) => {
    const resolved = applyTheme(next);
    persistTheme(resolved);
    ultimoCambio.current = Date.now();
    setTheme(resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    // Un clic por debajo de la duración de la transición se ignora. Alternar
    // el tema más de una vez por segundo produce varios cambios completos de
    // luminancia sobre toda la pantalla en el mismo segundo, que es lo que
    // WCAG 2.3.1 limita a tres. El umbral coincide con la transición: si se
    // aceptara el clic, se solaparían dos transiciones a mitad.
    const desdeElUltimo = Date.now() - ultimoCambio.current;
    if (desdeElUltimo < THEME_TRANSITION_MS) {
      return;
    }

    setThemeAndPersist(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setThemeAndPersist]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme: setThemeAndPersist,
      toggleTheme,
    }),
    [theme, setThemeAndPersist, toggleTheme]
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
};
