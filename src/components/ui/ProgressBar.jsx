/**
 * Barra de avance.
 *
 * `description` es el recuento exacto que acompaña al porcentaje ("6 de 12
 * gestiones (50%)"): el porcentaje solo no dice cuántas cosas faltan, porque
 * "50%" de 2 y de 200 se leen igual. Sin `description` se muestra solo el
 * porcentaje, como antes.
 *
 * El `aria-label` se compone con la descripción para no perder el contexto que
 * quien la usa aporta en `label` ("Carga por horas", "Carga total"): un
 * progressbar que solo dice "50%" no le dice a un lector de pantalla qué se
 * está midiendo.
 */
export function ProgressBar({
  value = 0,
  label = 'Progreso',
  description = '',
  accentColor,
}) {
  const safeValue = Math.min(100, Math.max(0, value));
  const accessibleLabel = description ? `${label}: ${description}` : label;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-secondary-text">{label}</span>
        <span className="font-semibold text-primary-text">
          {description || `${safeValue}%`}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
        role="progressbar"
        aria-label={accessibleLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeValue}
        aria-valuetext={description || `${safeValue}%`}
      >
        <div
          className="h-full rounded-full bg-primary transition-all motion-reduce:transition-none"
          style={{
            width: `${safeValue}%`,
            ...(accentColor ? { backgroundColor: accentColor } : {}),
          }}
        />
      </div>
    </div>
  );
}
