import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/ui/Layout';

const HoyPage = lazy(() => import('../pages/HoyPage'));
const CrearPage = lazy(() => import('../pages/CrearPage'));
const DetallePage = lazy(() => import('../pages/DetallePage'));
const ProgresoPage = lazy(() => import('../pages/ProgresoPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));

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

export const AppRoutes = () => (
  <BrowserRouter>
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/hoy" replace />} />
          <Route path="/hoy" element={<HoyPage />} />
          <Route path="/crear" element={<CrearPage />} />
          <Route path="/evento/:id" element={<DetallePage />} />
          <Route path="/progreso" element={<ProgresoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </Suspense>
  </BrowserRouter>
);
