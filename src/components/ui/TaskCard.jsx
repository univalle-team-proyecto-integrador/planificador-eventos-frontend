import { ArrowUpRight, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  formatHours,
  getStateLabel,
  getStateVariant,
  getTaskDate,
  getTaskHours,
} from '../../utils/taskMetrics';
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
  const eventName = task.eventName || `Evento #${eventId}`;
  const taskDate = getTaskDate(task);

  return (
    <Card
      as="li"
      className={`p-4 transition-shadow hover:shadow-md ${
        isOverdue ? 'border-amber-300 bg-amber-50/50' : ''
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
            {eventName}
          </p>
          <h3 className="mt-1 text-base font-semibold text-gray-900">
            {task.title}
          </h3>
          {(dateLabel || isOverdue) && (
            <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
              {isOverdue && (
                <TriangleAlert
                  aria-hidden="true"
                  className="size-4 text-amber-600"
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
              aria-label={`Ver evento ${eventName}`}
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
