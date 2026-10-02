import { Link } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import logoUrl from '../../img/Logo_h1.png';
import { Button } from '../ui/Button';
import { SearchBar } from './SearchBar';
import { InfoTip } from './InfoTip';
import { ProfileMenu } from './ProfileMenu';

/**
 * Barra superior fija.
 *
 * De izquierda a derecha: marca, buscador, y las acciones en el orden pedido —
 * crear evento, tema, información y perfil. El logo vive aquí y ya no se repite
 * en la barra lateral.
 *
 * Responsive: se usa `flex-wrap` con un solo ejemplo del buscador. En móvil cae
 * a su propia fila de ancho completo (`order-last` + `basis-full`) y en
 * escritorio queda en línea entre el logo y las acciones. Así hay un único input
 * en el DOM en lugar de dos, que duplicaría estado y perdería foco al cambiar
 * de tamaño.
 */
export function Topbar({ isNavOpen, onToggleNav }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface-raised">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6 md:h-[var(--topbar-height)] md:flex-nowrap md:py-0">
        <button
          type="button"
          onClick={onToggleNav}
          aria-expanded={isNavOpen}
          aria-label="Abrir el menú de navegación"
          className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-secondary-text transition-[color,background-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:bg-surface-sunken hover:shadow-md active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none md:hidden"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>

        <Link
          to="/hoy"
          aria-label="Organizador de Eventos, ir a Hoy"
          className="flex shrink-0 items-center rounded-md"
        >
          <img
            src={logoUrl}
            alt=""
            className="h-9 w-auto object-contain sm:h-10"
          />
        </Link>

        <div className="mx-auto sm:w-full sm:max-w-md">
className="mx-auto sm:w-full sm:max-w-md"
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            as={Link}
            to="/crear"
            variant="primary"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2"
          >
            <Plus aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">Crear evento</span>
            <span className="sm:hidden">Crear</span>
          </Button>

          <InfoTip text="Información de tu cuenta y ayuda" />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
