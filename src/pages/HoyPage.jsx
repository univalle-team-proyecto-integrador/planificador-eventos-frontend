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
import { persistRange, readStoredRange } from '../utils/rangoPreximas';
import {
  classifyTasksByDate,
  formatOverdueLabel,
  formatRelativeDate,
  normalizeEvent,
  normalizeSubtask,
  UPCOMING_RANGES,
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
          <h2 id={id} className="text-lg font-semibold text-primary">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-text">{description}</p>
        </div>
        {total > tasks.length && (
          <p className="text-xs font-medium text-muted-text">
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
  const [isRuleOpen, setIsRuleOpen] = useState(false);
  const [rangoProximas, setRangoProximas] = useState(readStoredRange);
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

  useEffect(() => {
    // La regla de orden se explica una sola vez: la próxima visita a /hoy
    // solo la muestra en el tooltip.
    // oxlint-disable-next-line react/set-state-in-effect
    if (!window.localStorage.getItem('eventflow.reglaHoy')) {
      setIsRuleOpen(true);
    }
  }, []);

  const cerrarRegla = useCallback(() => {
    setIsRuleOpen(false);
    // La marca se escribe al cerrar, no al abrir. Si se escribiera al abrir, un
    // desmontaje antes del primer pintado (que es lo que pasa en el arranque,
    // mientras `isLoading` sigue en true y el modal aún no existe en el DOM)
    // dejaría el aviso consumido sin que nadie lo haya visto nunca.
    window.localStorage.setItem('eventflow.reglaHoy', '1');
  }, []);

  // A qué evento va el "Asignar gestión" del estado vacío. Va al más próximo por
  // fecha entre los que todavía no pasaron: añadir una gestión nueva a un evento
  // que ya se llevó a cabo no sirve de mucho. Si todos ya pasaron, se cae al más
  // reciente, que es lo mejor que se puede ofrecer.
  const eventoParaGestionar = useMemo(() => {
    if (events.length === 0) {
      return null;
    }

    const conFecha = [...events].filter((event) => event.date);
    if (conFecha.length === 0) {
      return events[0];
    }

    const hoy = today;
    const futuros = conFecha
      .filter((event) => String(event.date).slice(0, 10) >= hoy)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));

    if (futuros.length > 0) {
      return futuros[0];
    }

    return conFecha.sort((a, b) =>
      String(b.date).localeCompare(String(a.date))
    )[0];
  }, [events, today]);

  const irAAsignarGestion = useCallback(() => {
    if (!eventoParaGestionar) {
      navigate('/progreso');
      return;
    }

    // `nueva=1` le dice al detalle que abra el formulario de alta ya listo. La
    // ruta lleva `?` porque el parámetro viaja en el query string, no en el
    // path: `/evento/7?nueva=1` sigue resolviendo a `/evento/:id`.
    navigate(`/evento/${eventoParaGestionar.id}?nueva=1`);
  }, [eventoParaGestionar, navigate]);

  // El rango elegido se pasa tal cual: days decide cuántas fechas son "próximas"
  // y limit cuántas de esas se pintan, así no pueden desincronizarse.
  const cambiarRango = useCallback((days) => {
    setRangoProximas(persistRange(days));
  }, []);

  const groups = useMemo(
    () => classifyTasksByDate(filteredTasks, today, rangoProximas),
    [filteredTasks, today, rangoProximas]
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

  // El modal de la regla se pinta por encima de los tres estados de la página,
  // así que va en un fragmento aparte en vez de dentro del JSX normal. Si se
  // quedara al final, los retornos tempranos de carga y de error lo dejarían
  // fuera del DOM y la explicación se perdería sin haberse visto.
  const modalRegla = isRuleOpen ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--surface-overlay)] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="regla-hoy-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          cerrarRegla();
        }
      }}
    >
      <section className="w-full max-w-md rounded-lg border border-border bg-surface-raised p-6 shadow-xl">
        <h2
          id="regla-hoy-title"
          className="text-xl font-bold text-primary-text"
        >
          ¿Cómo se ordenan las gestiones?
        </h2>
        <p className="mt-3 text-sm text-secondary-text">
          Las gestiones se agrupan en <strong>Vencidas</strong>,{' '}
          <strong>Para hoy</strong> y <strong>Próximas</strong> según su fecha
          objetivo. Para <strong>Próximas</strong> se considera el rango que
          elijas en <strong>Mostrar próximos</strong>. Dentro de cada grupo se
          ordenan por fecha (más antigua/cercana primero). En caso de empate, se
          muestra primero la de menor esfuerzo estimado.
        </p>
        <div className="mt-5 flex justify-end">
          <Button type="button" variant="primary" onClick={cerrarRegla}>
            Entendido
          </Button>
        </div>
      </section>
    </div>
  ) : null;

  if (isLoading) {
    return (
      <>
        <div
          className="flex min-h-[50vh] items-center justify-center text-muted-text"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          Cargando el panel de hoy...
        </div>
        {modalRegla}
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="mx-auto max-w-2xl">
          <ErrorState
            title="No pudimos cargar las gestiones de hoy"
            message={error}
            onRetry={() => void loadToday()}
          />
        </div>
        {modalRegla}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <Card aria-labelledby="today-title" className="p-6">
        <div className="border-b border-border pb-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Panel del día
          </p>
          <div className="flex items-center gap-2">
            <h2
              id="today-title"
              className="mt-2 text-2xl font-semibold text-primary"
            >
              Hoy
            </h2>
            <span className="group relative mt-2 inline-flex">
              <button
                type="button"
                aria-label="¿Cómo se ordena esto?"
                className="inline-flex size-6 cursor-pointer items-center justify-center rounded-full text-muted-text transition-colors hover:bg-surface-sunken hover:text-secondary-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-text"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="size-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16v-4m0-4h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z"
                  />
                </svg>
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-lg border border-border bg-surface-raised p-3 text-left text-xs text-secondary-text opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
                Las gestiones se agrupan en Vencidas, Para hoy y Próximas según
                su fecha objetivo. Dentro de cada grupo se ordenan por fecha
                (más antigua/cercana primero). En caso de empate, se muestra
                primero la de menor esfuerzo estimado.
              </span>
            </span>
          </div>
          <time
            dateTime={today}
            className="mt-1 block text-sm capitalize text-muted-text"
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
          <label className="inline-flex items-center gap-2 text-sm">
            <span className="font-medium text-secondary-text">
              Mostrar próximos
            </span>
            <select
              value={rangoProximas.days}
              onChange={(event) => cambiarRango(event.target.value)}
              aria-label="Días hacia adelante que se consideran próximos"
              className="h-10 rounded-md border border-border bg-surface-raised px-2 text-sm"
            >
              {UPCOMING_RANGES.map((rango) => (
                <option key={rango.days} value={rango.days}>
                  {rango.days} días
                </option>
              ))}
            </select>
          </label>
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
        ) : events.length === 0 ? (
          <EmptyState
            title="Aún no tienes eventos"
            description="Crea tu primer evento para empezar a organizar sus preparativos."
            actionLabel="Crear evento"
            onAction={() => navigate('/crear')}
          />
        ) : (
          <EmptyState
            title="Ninguno de tus eventos tiene una gestión para hoy"
            description="Ya tienes eventos, pero ninguno tiene una gestión pendiente. Añade la primera y aparecerá aquí."
            actionLabel="Asignar gestión"
            onAction={irAAsignarGestion}
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
            description={`Lo que viene en los próximos ${rangoProximas.days} días.`}
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

      {modalRegla}
    </div>
  );
};

export default HoyPage;
