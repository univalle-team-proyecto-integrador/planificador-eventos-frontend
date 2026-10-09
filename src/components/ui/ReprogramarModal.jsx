import { useEffect, useId, useRef, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Button } from './Button';
import { getToday } from '../../utils/dateValidation';
import { focusFirstInvalidField } from '../../utils/formFocus';
import { lockBodyScroll, trapFocus } from '../../utils/focusTrap';
import { validarReprogramacion } from '../../utils/reprogramacion';

/**
 * Modal para reprogramar una gestión: nueva fecha y nuevas horas. No habla con
 * el servidor; valida y entrega el payload a `onSubmit`, que decide si hubo
 * conflicto de límite diario (ver docs/contrato-reprogramacion.md).
 *
 * Se monta con `key={subtarea.id}` para que los campos se inicialicen con los
 * valores de la gestión sin necesidad de un efecto.
 */
export function ReprogramarModal({
  open,
  subtarea,
  onCancel,
  onSubmit,
  isSaving = false,
  serverError = '',
}) {
  const dialogRef = useRef(null);
  const formRef = useRef(null);
  const dateRef = useRef(null);
  const cancelRef = useRef(onCancel);
  const savingRef = useRef(isSaving);
  const titleId = useId();
  const descriptionId = useId();

  const [fecha, setFecha] = useState(() => subtarea?.date ?? '');
  const [horas, setHoras] = useState(() =>
    subtarea?.hours === undefined || subtarea?.hours === null
      ? ''
      : String(subtarea.hours)
  );
  const [errores, setErrores] = useState({});

  const hoy = getToday();

  useEffect(() => {
    cancelRef.current = onCancel;
    savingRef.current = isSaving;
  }, [onCancel, isSaving]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const releaseFocus = trapFocus(dialogRef.current, {
      initialFocus: dateRef.current,
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

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const validacion = validarReprogramacion({ fecha, horas });

    if (Object.keys(validacion).length > 0) {
      setErrores(validacion);
      focusFirstInvalidField(formRef, validacion);
      return;
    }

    setErrores({});
    onSubmit?.({ nuevaFecha: fecha, nuevasHoras: Number(horas) });
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
            <CalendarClock
              aria-hidden="true"
              className="size-6"
              strokeWidth={2}
            />
          </span>
          <div className="flex-1">
            <h2
              id={titleId}
              className="text-lg font-semibold text-primary-text"
            >
              Reprogramar gestión
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-secondary-text">
              Mueve “{subtarea?.title}” a otra fecha y ajusta sus horas. El
              planificador avisa si el día queda por encima de tu límite.
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

        <form
          ref={formRef}
          className="mt-5 space-y-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <div>
            <label
              htmlFor="repro-fecha"
              className="block text-sm font-medium text-secondary-text"
            >
              Nueva fecha
            </label>
            <input
              id="repro-fecha"
              ref={dateRef}
              name="fecha"
              type="date"
              min={hoy}
              value={fecha}
              onChange={(event) => {
                setFecha(event.target.value);
                if (errores.fecha) {
                  setErrores((current) => ({ ...current, fecha: '' }));
                }
              }}
              aria-invalid={Boolean(errores.fecha)}
              aria-describedby={errores.fecha ? 'repro-fecha-error' : undefined}
              className="mt-1 h-10 w-full rounded-md border border-border bg-surface-raised px-3 text-sm text-primary-text focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            />
            {errores.fecha && (
              <p
                id="repro-fecha-error"
                role="alert"
                className="mt-1 text-xs text-danger-text"
              >
                {errores.fecha}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="repro-horas"
              className="block text-sm font-medium text-secondary-text"
            >
              Horas estimadas
            </label>
            <input
              id="repro-horas"
              name="horas"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={horas}
              onChange={(event) => {
                setHoras(event.target.value);
                if (errores.horas) {
                  setErrores((current) => ({ ...current, horas: '' }));
                }
              }}
              aria-invalid={Boolean(errores.horas)}
              aria-describedby={errores.horas ? 'repro-horas-error' : undefined}
              className="mt-1 h-10 w-full rounded-md border border-border bg-surface-raised px-3 text-sm text-primary-text focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            />
            {errores.horas && (
              <p
                id="repro-horas-error"
                role="alert"
                className="mt-1 text-xs text-danger-text"
              >
                {errores.horas}
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
              variant="primary"
              disabled={isSaving}
              aria-busy={isSaving}
            >
              {isSaving ? 'Reprogramando...' : 'Reprogramar'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
