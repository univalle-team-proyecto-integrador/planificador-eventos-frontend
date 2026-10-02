import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  clearToken,
  getSession,
  isAuthenticated,
  requestLogin,
  requestProfile,
  requestRegister,
} from '../services/authService';
import { onSessionExpired } from '../services/tokenStorage';
import { SessionContext } from './session-context';

/**
 * Sesión de la persona usuaria (US-11).
 *
 * El token lo emite el backend y vive en localStorage; aquí solo se refleja su
 * estado en React para poder proteger las rutas y mostrar el nombre. Un 401 en
 * cualquier llamada dispara onSessionExpired, que limpia la sesión y devuelve
 * a /login sin recargar.
 */
export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState(() => getSession());
  const [isLoading, setIsLoading] = useState(false);

  // Con token guardado pero sin datos de usuario (por ejemplo, una pestaña
  // nueva), se consulta el perfil para completar la sesión.
  useEffect(() => {
    if (!isAuthenticated() || session?.nombre) {
      return;
    }

    let vigente = true;
    requestProfile()
      .then((perfil) => {
        if (vigente) {
          setSession({ ...(session ?? {}), ...perfil });
        }
      })
      .catch(() => {
        // requestProfile ya limpia la sesión si el token no es válido.
        if (vigente) {
          setSession(null);
        }
      });

    return () => {
      vigente = false;
    };
    // Solo al montar: después el estado vive en `session`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () =>
      onSessionExpired(() => {
        setSession(null);
      }),
    []
  );

  const login = useCallback(async (credenciales) => {
    setIsLoading(true);
    try {
      const nueva = await requestLogin(credenciales);
      setSession(nueva);
      return nueva;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (datos) => {
    setIsLoading(true);
    try {
      const nueva = await requestRegister(datos);
      setSession(nueva);
      return nueva;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      usuario: session,
      isAuthenticated: isAuthenticated(),
      isLoading,
      login,
      register,
      logout,
    }),
    [session, isLoading, login, register, logout]
  );

  return <SessionContext value={value}>{children}</SessionContext>;
};
