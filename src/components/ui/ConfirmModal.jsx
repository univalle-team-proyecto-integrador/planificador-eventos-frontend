import { useEffect, useId, useRef } from 'react';
import { Button } from './Button';
import { lockBodyScroll, trapFocus } from '../../utils/focusTrap';

export function ConfirmModal({
  open,
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onCancel,
  onConfirm,
  isConfirming = false,
  error = '',
}) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(onCancel);
  const confirmingRef = useRef(isConfirming);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    cancelRef.current = onCancel;
    confirmingRef.current = isConfirming;
  }, [onCancel, isConfirming]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    // Mientras se confirma, Escape y el clic en el fondo se ignoran para que no
    // se cancele a la mitad la operación que ya está en el servidor.
    const releaseFocus = trapFocus(dialogRef.current, {
      onEscape: () => {
        if (!confirmingRef.current) {
          cancelRef.current?.();
        }
      },
    });

    const releaseScroll = lockBodyScroll();

    const handleMouseDown = (event) => {
      if (event.target === event.currentTarget && !confirmingRef.current) {
        cancelRef.current?.();
      }
    };

    const dialog = dialogRef.current;
    dialog?.addEventListener('mousedown', handleMouseDown);

    return () => {
      dialog?.removeEventListener('mousedown', handleMouseDown);
      releaseScroll();
      releaseFocus();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--surface-overlay)] p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !confirmingRef.current) {
          onCancel?.();
        }
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="w-full max-w-md rounded-lg bg-surface-raised p-6 text-primary-text shadow-xl"
      >
        <h2
          id={titleId}
          className="text-xl font-bold text-primary-text mb-2"
        >
          {title}
        </h2>
        <p id={descriptionId} className="text-sm text-secondary-text mb-5">
          {message}
        </p>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-md bg-danger-soft p-3 text-sm text-danger-text"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="neutral"
            onClick={onCancel}
            disabled={isConfirming}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={isConfirming}
            aria-busy={isConfirming}
          >
            {isConfirming ? 'Eliminando...' : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}