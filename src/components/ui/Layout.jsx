import {
  ChartNoAxesColumnIncreasing,
  House,
  LogOut,
  Plus,
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../../providers/session-context';
import logoUrl from '../../img/Logo_h1.png';
import { Button } from './Button';

const navLinkClass =
  'flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 aria-[current=page]:border-blue-200 aria-[current=page]:bg-blue-50 aria-[current=page]:text-blue-700 md:flex-none md:w-full';

const isCurrentPath = (pathname, target) =>
  pathname === target || pathname.startsWith(`${target}/`);

const getInitials = (nombre) =>
  String(nombre ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? '')
    .join('') || 'EV';

export const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useSession();

  // El token vive en localStorage, así que cerrar sesión es local: alcanza con
  // borrarlo y volver a /login.
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

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
              <House aria-hidden="true" className="mr-2 inline size-4" />
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
              <ChartNoAxesColumnIncreasing
                aria-hidden="true"
                className="mr-2 inline size-4"
              />
              Progreso
            </Button>

            <div className="hidden border-t border-gray-200 pt-4 md:block">
              <Button
                as={NavLink}
                to="/crear"
                variant="primary"
                className="w-full rounded-full px-5 py-3 text-center"
              >
                <Plus aria-hidden="true" className="mr-2 inline size-4" />
                Crear Evento
              </Button>
            </div>
            <Button
              as={NavLink}
              to="/crear"
              variant="primary"
              className="flex-1 rounded-full px-4 py-3 text-center md:hidden"
            >
              <Plus aria-hidden="true" className="mr-2 inline size-4" />
              Crear Evento
            </Button>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-200 px-4 pt-4 md:mx-6 md:mb-6 md:mt-6 md:flex-col md:items-stretch">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-xs font-bold text-[#3323CC]"
                >
                  {getInitials(usuario?.nombre)}
                </span>
                <div className="min-w-0 md:hidden">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {usuario?.nombre || 'Invitado'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="neutral"
                className="flex items-center justify-center rounded-full px-4 py-2 text-sm md:justify-start"
              >
                <LogOut aria-hidden="true" className="mr-2 inline size-4" />
                Cerrar sesión
              </Button>
            </div>
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
