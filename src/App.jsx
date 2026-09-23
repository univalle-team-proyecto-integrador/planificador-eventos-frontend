import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Button } from './components/Button';
import { CreateEventView } from './views/CreateEventView';

export const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
        {/* Header Global */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">
            Organizador de Eventos
          </h1>
          <nav className="flex gap-2">
            <Link to="/hoy">
              <Button variant="neutral">Hoy</Button>
            </Link>
            <Link to="/crear">
              <Button variant="primary">Crear Evento</Button>
            </Link>
          </nav>
        </header>

        {/* Contenido Principal de Rutas */}
        <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/crear" replace />} />

            <Route 
              path="/hoy" 
              element={
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800">Vista: Gestiones de Hoy (/hoy)</h2>
                  <p className="text-gray-600 mt-2">Próximamente: Lista de prioridades urgentes (T2).</p>
                </div>
              } 
            />

            {/* Componente real renderizado en /crear */}
            <Route path="/crear" element={<CreateEventView />} />

            <Route 
              path="/evento/:id" 
              element={
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800">Vista: Detalle de Evento (/evento/:id)</h2>
                  <p className="text-gray-600 mt-2">Próximamente: Plan de subtareas logísticas (T1/T3).</p>
                </div>
              } 
            />

            <Route 
              path="/progreso" 
              element={
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800">Vista: Progreso (/progreso)</h2>
                  <p className="text-gray-600 mt-2">Próximamente: Barra de progreso general (T4).</p>
                </div>
              } 
            />

            <Route path="*" element={<Navigate to="/crear" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;