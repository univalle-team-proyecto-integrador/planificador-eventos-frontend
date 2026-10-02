import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const toDateKey = (date) => {
  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return local.toISOString().slice(0, 10);
};

const formatLongDate = (dateKey) => {
  if (!dateKey) {
    return '';
  }

  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export function CalendarModal({ open, onClose, tasksByDate }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    previousFocusRef.current = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.querySelector('button, [href]')?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < offset; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  const monthLabel = viewDate.toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
  });

  const selectedTasks = selectedDate
    ? tasksByDate.get(selectedDate) ?? []
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-xl rounded-lg bg-surface-raised p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="text-xl font-bold text-primary">
            Calendario de gestiones
          </h2>
          <Button type="button" variant="neutral" onClick={onClose}>
            Cerrar
          </Button>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <Button
            type="button"
            variant="neutral"
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            aria-label="Mes anterior"
          >
            ←
          </Button>
          <p className="text-sm font-semibold capitalize text-secondary-text">
            {monthLabel}
          </p>
          <Button
            type="button"
            variant="neutral"
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            aria-label="Mes siguiente"
          >
            →
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-text">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((date, index) => {
            if (!date) {
              return <span key={`empty-${index}`} />;
            }

            const key = toDateKey(date);
            const hasTasks = tasksByDate.has(key);
            const isSelected = key === selectedDate;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(key)}
                aria-pressed={isSelected}
                aria-label={`${formatLongDate(key)}${hasTasks ? ', con gestiones' : ''}`}
                className={`relative h-10 rounded-md text-sm transition-colors ${
                  isSelected
                    ? 'bg-accent text-white'
                    : hasTasks
                      ? 'bg-brand/20 font-semibold text-primary hover:bg-accent/30'
                      : 'text-muted-text hover:bg-gray-100'
                }`}
              >
                {date.getDate()}
                {hasTasks && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 border-t pt-4">
          <h3 className="text-sm font-semibold text-secondary-text">
            {selectedDate
              ? `Gestiones del ${formatLongDate(selectedDate)}`
              : 'Selecciona un día marcado'}
          </h3>
          {selectedDate && selectedTasks.length === 0 && (
            <p className="mt-2 text-sm text-muted-text">
              No hay gestiones para este día.
            </p>
          )}
          <ul className="mt-2 space-y-1">
            {selectedTasks.map((task) => (
              <li key={`${task.id}-${task.eventId}`}>
                <Link
                  to={`/evento/${task.eventId}`}
                  className="block rounded-md px-2 py-1.5 text-sm text-secondary-text hover:bg-accent/10 hover:text-accent"
                >
                  {task.title} · {task.eventName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
