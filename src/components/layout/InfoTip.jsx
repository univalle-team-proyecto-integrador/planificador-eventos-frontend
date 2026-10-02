import { useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';

/**
 * Ícono de información con un texto corto de ayuda.
 *
 * Se abre al hacer clic y también al recibir foco, para que quien navega solo
 * con teclado llegue igual. Se cierra con Escape y al perder el foco, y el
 * `aria-expanded` + `aria-controls` mantienen la relación entre botón y texto.
 */
export function InfoTip({ text, label = 'Información de tu cuenta y ayuda' }) {
  const [isOpen, setIsOpen] = useState(false);
  const tipId = useId();
  const containerRef = useRef(null);

  const close = () => setIsOpen(false);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative shrink-0"
      onKeyDown={handleKeyDown}
      onFocus={() => setIsOpen(true)}
      onBlur={(event) => {
        // Se cierra al salir del conjunto botón + texto, no antes.
        if (!containerRef.current?.contains(event.relatedTarget)) {
          close();
        }
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        aria-describedby={isOpen ? tipId : undefined}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-text transition-[color,background-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:bg-surface-sunken hover:shadow-md hover:text-secondary-text active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none"
      >
        <Info aria-hidden="true" className="size-5" />
      </button>

      {isOpen && (
        <p
          id={tipId}
          role="tooltip"
          className="dropdown-in absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-surface-raised p-3 text-xs text-secondary-text shadow-lg"
        >
          {text ?? label}
        </p>
      )}
    </div>
  );
}
