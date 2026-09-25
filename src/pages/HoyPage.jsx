import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { Button } from '../components/ui/Button';
import { api, getDefaultUserId, unwrapData } from '../services/api';

const getToday = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  if (!value) {
    return 'Sin fecha';
  }

  const stringValue = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(stringValue)
    ? new Date(`${stringValue}T00:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return stringValue;
  }

  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatTodayLabel = (value) => {
  const formattedDate = formatDate(value);
  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};

const normalizeTask = (payload) => ({
  id: payload?.id ?? payload?.idSubtarea,
  eventId: payload?.idEvento,
  title: payload?.nombreGestion ?? payload?.title ?? payload?.name ?? '',
  hours: payload?.horasEstimadas ?? payload?.hours ?? '',
  date: payload?.fechaObjetivo ?? payload?.date ?? '',
  state: payload?.estado ?? payload?.state ?? 'pendiente',
});

const getStateLabel = (state) => {
  const labels = {
    pendiente: 'Pendiente',
    ejecutada: 'Completada',
    pospuesta: 'Pospuesta',
  };

  return labels[state] || 'Pendiente';
};

const getErrorMessage = (error) =>
  error?.message ||
  'No pudimos cargar las gestiones de hoy. Inténtalo de nuevo.';

export const HoyPage = () => {
  const navigate = useNavigate();
  const [today] = useState(getToday);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadToday = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const userId = getDefaultUserId();
      const [tasksResponse, eventsResponse] = await Promise.all([
        api.listTodaySubtasks(userId, today),
        api.listEvents(userId),
      ]);
      const rawTasks = unwrapData(tasksResponse);
      const rawEvents = unwrapData(eventsResponse);
      const eventNames = new Map(
        (Array.isArray(rawEvents) ? rawEvents : []).map((event) => [
          String(event?.id ?? event?.idEvento),
          event?.nombre ?? event?.name ?? 'Evento sin nombre',
        ])
      );

      setTasks(
        (Array.isArray(rawTasks) ? rawTasks : [])
          .map(normalizeTask)
          .filter((task) => task.id && task.eventId)
          .map((task) => ({
            ...task,
            eventName:
              eventNames.get(String(task.eventId)) ?? `Evento #${task.eventId}`,
          }))
      );
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [today]);

  useEffect(() => {
    // La vista consulta las gestiones cuya fecha objetivo corresponde a hoy.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadToday();
  }, [loadToday]);

  if (isLoading) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center text-gray-600"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        Cargando gestiones de hoy...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState
          title="No pudimos cargar las gestiones de hoy"
          message={error}
          onRetry={() => void loadToday()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="today-title"
        className="overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
              Panel del día
            </p>
            <h2 id="today-title" className="text-3xl font-bold text-gray-900">
              Gestiones de hoy
            </h2>
          </div>

          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <svg
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M7 3v3m10-3v3M4 9h16" />
              <rect x="4" y="5" width="16" height="16" rx="2" />
              <path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" />
            </svg>
          </div>
        </div>

        <div className="mt-5 border-t border-blue-100 pt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            Fecha de hoy
          </p>
          <time
            dateTime={today}
            className="mt-1 block text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
          >
            {formatTodayLabel(today)}
          </time>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-gray-700 sm:text-base">
            Revisa las tareas pendientes y pospuestas que tienen como fecha
            objetivo hoy.
          </p>
        </div>
      </section>

      {tasks.length === 0 ? (
        <EmptyState
          title="Aún no hay gestiones para hoy"
          description="Cuando agregues una gestión con la fecha de hoy, aparecerá aquí para que puedas seguirla."
          actionLabel="Crear tu primer evento"
          onAction={() => navigate('/crear')}
        />
      ) : (
        <ul
          className="space-y-3"
          aria-live="polite"
          aria-label="Gestiones de hoy"
        >
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {task.eventName}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">
                  {task.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Fecha objetivo:{' '}
                  <time dateTime={task.date}>{formatDate(task.date)}</time>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700">
                  {task.hours ?? '—'} hrs
                </span>
                <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                  {getStateLabel(task.state)}
                </span>
                <Button
                  as={Link}
                  to={`/evento/${task.eventId}`}
                  variant="neutral"
                  aria-label={`Ver evento ${task.eventName}`}
                >
                  Ver evento
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
