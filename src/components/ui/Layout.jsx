import {
  ChartNoAxesColumnIncreasing,
  House,
  LogOut,
  Plus,
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { api, unwrapData } from '../../services/api';
import { useSession } from '../../providers/session-context';
import logoUrl from '../../img/Logo_h1.png';
import { Button } from './Button';

const navLinkClass =
  'flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 aria-[current=page]:border-accent/30 aria-[current=page]:bg-accent/10 aria-[current=page]:text-accent md:flex-none md:w-full';

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
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  // El token vive en localStorage, así que cerrar sesión es local: alcanza con
  // borrarlo y volver a /login.
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      try {
        const response = unwrapData(await api.listEvents());
        if (isMounted && Array.isArray(response)) {
          setEvents(response);
        }
      } catch {
        if (isMounted) {
          setEvents([]);
        }
      }
    };

    void loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowResults(false);
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const query = search.trim().toLowerCase();
  const matches = query
    ? events.filter((event) =>
        String(event?.nombre ?? event?.name ?? '')
          .toLowerCase()
          .includes(query)
      )
    : [];

  return (
    <div className="min-h-screen bg-canvas text-gray-900">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-accent focus:shadow"
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

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-200 px-4 pt-4 md:mx-6 md:mb-6 md:mt-6 md:flex-col md:items-end">
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
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div ref={searchRef} className="relative w-full sm:max-w-md">
                <label htmlFor="buscar-eventos" className="sr-only">
                  Buscar eventos
                </label>
                <input
                  id="buscar-eventos"
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  placeholder="Buscar eventos..."
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                />
                {showResults && query && (
                  <ul
                    role="listbox"
                    aria-label="Resultados de búsqueda"
                    className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
                  >
                    {matches.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-gray-500">
                        Sin coincidencias
                      </li>
                    ) : (
                      matches.map((event) => {
                        const id = event.id ?? event.idEvento;
                        const name =
                          event.nombre ?? event.name ?? 'Evento sin nombre';
                        return (
                          <li key={id} role="option" aria-selected="false">
                            <Link
                              to={`/evento/${id}`}
                              onClick={() => {
                                setShowResults(false);
                                setSearch('');
                              }}
                              className="block px-3 py-2 text-sm text-gray-700 hover:bg-accent/10 hover:text-accent"
                            >
                              {name}
                            </Link>
                          </li>
                        );
                      })
                    )}
                  </ul>
                )}
              </div>

              <div ref={userMenuRef} className="relative self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((current) => !current)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Menú de usuario"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-accent shadow-sm transition-colors hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="h-6 w-6"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-2 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-accent/10 hover:text-accent"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>

            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
