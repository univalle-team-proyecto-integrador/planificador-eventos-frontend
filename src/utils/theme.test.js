import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_THEME,
  THEME_KEY,
  THEME_TRANSITION_MS,
  THEMES,
  applyTheme,
  getSystemTheme,
  initializeTheme,
  persistTheme,
  readStoredTheme,
  resolveInitialTheme,
} from './theme';

const setMatchMedia = (matches) => {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
};

describe('theme', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
    vi.restoreAllMocks();
  });

  it('expone solo los dos temas soportados', () => {
    expect(THEMES).toEqual(['light', 'dark']);
    expect(DEFAULT_THEME).toBe('light');
  });

  describe('readStoredTheme', () => {
    it('devuelve el tema guardado', () => {
      window.localStorage.setItem(THEME_KEY, 'dark');
      expect(readStoredTheme()).toBe('dark');
    });

    it('devuelve null si no hay nada guardado o el valor no es válido', () => {
      expect(readStoredTheme()).toBeNull();

      window.localStorage.setItem(THEME_KEY, 'sepia');
      expect(readStoredTheme()).toBeNull();
    });
  });

  describe('persistTheme', () => {
    it('guarda un tema válido', () => {
      persistTheme('dark');
      expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
    });

    it('ignora un tema no soportado', () => {
      persistTheme('sepia');
      expect(window.localStorage.getItem(THEME_KEY)).toBeNull();
    });

    it('no lanza cuando el almacenamiento está bloqueado', () => {
      const getItem = vi
        .spyOn(window.localStorage.__proto__, 'setItem')
        .mockImplementation(() => {
          throw new Error('cuota agotada');
        });

      expect(() => persistTheme('dark')).not.toThrow();
      getItem.mockRestore();
    });
  });

  describe('getSystemTheme', () => {
    it('respeta la preferencia del sistema', () => {
      setMatchMedia(true);
      expect(getSystemTheme()).toBe('dark');

      setMatchMedia(false);
      expect(getSystemTheme()).toBe('light');
    });

    it('cae a claro si matchMedia no existe', () => {
      const original = window.matchMedia;
      // Simula navegadores antiguos sin la API.
      window.matchMedia = undefined;
      expect(getSystemTheme()).toBe('light');
      window.matchMedia = original;
    });
  });

  describe('resolveInitialTheme', () => {
    it('la preferencia guardada manda sobre el sistema', () => {
      window.localStorage.setItem(THEME_KEY, 'light');
      setMatchMedia(true);

      expect(resolveInitialTheme()).toBe('light');
    });

    it('sin preferencia guardada sigue al sistema', () => {
      setMatchMedia(true);
      expect(resolveInitialTheme()).toBe('dark');
    });
  });

  describe('applyTheme', () => {
    it('escribe data-theme en el elemento raíz', () => {
      expect(applyTheme('dark')).toBe('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('un valor no soportado se resuelve al tema por defecto', () => {
      expect(applyTheme('sepia')).toBe(DEFAULT_THEME);
      expect(document.documentElement.dataset.theme).toBe('light');
    });
  });

  describe('transición de tema', () => {
    const clase = () => document.documentElement.classList;

    beforeEach(() => {
      vi.useFakeTimers();
      clase().remove('theme-animating');
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
      clase().remove('theme-animating');
    });

    it('marca la transición mientras dura y la quita al terminar', () => {
      applyTheme('dark');
      expect(clase()).toContain('theme-animating');

      vi.advanceTimersByTime(THEME_TRANSITION_MS - 1);
      expect(clase()).toContain('theme-animating');

      vi.advanceTimersByTime(1);
      expect(clase()).not.toContain('theme-animating');
    });

    it('un segundo cambio cancela el temporizador del anterior', () => {
      applyTheme('dark');

      // A mitad de la primera transición llega otro cambio: el primer
      // temporizador no debe quitar la clase antes de tiempo.
      vi.advanceTimersByTime(THEME_TRANSITION_MS / 2);
      applyTheme('light');

      vi.advanceTimersByTime(THEME_TRANSITION_MS / 2);
      expect(clase()).toContain('theme-animating');

      vi.advanceTimersByTime(THEME_TRANSITION_MS / 2);
      expect(clase()).not.toContain('theme-animating');
      expect(document.documentElement.dataset.theme).toBe('light');
    });

    it('la clase nunca se queda pegada tras pasar el tiempo', () => {
      applyTheme('dark');
      applyTheme('light');

      vi.advanceTimersByTime(THEME_TRANSITION_MS * 3);
      expect(clase()).not.toContain('theme-animating');
    });

    it('aplica el cambio sin forzar reflow cuando no hay tema previo', () => {
      delete document.documentElement.dataset.theme;
      applyTheme('dark');

      expect(clase()).toContain('theme-animating');
      expect(document.documentElement.dataset.theme).toBe('dark');
    });
  });

  it('initializeTheme deja el atributo listo y devuelve el tema', () => {
    window.localStorage.setItem(THEME_KEY, 'dark');

    expect(initializeTheme()).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
