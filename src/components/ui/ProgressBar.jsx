export function ProgressBar({ value = 0, label = 'Progreso', accentColor }) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-secondary-text">{label}</span>
        <span className="font-semibold text-primary-text">{safeValue}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeValue}
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{
            width: `${safeValue}%`,
            ...(accentColor ? { backgroundColor: accentColor } : {}),
          }}
        />
      </div>
    </div>
  );
}
