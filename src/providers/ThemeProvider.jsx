import { useCallback, useMemo, useState } from 'react';
import { ThemeContext } from './theme-context';
import { applyTheme, initializeTheme, persistTheme } from '../utils/theme';

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

  // Los efectos van fuera del actualizador de setState: en StrictMode puede
  // ejecutarse dos veces y escribir el atributo o el storage repetido.
  const setThemeAndPersist = useCallback((next) => {
    const resolved = applyTheme(next);
    persistTheme(resolved);
    setTheme(resolved);
  }, []);

  const toggleTheme = useCallback(() => {
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