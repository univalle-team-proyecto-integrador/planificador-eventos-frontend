import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChartNoAxesColumnIncreasing, House, Settings, X } from 'lucide-react';
import { lockBodyScroll, trapFocus } from '../../utils/focusTrap';

/**
 * Ítems de la barra lateral.
 *
 * `matches` permite que un solo ítem cubra varias rutas: "Eventos / Progreso"
 * también queda activo al abrir el detalle de un evento, porque ese detalle es
 * un evento. El morado solo aparece en el ítem de la ruta actual.
 */
const NAV_ITEMS = [
  {
    label: 'Hoy',
    to: '/hoy',
    icon: House,
    matches: ['/hoy'],
  },
  {
    label: 'Eventos / Progreso',
    to: '/progreso',
    icon: ChartNoAxesColumnIncreasing,
    matches: ['/progreso', '/evento'],
  },
  {
    label: 'Configuración',
    to: '/configuracion',
    icon: Settings,
    matches: ['/configuracion'],
  },
];

export function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const panelRef = useRef(null);

  const isItemActive = (matches) =>
    matches.some(
      (path) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`)
    );

  // En escritorio la barra siempre está visible y no hace falta atrapar el foco.
  // El drawer y su trampa solo aplican cuando viene del botón hamburguesa.
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const releaseFocus = trapFocus(panelRef.current, { onEscape: onClose });
    const releaseScroll = lockBodyScroll();

    return () => {
      releaseScroll();
      releaseFocus();
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Velo del drawer. En pantalla grande nunca se muestra. */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-[var(--surface-overlay)] md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        ref={panelRef}
        aria-label="Barra lateral de navegación"
        tabIndex={-1}
        className={`fixed inset-y-0 left-0 z-40 w-[250px] shrink-0 border-r border-border bg-surface-raised transition-transform md:sticky md:top-[var(--topbar-height)] md:z-10 md:h-[calc(100vh-var(--topbar-height))] md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col p-4 md:pt-6">
          <div className="flex items-center justify-end md:hidden">
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar el menú de navegación"
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-text transition-[color,background-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:bg-surface-sunken hover:shadow-md hover:text-secondary-text active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>

          <nav
            aria-label="Navegación principal"
            className="flex flex-1 flex-col gap-2 md:mt-2"
          >
            {NAV_ITEMS.map(({ label, to, icon: Icon, matches }) => {
              const isActive = isItemActive(matches);

              return (
                <Link
                  key={to}
                  to={to}
                  onClick={onClose}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-[color,background-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none ${
                    isActive
                      ? 'bg-primary text-primary-contrast'
                      : 'text-secondary-text hover:bg-surface-sunken hover:text-primary-text'
                  }`}
                >
                  <Icon aria-hidden="true" className="size-5 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
