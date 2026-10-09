import { useEffect, useId, useRef } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from './Button';
import { lockBodyScroll, trapFocus } from '../../utils/focusTrap';
import {
  getExceso,
  getHorasTotales,
  getLimiteDiario,
  getMensajeConflicto,
} from '../../utils/reprogramacion';

/**
 * Modal de conflicto de límite diario. Aparece cuando el backend responde
 * `conflicto: true` (docs/contrato-reprogramacion.md): explica cuánto sobra y
 * ofrece corregir las horas o elegir otro día.
 */
export function ConflictoModal({
  open,
  conflicto,
  subtareaTitle = '',
  onAdjust,
  onCancel,
  isSaving = false,
}) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(onCancel);
  const savingRef = useRef(isSaving);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    cancelRef.current = onCancel;
    savingRef.current = isSaving;
  }, [onCancel, isSaving]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const releaseFocus = trapFocus(dialogRef.current, {
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

  const limite = getLimiteDiario(conflicto);
  const total = getHorasTotales(conflicto);
  const exceso = getExceso(conflicto);

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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="w-full max-w-md rounded-lg bg-surface-raised p-6 text-primary-text shadow-xl"
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
            <h2
              id={titleId}
              className="text-lg font-semibold text-primary-text"
            >
              Ese día queda sin espacio
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-secondary-text">
              {getMensajeConflicto(conflicto)}
            </p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-2 rounded-md bg-surface-sunken p-3 text-center">
          <div>
            <dt className="text-xs text-muted-text">Límite diario</dt>
            <dd className="text-lg font-semibold text-primary-text">
              {limite} h
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-text">Quedaría en</dt>
            <dd className="text-lg font-semibold text-primary-text">
              {total} h
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-text">Te pasas por</dt>
            <dd className="text-lg font-semibold text-danger-text">
              {exceso} h
            </dd>
          </div>
        </dl>

        {subtareaTitle && (
          <p className="mt-3 text-xs text-muted-text">
            Gestión sin cambios: “{subtareaTitle}”.
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="neutral"
            onClick={onCancel}
            disabled={isSaving}
          >
            Elegir otro día
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onAdjust}
            disabled={isSaving}
          >
            Ajustar horas
          </Button>
        </div>
      </section>
    </div>
  );
}
