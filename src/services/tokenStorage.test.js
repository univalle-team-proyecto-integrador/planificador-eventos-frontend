import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearStoredSession,
  getStoredToken,
  notifySessionExpired,
  onSessionExpired,
  readStoredSession,
  saveSession,
} from './tokenStorage';

describe('tokenStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('guarda y recupera el token y la sesión', () => {
    saveSession({ token: 'abc.def.ghi', nombre: 'Santiago', idUsuario: 7 });

    expect(getStoredToken()).toBe('abc.def.ghi');
    expect(readStoredSession()).toEqual({
      token: 'abc.def.ghi',
      nombre: 'Santiago',
      idUsuario: 7,
    });
  });

  it('devuelve null cuando no hay nada guardado', () => {
    expect(getStoredToken()).toBeNull();
    expect(readStoredSession()).toBeNull();
  });

  it('clearStoredSession borra token y sesión', () => {
    saveSession({ token: 'abc', nombre: 'Santiago' });

    clearStoredSession();

    expect(getStoredToken()).toBeNull();
    expect(readStoredSession()).toBeNull();
  });

  it('readStoredSession tolera un valor corrupto en localStorage', () => {
    window.localStorage.setItem('eventflow.sesion', '{no es json');

    expect(readStoredSession()).toBeNull();
  });

  it('notifySessionExpired limpia la sesión y avisa a los suscriptores', () => {
    saveSession({ token: 'caducado', nombre: 'Santiago' });
    const listener = vi.fn();
    const quitar = onSessionExpired(listener);

    notifySessionExpired();

    expect(getStoredToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);

    quitar();
    notifySessionExpired();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
