import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_THEME,
  THEME_KEY,
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

  it('initializeTheme deja el atributo listo y devuelve el tema', () => {
    window.localStorage.setItem(THEME_KEY, 'dark');

    expect(initializeTheme()).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});