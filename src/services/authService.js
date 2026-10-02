import { ApiError, request, unwrapData } from './api';
import {
  clearStoredSession,
  getStoredToken,
  readStoredSession,
  saveSession,
} from './tokenStorage';
import { normalizeEmail } from '../utils/emailValidation';

// ─── Contrato con el backend ────────────────────────────────────────────────
// US-11 quedó así en el backend:
//   POST /api/users/register -> 201 { token, tokenType, expiresIn, usuario }
//   POST /api/users/login    -> 200 { token, tokenType, expiresIn, usuario }
//   GET  /api/users/profile  -> 200 UsuarioDTO (exige Authorization: Bearer)
// Ambos caminos aceptan la variante con barra final. Si algún día cambian,
// se toca solo este bloque.
const LOGIN_PATH = '/api/users/login';
const REGISTER_PATH = '/api/users/register';
const PROFILE_PATH = '/api/users/profile';

// El backend devuelve { usuario: { idUsuario, email, nombre, ... } }.
const normalizeSession = (payload) => ({
  token: payload?.token ?? null,
  tokenType: payload?.tokenType ?? 'Bearer',
  expiresIn: payload?.expiresIn ?? null,
  idUsuario: payload?.usuario?.idUsuario ?? null,
  email: payload?.usuario?.email ?? '',
  nombre: payload?.usuario?.nombre ?? '',
});

const getStatusMessage = (status, contexto) => {
  if (status === 400) {
    return 'Revisa los datos: el correo o la contraseña no tienen un formato válido.';
  }

  if (status === 401) {
    return contexto === 'registro'
      ? 'No pudimos crear la cuenta. Inténtalo de nuevo en unos minutos.'
      : 'Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.';
  }

  if (status === 409) {
    return 'Ese correo ya está registrado. Prueba a iniciar sesión.';
  }

  if (status >= 500) {
    return 'El servicio no está disponible en este momento. Inténtalo de nuevo en unos minutos.';
  }

  return 'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.';
};

/** El backend responde ProblemDetail; su `detail` ya está redactado para la UI. */
const toApiError = (error, contexto) => {
  if (error instanceof ApiError) {
    const mensajeDelServidor = error.details?.detail;
    return new ApiError(
      typeof mensajeDelServidor === 'string' && mensajeDelServidor
        ? mensajeDelServidor
        : getStatusMessage(error.status, contexto),
      error.status,
      error.details
    );
  }

  return new ApiError(getStatusMessage(0, contexto));
};

/**
 * Inicia sesión contra el backend. A diferencia de la versión simulada, la
 * contraseña es obligatoria: es lo que permite que el backend emita el JWT.
 */
export const requestLogin = async ({ email, password }) => {
  try {
    const response = unwrapData(
      await request(LOGIN_PATH, {
        method: 'POST',
        body: JSON.stringify({
          email: normalizeEmail(email),
          password,
        }),
      })
    );

    const session = normalizeSession(response);
    saveSession(session);
    return session;
  } catch (error) {
    throw toApiError(error, 'login');
  }
};

/** Crea la cuenta y deja la sesión iniciada, igual que un login exitoso. */
export const requestRegister = async ({ nombre, email, password }) => {
  try {
    const response = unwrapData(
      await request(REGISTER_PATH, {
        method: 'POST',
        body: JSON.stringify({
          nombre: String(nombre ?? '').trim(),
          email: normalizeEmail(email),
          password,
        }),
      })
    );

    const session = normalizeSession(response);
    saveSession(session);
    return session;
  } catch (error) {
    throw toApiError(error, 'registro');
  }
};

/**
 * Confirma el token contra el backend. Un 401 significa que el token caducó o
 * que se cambió el secreto, así que la sesión se descarta y hay que volver a
 * entrar.
 */
export const requestProfile = async () => {
  try {
    const perfil = unwrapData(await request(PROFILE_PATH));
    const session = {
      ...(readStoredSession() ?? {}),
      idUsuario: perfil?.idUsuario ?? null,
      email: perfil?.email ?? '',
      nombre: perfil?.nombre ?? '',
    };
    saveSession(session);
    return perfil;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearStoredSession();
    }
    throw toApiError(error, 'perfil');
  }
};

// ─── Sesión ────────────────────────────────────────────────────────────────
export const getToken = () => getStoredToken();

export const getSession = () => readStoredSession();

export const setToken = (token) => saveSession({ ...(readStoredSession() ?? {}), token });

export const clearToken = () => clearStoredSession();

export const isAuthenticated = () => Boolean(getStoredToken());
