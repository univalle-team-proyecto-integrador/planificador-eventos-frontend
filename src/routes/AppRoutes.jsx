import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/ui/Layout';
import { useSession } from '../providers/session-context';

const HoyPage = lazy(() => import('../pages/HoyPage'));
const CrearPage = lazy(() => import('../pages/CrearPage'));
const DetallePage = lazy(() => import('../pages/DetallePage'));
const ProgresoPage = lazy(() => import('../pages/ProgresoPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const ConfiguracionPage = lazy(() => import('../pages/ConfiguracionPage'));

const RouteLoader = () => (
  <div
    className="flex min-h-[50vh] flex-col items-center justify-center"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <span
      className="w-9 h-9 animate-spin rounded-full border-4 border-[#e5e4e7]"
      style={{ borderTopColor: '#2563eb' }}
      aria-hidden="true"
    />
    <span className="sr-only">Cargando contenido</span>
  </div>
);

// US-11: sin token no se entra al panel. El backend responde 401 a /api/subtareas,
// pero redirigir aquí evita mostrar la vista vacía y un error por cada llamada.
const RequireSession = ({ children }) => {
  const { isAuthenticated } = useSession();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Al revés: quien ya tiene sesión no necesita ver login ni registro.
const RedirectIfAuthenticated = ({ children }) => {
  const { isAuthenticated } = useSession();

  if (isAuthenticated) {
    return <Navigate to="/hoy" replace />;
  }

  return children;
};

export const AppRoutes = () => (
  <BrowserRouter>
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route
          path="/login"
          element={
            <RedirectIfAuthenticated>
              <LoginPage />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          path="/registro"
          element={
            <RedirectIfAuthenticated>
              <RegisterPage />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          element={
            <RequireSession>
              <Layout />
            </RequireSession>
          }
        >
          <Route path="/" element={<Navigate to="/hoy" replace />} />
          <Route path="/hoy" element={<HoyPage />} />
          <Route path="/crear" element={<CrearPage />} />
          <Route path="/evento/:id" element={<DetallePage />} />
          <Route path="/progreso" element={<ProgresoPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route path="*" element={<Navigate to="/hoy" replace />} />
        </Route>
      </Routes>
    </Suspense>
  </BrowserRouter>
);
