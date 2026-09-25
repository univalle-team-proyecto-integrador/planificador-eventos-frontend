import { Link, Outlet } from 'react-router-dom';
import { Button } from './Button';

export const Layout = () => {
  return (

    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col md:flex-row font-sans">


      <aside className="w-full bg-white border-b border-gray-200 p-4 flex flex-col gap-4 shadow-sm z-10 md:w-64 md:min-h-screen md:border-b-0 md:border-r md:p-6 md:gap-8 md:sticky md:top-0 md:shrink-0">


        <div className="flex items-center justify-between md:justify-center">
          <h1 className="m-0 flex items-center">
            <Link to="/hoy" className="inline-block">
              <img
                src="/src/img/Logo_h1.png"
                alt="Organizador de Eventos"

                className="h-12 w-auto object-contain hover:opacity-90 transition-opacity md:h-20"
              />
            </Link>
          </h1>
        </div>


        <nav aria-label="Navegación principal" className="flex flex-row flex-wrap gap-2 md:flex-col md:gap-3">
          <Button
            as={Link}
            to="/hoy"
            variant="neutral"
            className="flex-1 md:flex-none md:w-full text-center md:text-left md:justify-start"
          >
            Hoy
          </Button>
          <Button
            as={Link}
            to="/progreso"
            variant="neutral"
            className="flex-1 md:flex-none md:w-full text-center md:text-left md:justify-start"
          >
            Progreso
          </Button>
          <Button
            as={Link}
            to="/crear"
            variant="primary"
            className="w-full md:w-full text-center md:text-left md:justify-start md:mt-2"
          >
            Crear Evento
          </Button>
        </nav>
      </aside>


      <main id="contenido" className="flex-1 p-4 md:p-8 max-w-6xl w-full">
        <Outlet />
      </main>
    </div>
  );
};