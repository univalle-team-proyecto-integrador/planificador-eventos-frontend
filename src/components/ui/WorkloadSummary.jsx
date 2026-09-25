import { ProgressBar } from './ProgressBar';
import { MetricCard } from './MetricCard';
import { formatHours } from '../../utils/taskMetrics';

export function WorkloadSummary({
  metrics,
  eventCount,
  progressLabel = 'Carga por horas',
  className = '',
}) {
  const {
    total = 0,
    completed = 0,
    hoursTotal = 0,
    hoursCompleted = 0,
    hoursRemaining = 0,
    progressHours = 0,
  } = metrics || {};

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      <div
        className={`grid grid-cols-2 gap-3 ${
          eventCount === undefined
            ? 'sm:grid-cols-4'
            : 'sm:grid-cols-3 lg:grid-cols-5'
        }`}
      >
        {eventCount !== undefined && (
          <MetricCard label="Eventos" value={eventCount} />
        )}
        <MetricCard label="Horas estimadas" value={formatHours(hoursTotal)} />
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
      <ProgressBar value={progressHours} label={progressLabel} />
      <p className="text-xs text-gray-500">
        {formatHours(hoursCompleted)} completadas ·{' '}
        {formatHours(hoursRemaining)} restantes · {formatHours(hoursTotal)}{' '}
        estimadas
      </p>
    </div>
  );
}
