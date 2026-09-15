import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HoyPage } from '../pages/HoyPage';
import { CrearPage } from '../pages/CrearPage';
import { DetallePage } from '../pages/DetallePage';
import { ProgresoPage } from '../pages/ProgresoPage';
import { LoginPage } from '../pages/LoginPage';
import { SimulatedLoader } from '../components/SimulatedLoader';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas principales del MVP */}
        <Route
          path="/hoy"
          element={
            <SimulatedLoader>
              <HoyPage />
            </SimulatedLoader>
          }
        />
        <Route
          path="/crear"
          element={
            <SimulatedLoader>
              <CrearPage />
            </SimulatedLoader>
          }
        />
        <Route
          path="/evento/:id"
          element={
            <SimulatedLoader>
              <DetallePage />
            </SimulatedLoader>
          }
        />
        <Route
          path="/progreso"
          element={
            <SimulatedLoader>
              <ProgresoPage />
            </SimulatedLoader>
          }
        />
        <Route
          path="/login"
          element={
            <SimulatedLoader>
              <LoginPage />
            </SimulatedLoader>
          }
        />

        {/* Redirección por defecto si escriben cualquier otra ruta */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
