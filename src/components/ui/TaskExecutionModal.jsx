import { useEffect, useId, useRef, useState } from 'react';
import { CalendarClock, CircleCheck } from 'lucide-react';
import { Button } from './Button';
import { lockBodyScroll, trapFocus } from '../../utils/focusTrap';
import {
  ESTADO_EJECUTADA,
  esNotaObligatoria,
  getDescripcionModal,
  getEtiquetaConfirmar,
  getTituloModal,
  validarNota,
} from '../../utils/taskExecution';

/**
 * Modal para registrar una gestión como ejecutada o pospuesta (US-09).
 *
 * No habla con el servidor: valida la nota y entrega `{ estado, nota }` a
 * `onSubmit`, que es quien llama a `PATCH /api/subtareas/{id}/estado`. Así el
 * modal se puede probar entero sin red.
 *
 * La nota va en camelCase (`notaExplicativa`) al serializarse porque así la
 * nombra el DTO del backend; mandarla en snake_case haría que el servidor la
 * ignorara sin avisar.
 *
 * Se monta con `key={subtarea.id}` para que el campo se vacíe sin necesitar un
 * efecto que lo limpie.
 */
export function TaskExecutionModal({
  open,
  subtarea,
  estado,
  onCancel,
  onSubmit,
  isSaving = false,
  serverError = '',
}) {
  const dialogRef = useRef(null);
  const textareaRef = useRef(null);
  const cancelRef = useRef(onCancel);
  const savingRef = useRef(isSaving);
  const titleId = useId();
  const descriptionId = useId();
  const noteId = useId();

  const [nota, setNota] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cancelRef.current = onCancel;
    savingRef.current = isSaving;
  }, [onCancel, isSaving]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const releaseFocus = trapFocus(dialogRef.current, {
      initialFocus: textareaRef.current,
      onEscape: () => {
        if (!savingRef.current) {
          cancelRef.current?.();
        }
      },
    });
    const releaseScroll = lockBodyScroll();

    return () => {
      releaseScroll();
      releaseFocus();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const obligatoria = esNotaObligatoria(estado);
  const Icono = estado === ESTADO_EJECUTADA ? CircleCheck : CalendarClock;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const mensaje = validarNota(nota, estado);

    if (mensaje) {
      setError(mensaje);
      textareaRef.current?.focus();
      return;
    }

    setError('');
    onSubmit?.({ estado, nota: nota.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--surface-overlay)] p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
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
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-text">
            <Icono aria-hidden="true" className="size-6" strokeWidth={2} />
          </span>
          <div className="flex-1">
            <h2 id={titleId} className="text-lg font-semibold">
              {getTituloModal(estado)}
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-secondary-text">
              {subtarea?.title ? `“${subtarea.title}”. ` : ''}
              {getDescripcionModal(estado)}
            </p>
          </div>
        </div>

        {serverError && (
          <p
            role="alert"
            className="mt-4 rounded-md bg-danger-soft p-3 text-sm text-danger-text"
          >
            {serverError}
          </p>
        )}

        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor={noteId}
              className="block text-sm font-medium text-secondary-text"
            >
              Nota explicativa
              {!obligatoria && (
                <span className="ml-1 font-normal text-muted-text">
                  (opcional)
                </span>
              )}
            </label>
            <textarea
              id={noteId}
              ref={textareaRef}
              name="nota"
              rows={3}
              value={nota}
              maxLength={500}
              onChange={(event) => {
                setNota(event.target.value);
                if (error) {
                  setError('');
                }
              }}
              // En un `textarea`, Enter tiene que insertar un salto de línea: si
              // cerrara el formulario, escribir una nota de dos líneas sería
              // imposible. El envío va con Ctrl/Cmd+Enter y con el botón.
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${noteId}-error` : undefined}
              aria-busy={isSaving}
              className="mt-1 w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-primary-text focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            />
            {error ? (
              <p
                id={`${noteId}-error`}
                role="alert"
                className="mt-1 text-xs text-danger-text"
              >
                {error}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-text">
                {obligatoria
                  ? 'El motivo queda guardado en la gestión. Ctrl+Enter para guardar.'
                  : 'Ctrl+Enter para guardar.'}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="neutral"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={estado === ESTADO_EJECUTADA ? 'success' : 'warning'}
              disabled={isSaving}
              aria-busy={isSaving}
            >
              {isSaving ? 'Guardando...' : getEtiquetaConfirmar(estado)}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
