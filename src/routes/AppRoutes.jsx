import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/ui/Layout';
import { SimulatedLoader } from '../components/states/SimulatedLoader';
import { HoyPage } from '../pages/HoyPage';
import { CrearPage } from '../pages/CrearPage';
import { DetallePage } from '../pages/DetallePage';
import { ProgresoPage } from '../pages/ProgresoPage';
import { LoginPage } from '../pages/LoginPage';

const withLoader = (element, label) => (
  <SimulatedLoader label={label}>{element}</SimulatedLoader>
);

export const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/hoy" replace />} />
        <Route
          path="/hoy"
          element={withLoader(<HoyPage />, 'Cargando el panel de hoy')}
        />
        <Route
          path="/crear"
          element={withLoader(<CrearPage />, 'Cargando el formulario')}
        />
        <Route
          path="/evento/:id"
          element={withLoader(<DetallePage />, 'Cargando el evento')}
        />
        <Route
          path="/progreso"
          element={withLoader(<ProgresoPage />, 'Cargando el progreso')}
        />
        <Route
          path="/login"
          element={withLoader(<LoginPage />, 'Cargando el acceso')}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
