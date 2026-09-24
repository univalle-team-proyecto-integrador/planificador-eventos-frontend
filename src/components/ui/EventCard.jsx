import { Link } from 'react-router-dom';
import { Button } from './Button';
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
  const progress = event.progress ?? 0;
  const completed = event.completed ?? 0;
  const total = event.total ?? 0;

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase text-blue-600">
            Evento #{id}
          </span>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{name}</h3>
          <p className="mt-1 text-sm text-gray-600">
            {client} · {formatDate(event.fechaEvento ?? event.date)}
          </p>
          <p className="mt-1 text-xs text-gray-500">{location}</p>
        </div>
        <Button as={Link} to={`/evento/${id}`} variant="neutral">
          Ver plan
        </Button>
      </div>
      <div className="mt-5">
        <ProgressBar value={progress} label="Progreso logístico" />
        <p className="mt-2 text-xs text-gray-500">
          {total === 0
            ? 'Aún no hay subtareas registradas.'
            : `${completed} de ${total} gestiones completadas.`}
        </p>
      </div>
    </article>
  );
}
