import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, ListChecks, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { Card } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { TaskCard } from '../components/ui/TaskCard';
import { api, getDefaultUserId, unwrapData } from '../services/api';
import { getToday } from '../utils/dateValidation';
import {
  classifyTasksByDate,
  formatHours,
  formatOverdueLabel,
  formatRelativeDate,
  isEventToday,
  normalizeEvent,
  normalizeSubtask,
  sumHours,
} from '../utils/taskMetrics';

const formatDate = (value) => {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const getErrorMessage = (error) =>
  error?.message ||
  'No pudimos cargar las gestiones de hoy. Inténtalo de nuevo.';

function TaskSection({
  id,
  title,
  description,
  tasks,
  total,
  getDateLabel,
  isOverdue = false,
}) {
  if (total === 0) {
    return null;
  }

  return (
    <section aria-labelledby={id} className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={id} className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
        {total > tasks.length && (
          <p className="text-xs font-medium text-gray-500">
            Mostrando {tasks.length} de {total}
          </p>
        )}
      </div>
      <ul className="space-y-3" aria-live="polite">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            dateLabel={getDateLabel(task)}
            isOverdue={isOverdue}
          />
        ))}
      </ul>
    </section>
  );
}

export const HoyPage = () => {
  const navigate = useNavigate();
  const [today] = useState(getToday);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadToday = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const userId = getDefaultUserId();
      const eventsResponse = unwrapData(await api.listEvents(userId));
      const normalizedEvents = (
        Array.isArray(eventsResponse) ? eventsResponse : []
      )
        .map(normalizeEvent)
        .filter((event) => event.id);

      const taskGroups = await Promise.all(
        normalizedEvents.map(async (event) => {
          const response = unwrapData(await api.getSubtasks(event.id));
          return (Array.isArray(response) ? response : [])
            .map(normalizeSubtask)
            .filter((task) => task.id)
            .map((task) => ({ ...task, eventName: event.name }));
        })
      );

      setEvents(normalizedEvents);
      setTasks(taskGroups.flat());
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // El panel de hoy se construye con los eventos y sus subtareas del organizador.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadToday();
  }, [loadToday]);

  const groups = useMemo(
    () => classifyTasksByDate(tasks, today),
    [tasks, today]
  );
  const eventsToday = useMemo(
    () => events.filter((event) => isEventToday(event, today)).length,
    [events, today]
  );
  const hoursToday = useMemo(
    () => sumHours(groups.todayTasks),
    [groups.todayTasks]
  );

  if (isLoading) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center text-gray-600"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        Cargando el panel de hoy...
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
      <Card aria-labelledby="today-title" className="p-6">
        <div className="border-b border-gray-200 pb-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
            Panel del día
          </p>
          <h2
            id="today-title"
            className="mt-2 text-2xl font-semibold text-gray-900"
          >
            Hoy
          </h2>
          <time
            dateTime={today}
            className="mt-1 block text-sm capitalize text-gray-500"
          >
            {formatDate(today)}
          </time>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-5 sm:grid-cols-4">
          <MetricCard
            label="Tareas de hoy"
            value={groups.todayTotal}
            icon={ListChecks}
          />
          <MetricCard
            label="Eventos de hoy"
            value={eventsToday}
            icon={CalendarDays}
          />
          <MetricCard
            label="Carga de hoy"
            value={formatHours(hoursToday)}
            icon={Clock3}
          />
          <MetricCard
            label="Atrasadas"
            value={groups.overdueTotal}
            icon={TriangleAlert}
            className={groups.overdueTotal ? 'border-amber-300' : ''}
          />
        </div>
      </Card>

      {groups.todayTasks.length === 0 ? (
        <EmptyState
          title="Aún no hay gestiones para hoy"
          description="Cuando agregues una gestión con la fecha de hoy, aparecerá aquí para que puedas seguirla."
          actionLabel="Crear tu primer evento"
          onAction={() => navigate('/crear')}
        />
      ) : (
        <TaskSection
          id="today-tasks-title"
          title="Tareas de hoy"
          description="Atiende primero las tareas con fecha objetivo de hoy."
          tasks={groups.todayTasks}
          total={groups.todayTotal}
          getDateLabel={() => 'Hoy'}
        />
      )}

      <TaskSection
        id="overdue-tasks-title"
        title="Tareas atrasadas"
        description="Tareas pendientes que necesitan una nueva fecha."
        tasks={groups.overdueTasks}
        total={groups.overdueTotal}
        getDateLabel={(task) => formatOverdueLabel(task.date, today)}
        isOverdue
      />

      <TaskSection
        id="upcoming-tasks-title"
        title="Tareas próximas"
        description="Lo que viene en los próximos siete días."
        tasks={groups.upcomingTasks}
        total={groups.upcomingTotal}
        getDateLabel={(task) => formatRelativeDate(task.date, today)}
      />
    </div>
  );
};

export default HoyPage;
