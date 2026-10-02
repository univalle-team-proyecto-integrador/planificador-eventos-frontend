import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from '../layout/Topbar';
import { Sidebar } from '../layout/Sidebar';

/**
 * Shell de la aplicación: barra superior fija + barra lateral.
 *
 * Solo se ocupa del armazón y del drawer móvil. La barra lateral ya no lleva
 * el logo ni el cierre de sesión: el logo está en la barra superior y el cierre
 * de sesión en el menú de perfil.
 */
export const Layout = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const closeNav = useCallback(() => setIsNavOpen(false), []);
  const toggleNav = useCallback(() => setIsNavOpen((open) => !open), []);

  return (
    <div className="min-h-screen bg-surface text-primary-text">
      <a
        href="#contenido"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-brand-text focus:shadow"
      >
        Saltar al contenido
      </a>

      <Topbar isNavOpen={isNavOpen} onToggleNav={toggleNav} />

      <div className="flex min-h-[calc(100vh-var(--topbar-height))]">
        <Sidebar isOpen={isNavOpen} onClose={closeNav} />

        <main
          id="contenido"
          className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10"
        >
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};