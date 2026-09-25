import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import logoUrl from '../../img/Logo_h1.png';
import { Button } from './Button';

const navLinkClass =
  'flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 aria-[current=page]:border-blue-200 aria-[current=page]:bg-blue-50 aria-[current=page]:text-blue-700 md:flex-none md:w-full';

const isCurrentPath = (pathname, target) =>
  pathname === target || pathname.startsWith(`${target}/`);

export const Layout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-blue-700 focus:shadow"
      >
        Saltar al contenido
      </a>

      <div className="flex min-h-screen flex-col md:flex-row">
        <aside
          aria-label="Barra lateral de navegación"
          className="w-full border-b border-gray-200 bg-[#F7F8FA] md:sticky md:top-0 md:flex md:min-h-screen md:w-[250px] md:shrink-0 md:flex-col md:border-b-0 md:border-r"
        >
          <div className="flex items-center justify-between px-4 py-4 md:justify-center md:px-6 md:py-7">
            <h1 className="sr-only">Organizador de Eventos</h1>
            <Link to="/hoy" aria-label="Ir al panel de hoy">
              <img
                src={logoUrl}
                alt="Organizador de Eventos"
                className="h-12 w-auto object-contain transition-opacity hover:opacity-90 md:h-16"
              />
            </Link>
          </div>

          <nav
            aria-label="Navegación principal"
            className="flex flex-row gap-2 px-4 pb-4 md:mt-4 md:flex-col md:gap-4 md:px-6 md:pb-6"
          >
            <Button
              as={NavLink}
              to="/hoy"
              variant="neutral"
              className={navLinkClass}
              aria-current={
                isCurrentPath(location.pathname, '/hoy') ? 'page' : undefined
              }
            >
              Hoy
            </Button>
            <Button
              as={NavLink}
              to="/progreso"
              variant="neutral"
              className={navLinkClass}
              aria-current={
                isCurrentPath(location.pathname, '/progreso')
                  ? 'page'
                  : undefined
              }
            >
              Progreso
            </Button>

            <div className="hidden border-t border-gray-200 pt-4 md:block">
              <Button
                as={NavLink}
                to="/crear"
                variant="primary"
                className="w-full rounded-full px-5 py-3 text-center"
              >
                Crear Evento
              </Button>
            </div>
            <Button
              as={NavLink}
              to="/crear"
              variant="primary"
              className="flex-1 rounded-full px-4 py-3 text-center md:hidden"
            >
              Crear Evento
            </Button>
          </nav>
        </aside>

        <main
          id="contenido"
          className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10"
        >
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
