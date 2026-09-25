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
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4"
      onMouseDown={handleOverlayClick}
    >
      <section
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="modal-in w-full max-w-md rounded-lg bg-white p-6 shadow-xl focus:outline-none"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <line x1="12" x2="12" y1="9" y2="13" />
              <line x1="12" x2="12.01" y1="17" y2="17" />
            </svg>
          </span>
          <div className="flex-1">
            <h2 id={titleId} className="text-lg font-semibold text-gray-800">
              {title}
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-gray-600">
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
