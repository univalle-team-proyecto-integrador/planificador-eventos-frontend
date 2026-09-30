import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearToken,
  getToken,
  isAuthenticated,
  requestLogin,
  requestProfile,
  requestRegister,
} from './authService';
import { saveSession } from './tokenStorage';

const jsonResponse = (status, body) => {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(raw),
  };
};

const AUTH_OK = {
  token: 'header.payload.firma',
  tokenType: 'Bearer',
  expiresIn: 28800,
  usuario: {
    idUsuario: 1,
    email: 'santiago@correo.com',
    nombre: 'Santiago Pérez',
    limiteHorasDiarias: 8,
  },
};

describe('authService', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('requestLogin llama a /api/users/login y guarda la sesión', async () => {
    fetch.mockResolvedValue(jsonResponse(200, AUTH_OK));

    const session = await requestLogin({
      email: '  Santiago@Correo.com ',
      password: 'Eventos2026',
    });

    // El frontend solo recorta; el backend normaliza a minúsculas, por eso
    // aquí llega el correo tal cual lo escribió la persona.

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toContain('/api/users/login');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({
      email: 'Santiago@Correo.com',
      password: 'Eventos2026',
    });

    expect(session.token).toBe('header.payload.firma');
    expect(session.nombre).toBe('Santiago Pérez');
    expect(isAuthenticated()).toBe(true);
    expect(getToken()).toBe('header.payload.firma');
  });

  it('requestLogin traduce un 401 a un mensaje en español', async () => {
    fetch.mockResolvedValue(
      jsonResponse(401, { title: 'Credenciales inválidas', detail: 'El correo o la contraseña no coinciden.' })
    );

    await expect(
      requestLogin({ email: 'santiago@correo.com', password: 'mala' })
    ).rejects.toThrow('El correo o la contraseña no coinciden.');

    expect(isAuthenticated()).toBe(false);
  });

  it('requestLogin no confunde un 500 con credenciales inválidas', async () => {
    fetch.mockResolvedValue(jsonResponse(500, { title: 'Error interno' }));

    await expect(
      requestLogin({ email: 'santiago@correo.com', password: 'Eventos2026' })
    ).rejects.toThrow('El servicio no está disponible en este momento.');
  });

  it('requestRegister llama a /api/users/register con nombre, email y password', async () => {
    fetch.mockResolvedValue(jsonResponse(201, AUTH_OK));

    const session = await requestRegister({
      nombre: '  Santiago Pérez  ',
      email: 'santiago@correo.com',
      password: 'Eventos2026',
    });

    const [url, options] = fetch.mock.calls[0];
    expect(url).toContain('/api/users/register');
    expect(JSON.parse(options.body)).toEqual({
      nombre: 'Santiago Pérez',
      email: 'santiago@correo.com',
      password: 'Eventos2026',
    });
    expect(session.idUsuario).toBe(1);
  });

  it('requestRegister sugiere iniciar sesión cuando el correo ya existe', async () => {
    fetch.mockResolvedValue(
      jsonResponse(409, { title: 'Correo duplicado', detail: 'Ya existe un usuario con ese correo.' })
    );

    await expect(
      requestRegister({ nombre: 'Santiago', email: 'santiago@correo.com', password: 'Eventos2026' })
    ).rejects.toThrow('Ya existe un usuario con ese correo.');
  });

  it('requestProfile adjunta el token guardado y refresca los datos de usuario', async () => {
    saveSession({ token: 'token-vigente', nombre: '' });
    fetch.mockResolvedValue(
      jsonResponse(200, { idUsuario: 1, email: 'santiago@correo.com', nombre: 'Santiago Pérez' })
    );

    const perfil = await requestProfile();

    const [url, options] = fetch.mock.calls[0];
    expect(url).toContain('/api/users/profile');
    expect(options.headers.get('Authorization')).toBe('Bearer token-vigente');
    expect(perfil.nombre).toBe('Santiago Pérez');
  });

  it('requestProfile borra la sesión cuando el token ya no es válido', async () => {
    saveSession({ token: 'token-caducado', nombre: 'Santiago' });
    fetch.mockResolvedValue(
      jsonResponse(401, { title: 'No autorizado', detail: 'Tu sesión expiró.' })
    );

    await expect(requestProfile()).rejects.toThrow('Tu sesión expiró.');
    expect(isAuthenticated()).toBe(false);
    expect(getToken()).toBeNull();
  });

  it('clearToken deja al usuario sin sesión', () => {
    saveSession({ token: 'abc', nombre: 'Santiago' });

    clearToken();

    expect(isAuthenticated()).toBe(false);
  });
});
