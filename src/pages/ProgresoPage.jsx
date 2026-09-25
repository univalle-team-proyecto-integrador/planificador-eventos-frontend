import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { Card } from '../components/ui/Card';
import { EventCard } from '../components/ui/EventCard';
import { WorkloadSummary } from '../components/ui/WorkloadSummary';
import { api, getDefaultUserId, unwrapData } from '../services/api';
import { getTaskMetrics, normalizeSubtask } from '../utils/taskMetrics';

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
      const rawEvents = (Array.isArray(response) ? response : []).filter(
        (event) => event?.id ?? event?.idEvento
      );
      const eventsWithProgress = await Promise.all(
        rawEvents.map(async (rawEvent) => {
          const eventId = rawEvent.id ?? rawEvent.idEvento;
          const subtasksResponse = unwrapData(await api.getSubtasks(eventId));
          const subtasks = (
            Array.isArray(subtasksResponse) ? subtasksResponse : []
          )
            .map(normalizeSubtask)
            .filter((subtask) => subtask.id);
          const metrics = getTaskMetrics(subtasks);

          return {
            ...rawEvent,
            id: eventId,
            ...metrics,
            progress: metrics.progressHours,
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

  const globalMetrics = useMemo(
    () =>
      events.reduce(
        (metrics, event) => ({
          total: metrics.total + (event.total || 0),
          completed: metrics.completed + (event.completed || 0),
          remaining: metrics.remaining + (event.remaining || 0),
          hoursTotal: metrics.hoursTotal + (event.hoursTotal || 0),
          hoursCompleted: metrics.hoursCompleted + (event.hoursCompleted || 0),
          hoursRemaining: metrics.hoursRemaining + (event.hoursRemaining || 0),
        }),
        {
          total: 0,
          completed: 0,
          remaining: 0,
          hoursTotal: 0,
          hoursCompleted: 0,
          hoursRemaining: 0,
        }
      ),
    [events]
  );

  const globalProgress = useMemo(() => {
    if (globalMetrics.hoursTotal === 0) {
      return 0;
    }

    return Math.round(
      (globalMetrics.hoursCompleted / globalMetrics.hoursTotal) * 100
    );
  }, [globalMetrics]);

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
        <>
          <Card aria-labelledby="global-summary-title" className="p-6">
            <div className="mb-5">
              <h3
                id="global-summary-title"
                className="text-lg font-semibold text-gray-900"
              >
                Resumen global
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                El avance se calcula principalmente con las horas estimadas.
              </p>
            </div>
            <WorkloadSummary
              eventCount={events.length}
              progressLabel="Carga total"
              metrics={{ ...globalMetrics, progressHours: globalProgress }}
            />
          </Card>

          <div className="grid gap-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProgresoPage;
