import { useEffect, useId, useRef } from 'react';
import { Button } from './Button';

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

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
  const previousFocusRef = useRef(null);
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

    previousFocusRef.current = document.activeElement;
    const dialog = dialogRef.current;
    const focusableElements = dialog?.querySelectorAll(focusableSelector);
    const firstFocusable = focusableElements?.[0];

    (firstFocusable || dialog)?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !confirmingRef.current) {
        event.preventDefault();
        cancelRef.current?.();
        return;
      }

      if (event.key !== 'Tab' || !dialog) {
        return;
      }

      const elements = Array.from(
        dialog.querySelectorAll(focusableSelector)
      ).filter((element) => !element.hasAttribute('disabled'));

      if (elements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleMouseDown = (event) => {
      if (event.target === event.currentTarget && !confirmingRef.current) {
        cancelRef.current?.();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    dialog?.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      dialog?.removeEventListener('mousedown', handleMouseDown);
      previousFocusRef.current?.focus?.();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
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
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id={titleId} className="text-xl font-bold text-gray-900 mb-2">
          {title}
        </h2>
        <p id={descriptionId} className="text-sm text-gray-600 mb-5">
          {message}
        </p>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
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
