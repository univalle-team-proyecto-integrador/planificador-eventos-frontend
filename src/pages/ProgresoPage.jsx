import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { EventCard } from '../components/ui/EventCard';
import { api, getDefaultUserId, unwrapData } from '../services/api';

const getErrorMessage = (error) =>
  error?.message || 'No pudimos consultar el progreso de los eventos.';

export const ProgresoPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = unwrapData(await api.listEvents(getDefaultUserId()));
      const rawEvents = Array.isArray(response) ? response : [];
      const eventsWithProgress = await Promise.all(
        rawEvents.map(async (rawEvent) => {
          const eventId = rawEvent.id ?? rawEvent.idEvento;
          const subtasksResponse = unwrapData(await api.getSubtasks(eventId));
          const subtasks = Array.isArray(subtasksResponse)
            ? subtasksResponse
            : [];
          const completed = subtasks.filter(
            (subtask) => (subtask.estado ?? subtask.state) === 'ejecutada'
          ).length;

          return {
            ...rawEvent,
            id: eventId,
            total: subtasks.length,
            completed,
            progress: subtasks.length
              ? Math.round((completed / subtasks.length) * 100)
              : 0,
          };
        })
      );

      setEvents(eventsWithProgress);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // La vista consulta la lista de eventos al montarse.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadEvents();
  }, [loadEvents]);

  if (isLoading) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center text-gray-600"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        Consultando el progreso...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState
          title="No pudimos consultar el progreso"
          message={error}
          onRetry={() => void loadEvents()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
          Seguimiento
        </p>
        <h2 className="text-3xl font-bold text-gray-900">
          Progreso del evento
        </h2>
        <p className="mt-2 max-w-2xl text-gray-600">
          Consulta aquí el avance de los preparativos de cada evento.
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="Aún no hay eventos para mostrar"
          description="Crea tu primer evento para comenzar a organizar sus preparativos y subtareas."
          actionLabel="Crear evento"
          onAction={() => navigate('/crear')}
        />
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};
