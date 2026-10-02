import { useEffect, useRef, useState } from 'react';
import { Button } from './Button';

/**
 * Menú desplegable de filtros.
 *
 * `children` son los campos (selects/inputs) y `activeCount` muestra cuántos
 * filtros están activos. Incluye cierre por Escape o clic fuera y botón
 * "Limpiar filtros".
 */
export function FiltersDropdown({
  label = 'Filtros',
  activeCount = 0,
  onClear,
  children,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="neutral"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        {activeCount > 0 && (
          <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-contrast">
            {activeCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute right-0 z-30 mt-2 w-72 rounded-lg border border-border bg-surface-raised p-4 shadow-lg"
        >
          <div className="space-y-3">{children}</div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="neutral" onClick={onClear}>
              Limpiar filtros
            </Button>
            <Button type="button" variant="primary" onClick={() => setOpen(false)}>
              Aplicar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterField({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-secondary-text">
        {label}
      </span>
      {children}
    </label>
  );
}
