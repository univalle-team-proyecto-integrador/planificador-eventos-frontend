import { ProgressBar } from './ProgressBar';
import { MetricCard } from './MetricCard';
import { formatHours, formatProgressCount } from '../../utils/taskMetrics';

/**
 * Resumen de carga con la barra de avance.
 *
 * La barra mide HORAS (`progressHours`), así que el texto de la barra cuenta
 * horas completadas sobre el total. Contar tareas ahí daría dos cifras que no
 * miden lo mismo y el número no cuadraría con el ancho de la barra.
 */
export function WorkloadSummary({
  metrics,
  eventCount,
  progressLabel = 'Carga por horas',
  className = '',
  accentColor,
}) {
  const {
    total = 0,
    completed = 0,
    hoursTotal = 0,
    hoursCompleted = 0,
    hoursRemaining = 0,
    progressHours = 0,
  } = metrics || {};

  const description = `${formatProgressCount(hoursCompleted, hoursTotal, 'hora', 'horas')} (${progressHours}%)`;

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      <div
        className={`grid grid-cols-2 gap-3 ${eventCount === undefined
            ? 'sm:grid-cols-4'
            : 'sm:grid-cols-3 lg:grid-cols-5'
          }`}
      >
        {eventCount !== undefined && (
          <MetricCard label="Eventos" value={eventCount} />
        )}
        <MetricCard label="Horas estimadas de trabajo" value={formatHours(hoursTotal)} />
        <MetricCard
          label="Horas completadas"
          value={formatHours(hoursCompleted)}
        />
        <MetricCard
          label="Horas restantes"
          value={formatHours(hoursRemaining)}
        />
        <MetricCard
          label="Tareas"
          value={`${completed} / ${total}`}
          helper="completadas"
        />
      </div>
      <ProgressBar
        value={progressHours}
        label={progressLabel}
        description={description}
        accentColor={accentColor}
      />
      <p className="text-xs text-muted-text">
        {formatHours(hoursCompleted)} completadas ·{' '}
        {formatHours(hoursRemaining)} restantes · {formatHours(hoursTotal)}{' '}
        estimadas de trabajo
      </p>
    </div>
  );
}
