import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { Card } from '../components/ui/Card';
import { EventCard } from '../components/ui/EventCard';
import { FilterField, FiltersDropdown } from '../components/ui/FiltersDropdown';
import { WorkloadSummary } from '../components/ui/WorkloadSummary';
import { api, unwrapData } from '../services/api';
import { getTaskMetrics, normalizeSubtask } from '../utils/taskMetrics';

const getErrorMessage = (error) =>
  error?.message || 'No pudimos consultar el progreso de los eventos.';

const getToday = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

export const ProgresoPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    tipo: 'todas',
    fecha: 'todas',
    texto: '',
  });

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [eventsResponse, typesResponse] = await Promise.all([
        api.listEvents(),
        api.listEventTypes(),
      ]);
      const rawEvents = (Array.isArray(eventsResponse) ? eventsResponse : []).filter(
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
      setEventTypes(
        (Array.isArray(typesResponse) ? typesResponse : []).filter(
          (type) => type?.id ?? type?.idTipoEvento
        )
      );
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

  const filteredEvents = useMemo(() => {
    const { tipo, fecha, texto } = filters;
    const query = texto.trim().toLowerCase();
    const today = getToday();

    return events.filter((event) => {
      if (tipo !== 'todas' && String(event.idTipoEvento) !== String(tipo)) {
        return false;
      }
      if (fecha !== 'todas') {
        const eventDate = String(event.fechaEvento ?? event.date ?? '').slice(0, 10);
        if (fecha === 'futuras' && eventDate < today) {
          return false;
        }
        if (fecha === 'pasadas' && eventDate >= today) {
          return false;
        }
      }
      if (query) {
        const name = String(event.nombre ?? event.name ?? '').toLowerCase();
        if (!name.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [events, filters]);

  const activeFilterCount =
    (filters.tipo !== 'todas' ? 1 : 0) +
    (filters.fecha !== 'todas' ? 1 : 0) +
    (filters.texto.trim() ? 1 : 0);

  const clearFilters = () =>
    setFilters({ tipo: 'todas', fecha: 'todas', texto: '' });

  const updateFilter = (field, value) =>
    setFilters((current) => ({ ...current, [field]: value }));

  const globalMetrics = useMemo(
    () =>
      filteredEvents.reduce(
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
    [filteredEvents]
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
        className="flex min-h-[50vh] items-center justify-center text-muted-text"
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-accent">
            Seguimiento
          </p>
          <h2 className="text-3xl font-bold text-primary">
            Progreso del evento
          </h2>
          <p className="mt-2 max-w-2xl text-muted-text">
            Consulta aquí el avance de los preparativos de cada evento.
          </p>
        </div>
        <FiltersDropdown
          label="Filtros"
          activeCount={activeFilterCount}
          onClear={clearFilters}
        >
          <FilterField label="Tipo de evento">
            <select
              value={filters.tipo}
              onChange={(event) => updateFilter('tipo', event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface-raised px-2 text-sm"
            >
              <option value="todas">Todos</option>
              {eventTypes.map((type) => (
                <option
                  key={type.id ?? type.idTipoEvento}
                  value={type.id ?? type.idTipoEvento}
                >
                  {type.name ?? type.nombre}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Fecha del evento">
            <select
              value={filters.fecha}
              onChange={(event) => updateFilter('fecha', event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface-raised px-2 text-sm"
            >
              <option value="todas">Todas</option>
              <option value="futuras">Próximas</option>
              <option value="pasadas">Pasadas</option>
            </select>
          </FilterField>
          <FilterField label="Buscar por nombre">
            <input
              type="search"
              value={filters.texto}
              onChange={(event) => updateFilter('texto', event.target.value)}
              placeholder="Ej: Boda, conferencia..."
              className="h-10 w-full rounded-md border border-border bg-surface-raised px-2 text-sm"
            />
          </FilterField>
        </FiltersDropdown>
      </div>

      {filteredEvents.length === 0 ? (
        activeFilterCount > 0 ? (
          <EmptyState
            title="Sin resultados para los filtros"
            description="Ningún evento coincide con los filtros seleccionados. Prueba con otros criterios o límpialos."
            actionLabel="Limpiar filtros"
            onAction={clearFilters}
          />
        ) : (
          <EmptyState
            title="Aún no hay eventos para mostrar"
            description="Crea tu primer evento para comenzar a organizar sus preparativos y subtareas."
            actionLabel="Crear evento"
            onAction={() => navigate('/crear')}
          />
        )
      ) : (
        <>
          <Card aria-labelledby="global-summary-title" className="p-6">
            <div className="mb-5">
              <h3
                id="global-summary-title"
                className="text-lg font-semibold text-primary"
              >
                Resumen global
              </h3>
              <p className="mt-1 text-sm text-muted-text">
                El avance se calcula principalmente con las horas estimadas.
              </p>
            </div>
            <WorkloadSummary
              eventCount={filteredEvents.length}
              progressLabel="Carga total"
              metrics={{ ...globalMetrics, progressHours: globalProgress }}
            />
          </Card>

          <div className="grid gap-4">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProgresoPage;
