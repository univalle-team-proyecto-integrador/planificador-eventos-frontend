import { Card } from './Card';

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  variant = 'flat',
  className = '',
}) {
  return (
    <Card as="div" variant={variant} className={`p-4 ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        {Icon && (
          <Icon
            aria-hidden="true"
            className="size-4 shrink-0 text-gray-400"
            strokeWidth={2}
          />
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
        {value}
      </p>
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </Card>
  );
}
