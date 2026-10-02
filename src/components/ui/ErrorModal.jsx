import { TriangleAlert } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { Button } from './Button';

export function ErrorModal({
  open,
  title = 'No pudimos completar la acción',
  message = 'Revisa la información e inténtalo de nuevo.',
  onClose,
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    previousFocusRef.current = document.activeElement;
    dialogRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      closeRef.current?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--surface-overlay)] p-4"
      onMouseDown={handleOverlayClick}
    >
      <section
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="modal-in w-full max-w-md rounded-lg bg-surface-raised p-6 shadow-xl focus:outline-none"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning-text">
            <TriangleAlert
              aria-hidden="true"
              className="size-6"
              strokeWidth={2}
            />
          </span>
          <div className="flex-1">
            <h2 id={titleId} className="text-lg font-semibold text-primary-text">
              {title}
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-secondary-text">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" variant="primary" onClick={onClose}>
            Entendido
          </Button>
        </div>
      </section>
    </div>
  );
}
