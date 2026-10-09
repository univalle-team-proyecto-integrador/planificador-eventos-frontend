import { useCallback, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Info, LogOut } from 'lucide-react';
import { useSession } from '../../providers/session-context';
import { useClickOutside } from '../../hooks/useClickOutside';
import { ThemeToggle } from './ThemeToggle';

/** Iniciales para el círculo del avatar: hasta dos letras del nombre real. */
const getInitials = (nombre) =>
  String(nombre ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? '')
    .join('') || 'EV';

/**
 * Menú de perfil: identidad de la persona y cierre de sesión.
 *
 * El nombre sale de la sesión (`useSession`), nunca de un valor fijo en el
 * código: `session.nombre` viene del registro o de `GET /api/users/profile`.
 * El menú usa el patrón `role="menu"`, se cierra con clic afuera y con Escape,
 * y devuelve el foco al botón para no perder el hilo con el teclado.
 */
export function ProfileMenu() {
  const { usuario, logout } = useSession();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [infoAbierta, setInfoAbierta] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuId = useId();

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  // El clic afuera cierra sin devolver el foco: la persona ya lo movió a otro
  // sitio y steal no debe arrastrarlo de vuelta.
  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  const handleLogout = () => {
    // El token vive en localStorage: cerrar sesión es local, alcanza con
    // borrarlo y volver al acceso.
    setIsOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const nombre = usuario?.nombre;

  return (
    <div
      ref={containerRef}
      className="relative shrink-0"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          event.stopPropagation();
          close();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface-raised py-1 pl-1 pr-2 transition-[color,background-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:bg-surface-sunken hover:shadow-md active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none"
      >
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-contrast"
        >
          {getInitials(nombre)}
        </span>
        <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-primary-text sm:inline">
          {nombre || 'Invitado'}
        </span>
        <ChevronDown aria-hidden="true" className="size-4 text-muted-text" />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label="Menú de perfil"
          className="dropdown-in absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-lg border border-border bg-surface-raised shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-primary-text">
              {nombre || 'Invitado'}
            </p>
            {usuario?.email && (
              <p className="truncate text-xs text-muted-text">
                {usuario.email}
              </p>
            )}
          </div>

          {/* El interruptor de tema vive aquí y no suelto en la barra superior:
              la barra superior es para acciones del trabajo y este control es
              parte de las preferencias de la cuenta. */}
          <div className="border-b border-border px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-text">
              Apariencia
            </p>
            <ThemeToggle className="w-full justify-between" />
          </div>

          {/* La información y ayuda vive aquí y no suelta en la barra superior:
              igual que el tema, es parte de las preferencias de la cuenta. Se
              expande dentro del propio menú. */}
          <div className="border-b border-border">
            <button
              type="button"
              role="menuitem"
              aria-expanded={infoAbierta}
              onClick={() => setInfoAbierta((abierta) => !abierta)}
              className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-secondary-text transition-colors hover:bg-surface-sunken hover:text-primary-text"
            >
              <Info aria-hidden="true" className="size-4" />
              Información y ayuda
              <ChevronDown
                aria-hidden="true"
                className={`ml-auto size-4 transition-transform ${infoAbierta ? 'rotate-180' : ''}`}
              />
            </button>

            {infoAbierta && (
              <p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-secondary-text">
                Información de tu cuenta y ayuda.
              </p>
            )}
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-secondary-text transition-colors hover:bg-surface-sunken hover:text-primary-text"
          >
            <LogOut aria-hidden="true" className="size-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
