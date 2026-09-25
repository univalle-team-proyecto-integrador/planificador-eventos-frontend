import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getEventAccent } from '../../utils/eventAccent';
import { formatHours } from '../../utils/taskMetrics';
import { Button } from './Button';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';

const formatDate = (value) => {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
};

export function EventCard({ event }) {
  const id = event.id ?? event.idEvento;
  const name = event.nombre ?? event.name ?? 'Evento sin nombre';
  const client = event.cliente ?? event.client ?? 'Sin cliente';
  const location = event.lugar ?? event.location ?? 'Sin lugar';
  const progress = event.progress ?? event.progressHours ?? 0;
  const completed = event.completed ?? 0;
  const total = event.total ?? 0;
  const hoursTotal = event.hoursTotal ?? 0;
  const hoursCompleted = event.hoursCompleted ?? 0;
  const hoursRemaining = event.hoursRemaining ?? 0;
  const accent = getEventAccent(id);

  return (
    <Card
      as="article"
      className="event-card p-5"
      style={{
        '--accent': accent.hex,
        '--accent-soft': accent.soft,
        '--accent-glow': accent.glow,
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span
            className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase"
            style={{ backgroundColor: accent.soft, color: accent.hex }}
          >
            Evento #{id}
          </span>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{name}</h3>
          <p className="mt-1 text-sm text-gray-600">
            {client} · {formatDate(event.fechaEvento ?? event.date)}
          </p>
          <p className="mt-1 text-xs text-gray-500">{location}</p>
        </div>
        <Button
          as={Link}
          to={`/evento/${id}`}
          variant="neutral"
          aria-label={`Ver evento ${name}`}
        >
          <ArrowUpRight aria-hidden="true" className="mr-1 inline size-3.5" />
          Ver evento
        </Button>
      </div>
      <div className="mt-5">
        <ProgressBar
          value={progress}
          label="Progreso por horas"
          accentColor={accent.hex}
        />
        <p className="mt-2 text-xs text-gray-500">
          {total === 0
            ? 'Aún no hay subtareas registradas.'
            : `${completed} de ${total} tareas · ${formatHours(hoursCompleted)} completadas · ${formatHours(hoursRemaining)} restantes`}
        </p>
        {total > 0 && (
          <p className="mt-1 text-xs text-gray-400">
            {formatHours(hoursTotal)} estimadas en total
          </p>
        )}
      </div>
    </Card>
  );
}
