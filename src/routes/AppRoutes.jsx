import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pantallas provisionales para el Sprint 0
const HoyPage = () => (
  <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
    <h1>Vista Hoy (T2)</h1>
    <p>Gestiones urgentes del día que requieren atención inmediata.</p>
    <p>Por este medio se podra ver todas las tareas, que pueden estar vencidas o pendientes</p>
  </div>
);

const CrearPage = () => (
  <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
    <h1>Crear Evento (T1)</h1>
    <p>Formulario para plan de trabajo logístico inicial.</p>
  </div>
);

const DetallePage = () => (
  <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
    <h1>Detalle de Evento (T3)</h1>
    <p>Reprogramación y resolución de conflictos de horas.</p>
  </div>
);

const ProgresoPage = () => (
  <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
    <h1>Progreso del Evento (T4)</h1>
    <p>Barra de avance global de preparativos.</p>
  </div>
);

const LoginPage = () => (
  <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
    <h1>Iniciar Sesión (US-11)</h1>
    <p>Acceso privado para organizadores independientes.</p>
    <p>En esta parte se llevara a cabo lo que es la logación del usuario</p>
  </div>
);

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas principales del MVP */}
        <Route path="/hoy" element={<HoyPage />} />
        <Route path="/crear" element={<CrearPage />} />
        <Route path="/actividad/:id" element={<DetallePage />} />
        <Route path="/progreso" element={<ProgresoPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Redirección por defecto si escriben cualquier otra ruta */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};