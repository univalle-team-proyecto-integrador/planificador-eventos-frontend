import { Link } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import logoUrlLight from '../../img/Logo_h1.png';
import logoUrlDark from '../../img/Logo_h2.png';
import { Button } from '../ui/Button';
import { SearchBar } from './SearchBar';
import { InfoTip } from './InfoTip';
import { ProfileMenu } from './ProfileMenu';

function useLogoSrc() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [logoSrc, setLogoSrc] = useState(() => prefersDark ? logoUrlDark : logoUrlLight);
  
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e) => setLogoSrc(e.matches ? logoUrlDark : logoUrlLight);
    mq.addEventListener('change', listener);
    return () => window.removeEventListener('change', listener);
  }, [logoUrlLight, logoUrlDark]);
  
  return logoSrc;
}

export function Topbar({ isNavOpen }) {
  const logoSrc = useLogoSrc();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface-raised">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-2 sm:px-6 md:h-[var(--topbar-height)] md:flex-nowrap md:py-0">
        <div className="flex items-center gap-2">
          <Link
            to="/hoy"
            aria-label="Organizador de Eventos, ir a Hoy"
            className="flex items-center gap-2"
          >
            <img
              src={logoSrc}
              alt=""
              className="h-20 w-auto object-contain"
            />
            <span className="hidden sm:block text-sm font-medium text-secondary-text">Organizador de Eventos</span>
          </Link>
        </div>

        <div className="order-2 sm:order-2 w-full sm:max-w-md">
          <SearchBar />
        </div>

        <div className="order-3 sm:order-3 flex shrink-0 items-center gap-2">
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
