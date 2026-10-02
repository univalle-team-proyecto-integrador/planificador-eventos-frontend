import { ArrowUpRight, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  formatHours,
  getStateLabel,
  getStateVariant,
  getTaskDate,
  getTaskHours,
} from '../../utils/taskMetrics';
import { getEventAccent } from '../../utils/eventAccent';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';

export function TaskCard({
  task,
  dateLabel,
  isOverdue = false,
  showState = true,
}) {
  const eventId = task.eventId;
  // Sin nombre de evento no se inventa un "Evento #12": ese numeral solo
  // ocupaba sitio y no decía nada. La línea se omite y queda el título de la
  // tarea, que es lo que importa.
  const eventName = task.eventName;
  const taskDate = getTaskDate(task);
  // Mismo acento por evento que la tarjeta de /progreso, para que una gestión y
  // su evento se lean como el mismo objeto aunque estén en pantallas distintas.
  const accent = getEventAccent(eventId);

  return (
    <Card
      as="li"
      // `event-card` aporta la sombra y el realce del hover. No se declaran aquí
      // `transition-shadow` ni `hover:shadow-md`: `.event-card` va sin capa y
      // manda sobre ellas, así que quedarían como clases muertas.
      className={`event-card p-4 ${
        isOverdue ? 'border-warning bg-warning-soft/50' : ''
      }`}
      style={{ '--accent-glow': accent.glow }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {eventName && (
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-text">
              {eventName}
            </p>
          )}
          <h3 className="mt-1 text-base font-semibold text-primary-text">
            {task.title}
          </h3>
          {(dateLabel || isOverdue) && (
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-text">
              {isOverdue && (
                <TriangleAlert
                  aria-hidden="true"
                  className="size-4 text-warning-text"
                />
              )}
              {dateLabel && <time dateTime={taskDate}>{dateLabel}</time>}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{formatHours(getTaskHours(task))}</Badge>
          {isOverdue && <Badge variant="pending">Atrasada</Badge>}
          {showState && (
            <Badge variant={getStateVariant(task.state)}>
              {getStateLabel(task.state)}
            </Badge>
          )}
          {eventId && (
            <Button
              as={Link}
              to={`/evento/${eventId}`}
              variant="neutral"
              aria-label={eventName ? `Ver evento ${eventName}` : 'Ver evento'}
            >
              <ArrowUpRight aria-hidden="true" className="mr-1 inline size-4" />
              Ver evento
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
