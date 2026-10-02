import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { CalendarModal } from '../components/ui/CalendarModal';
import { FilterField, FiltersDropdown } from '../components/ui/FiltersDropdown';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { Card } from '../components/ui/Card';
import { TaskCard } from '../components/ui/TaskCard';
import { api, unwrapData } from '../services/api';
import { getToday } from '../utils/dateValidation';
import {
  classifyTasksByDate,
  formatOverdueLabel,
  formatRelativeDate,
  normalizeEvent,
  normalizeSubtask,
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
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [filters, setFilters] = useState({
    estado: 'todas',
    evento: 'todos',
    fecha: 'todas',
  });

  const loadToday = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const eventsResponse = unwrapData(await api.listEvents());
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

      setTasks(taskGroups.flat());
      setEvents(normalizedEvents);
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

  const filteredTasks = useMemo(() => {
    const { estado, evento, fecha } = filters;

    return tasks.filter((task) => {
      if (estado !== 'todas' && task.state !== estado) {
        return false;
      }
      if (evento !== 'todos' && String(task.eventId) !== String(evento)) {
        return false;
      }
      if (fecha !== 'todas') {
        const date = String(task.date).slice(0, 10);
        if (fecha === 'hoy' && date !== today) {
          return false;
        }
        if (fecha === 'vencidas' && date >= today) {
          return false;
        }
        if (fecha === 'proximas' && date <= today) {
          return false;
        }
      }
      return true;
    });
  }, [filters, tasks, today]);

  const activeFilterCount =
    (filters.estado !== 'todas' ? 1 : 0) +
    (filters.evento !== 'todos' ? 1 : 0) +
    (filters.fecha !== 'todas' ? 1 : 0);

  const clearFilters = () =>
    setFilters({ estado: 'todas', evento: 'todos', fecha: 'todas' });

  const updateFilter = (field, value) =>
    setFilters((current) => ({ ...current, [field]: value }));

  const groups = useMemo(
    () => classifyTasksByDate(filteredTasks, today),
    [filteredTasks, today]
  );
  const tasksByDate = useMemo(() => {
    const grouped = new Map();

    tasks.forEach((task) => {
      if (!task.date) {
        return;
      }

      const key = String(task.date).slice(0, 10);
      const current = grouped.get(key) ?? [];
      current.push({
        ...task,
        eventId: task.eventId ?? task.idEvento,
        title: task.title ?? task.nombreGestion,
      });
      grouped.set(key, current);
    });

    return grouped;
  }, [tasks]);

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
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
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

        <div className="flex flex-wrap items-center gap-2 pt-5">
          <Button
            type="button"
            variant="neutral"
            onClick={() => setIsCalendarOpen(true)}
          >
            Ver calendario
          </Button>
          <FiltersDropdown
            label="Filtros"
            activeCount={activeFilterCount}
            onClear={clearFilters}
          >
            <FilterField label="Estado">
              <select
                value={filters.estado}
                onChange={(event) => updateFilter('estado', event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface-raised px-2 text-sm"
              >
                <option value="todas">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="ejecutada">Completada</option>
                <option value="pospuesta">Pospuesta</option>
              </select>
            </FilterField>
            <FilterField label="Evento">
              <select
                value={filters.evento}
                onChange={(event) => updateFilter('evento', event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface-raised px-2 text-sm"
              >
                <option value="todos">Todos</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Fecha objetivo">
              <select
                value={filters.fecha}
                onChange={(event) => updateFilter('fecha', event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface-raised px-2 text-sm"
              >
                <option value="todas">Todas</option>
                <option value="hoy">Hoy</option>
                <option value="vencidas">Vencidas</option>
                <option value="proximas">Próximas</option>
              </select>
            </FilterField>
          </FiltersDropdown>
        </div>
      </Card>

      <p className="rounded-lg border border-border bg-surface-raised p-4 text-sm text-secondary-text">
        ¿Cómo se ordena esto? Primero van las gestiones vencidas, luego las de
        hoy y al final las próximas. Dentro de cada grupo se ordenan de la
        fecha más antigua a la más reciente; si dos gestiones comparten fecha,
        aparece primero la de menor esfuerzo estimado.
      </p>

      {groups.overdueTasks.length === 0 &&
      groups.todayTasks.length === 0 &&
      groups.upcomingTasks.length === 0 ? (
        activeFilterCount > 0 ? (
          <EmptyState
            title="Sin resultados para los filtros"
            description="Ninguna gestión coincide con los filtros seleccionados. Prueba con otros criterios o límpialos."
            actionLabel="Limpiar filtros"
            onAction={clearFilters}
          />
        ) : (
          <EmptyState
            title="Hoy no tienes gestiones urgentes"
            description="No hay gestiones vencidas, de hoy ni próximas. ¿Quieres crear un evento?"
            actionLabel="Crear evento"
            onAction={() => navigate('/crear')}
          />
        )
      ) : (
        <>
          <TaskSection
            id="overdue-tasks-title"
            title="Gestiones vencidas"
            description="Gestiones con fecha objetivo anterior a hoy que requieren atención."
            tasks={groups.overdueTasks}
            total={groups.overdueTotal}
            getDateLabel={(task) => formatOverdueLabel(task.date, today)}
            isOverdue
          />

          <TaskSection
            id="today-tasks-title"
            title="Para hoy"
            description="Gestiones con fecha objetivo de hoy."
            tasks={groups.todayTasks}
            total={groups.todayTotal}
            getDateLabel={() => 'Hoy'}
          />

          <TaskSection
            id="upcoming-tasks-title"
            title="Próximas"
            description="Lo que viene en los próximos siete días."
            tasks={groups.upcomingTasks}
            total={groups.upcomingTotal}
            getDateLabel={(task) => formatRelativeDate(task.date, today)}
          />
        </>
      )}

      <CalendarModal
        open={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        tasksByDate={tasksByDate}
      />
    </div>
  );
};

export default HoyPage;
