import { Link, Outlet } from 'react-router-dom';
import { Button } from './Button';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-blue-700 focus:shadow"
      >
        Saltar al contenido
      </a>

      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-blue-600 m-0">
          <Button
            as={Link}
            to="/hoy"
            variant="primary"
            className="px-0 py-0 shadow-none border-0 hover:bg-transparent hover:text-blue-800"
          >
            Organizador de Eventos
          </Button>
        </h1>

        <nav aria-label="Navegación principal" className="flex flex-wrap gap-2">
          <Button as={Link} to="/hoy" variant="neutral">
            Hoy
          </Button>
          <Button as={Link} to="/progreso" variant="neutral">
            Progreso
          </Button>
          <Button as={Link} to="/crear" variant="primary">
            Crear Evento
          </Button>
        </nav>
      </header>

      <main id="contenido" className="flex-1 p-6 max-w-5xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
};
