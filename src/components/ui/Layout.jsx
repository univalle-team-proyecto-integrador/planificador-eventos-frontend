import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { api, getDefaultUserId, unwrapData } from '../../services/api';

const UserIcon = () => (
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
);

export const Layout = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      try {
        const response = unwrapData(await api.listEvents(getDefaultUserId()));
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

  const handleLogout = () => {
    setUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-canvas text-gray-900 flex flex-col font-sans">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-accent focus:shadow"
      >
        Saltar al contenido
      </a>

      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm sticky top-0 z-10">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold text-accent m-0">
              <Button
                as={Link}
                to="/hoy"
                variant="primary"
                className="px-0 py-0 shadow-none border-0 hover:bg-transparent hover:text-accent"
              >
                Organizador de Eventos
              </Button>
            </h1>

            <div className="flex flex-1 items-center justify-between gap-3 sm:max-w-xl">
              <div ref={searchRef} className="relative w-full">
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

              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((current) => !current)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Menú de usuario"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-accent shadow-sm transition-colors hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <UserIcon />
                </button>
                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-2 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-accent/10 hover:text-accent"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <nav
            aria-label="Navegación principal"
            className="flex flex-wrap items-center gap-2"
          >
            <Button as={Link} to="/hoy" variant="neutral">
              Hoy
            </Button>
            <Button as={Link} to="/progreso" variant="neutral">
              Progreso
            </Button>
            <Button as={Link} to="/crear" variant="primary">
              Crear Evento
            </Button>
            <Button
              type="button"
              variant="neutral"
              onClick={handleLogout}
              className="ml-auto"
            >
              Cerrar sesión
            </Button>
          </nav>
        </div>
      </header>

      <main id="contenido" className="flex-1 p-6 max-w-5xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
};
