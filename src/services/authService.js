import { ApiError, request, unwrapData } from './api';
import { normalizeEmail } from '../utils/emailValidation';

// ─── Contrato con el backend ────────────────────────────────────────────────
// Estos dos puntos son lo único que hay que ajustar cuando el backend defina
// la autenticación. El resto de la app no depende de ellos.
//
// LOGIN_PATH: toda la API del backend vive bajo /api/*, por eso se asume
//   /api/auth/login. Si el endpoint real difiere, se cambia solo aquí.
// AUTH_MODE: 'simulated' no llama al backend y sirve para revisar la pantalla.
//   Cuando exista el endpoint se pasa a 'api' y se puede borrar el bloque
//   simulateSession.
const LOGIN_PATH = '/api/auth/login';
const AUTH_MODE = 'simulated';

// Respuesta esperada de LOGIN_PATH. Se leen campos alternativos para no
// depender de un único nombre hasta que el backend fije el contrato.
const normalizeSession = (payload) => ({
  token: payload?.token ?? payload?.accessToken ?? null,
  idUsuario: payload?.idUsuario ?? payload?.id ?? null,
  nombre: payload?.nombre ?? payload?.name ?? '',
});

const SIMULATED_DELAY_MS = 900;
const SIMULATED_SESSION = {
  token: 'simulated-token',
  idUsuario: 1,
  nombre: 'Coordinador invitado',
};

const simulateSession = (email) =>
  new Promise((resolve) => {
    window.setTimeout(() => {
      resolve({ ...SIMULATED_SESSION, email: normalizeEmail(email) });
    }, SIMULATED_DELAY_MS);
  });

const getStatusMessage = (status) => {
  if (status === 400) {
    return 'El correo no es válido para iniciar sesión. Revísalo e inténtalo de nuevo.';
  }

  if (status === 401 || status === 404) {
    return 'No encontramos una cuenta con ese correo. Verifica el correo o crea tu cuenta.';
  }

  if (status >= 500) {
    return 'El servicio no está disponible en este momento. Inténtalo de nuevo en unos minutos.';
  }

  return 'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.';
};

/**
 * Solicita el acceso al workspace. En modo 'api' hace POST a LOGIN_PATH y
 * devuelve la sesión normalizada; los errores llegan como ApiError con un
 * mensaje ya redactado para la persona usuaria.
 */
export const requestLogin = async (email) => {
  if (AUTH_MODE === 'simulated') {
    return simulateSession(email);
  }

  try {
    const response = unwrapData(
      await request(LOGIN_PATH, {
        method: 'POST',
        body: JSON.stringify({ email: normalizeEmail(email) }),
      })
    );

    return normalizeSession(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(
        getStatusMessage(error.status),
        error.status,
        error.details
      );
    }

    throw new ApiError(getStatusMessage(0));
  }
};

// ─── Sesión ────────────────────────────────────────────────────────────────
// Todavía no se guarda nada: no existe token real que persistir. Cuando se
// implemente JWT, estas tres funciones son el único lugar que toca el
// almacenamiento y se conecta con getAuthToken de services/api.js.
export const getToken = () => null;

export const setToken = (token) => token;

export const clearToken = () => null;
