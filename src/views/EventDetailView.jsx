import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import {
  api,
  getDefaultUserId,
  toApiDateTime,
  unwrapData,
} from '../services/api';

const initialSubtaskData = {
  title: '',
  hours: '',
  date: '',
};

const getErrorMessage = (error) =>
  error?.message || 'No pudimos conectar con el servidor. Inténtalo de nuevo.';

const toDateInputValue = (value) => {
  if (!value) {
    return '';
  }

  const stringValue = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return stringValue.slice(0, 10);
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
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
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const normalizeEvent = (payload, fallbackId) => {
  const source = payload || {};

  return {
    id: source.id ?? source.idEvento ?? fallbackId,
    idUsuario: source.idUsuario ?? getDefaultUserId(),
    idTipoEvento: source.idTipoEvento ?? 1,
    nombre: source.nombre ?? source.name ?? 'Evento sin nombre',
    cliente: source.cliente ?? source.client ?? 'Sin cliente',
    fechaEvento: source.fechaEvento ?? source.date ?? '',
    lugar: source.lugar ?? source.location ?? 'Sin lugar',
    tipo: source.tipoEvento?.nombre ?? source.type ?? 'Sin tipo',
  };
};

const eventToForm = (event) => ({
  nombre: event.nombre,
  cliente: event.cliente,
  fecha: toDateInputValue(event.fechaEvento),
  lugar: event.lugar,
});

const normalizeSubtask = (payload, fallbackId = Date.now()) => {
  const source = payload || {};

  return {
    id: source.id ?? source.idSubtarea ?? fallbackId,
    title: source.nombreGestion ?? source.title ?? source.name ?? '',
    hours: source.horasEstimadas ?? source.hours ?? '',
    date: source.fechaObjetivo ?? source.date ?? '',
    state: source.estado ?? source.state ?? 'pendiente',
  };
};

const validateSubtask = (formData) => {
  const newErrors = {};

  if (!formData.title.trim()) {
    newErrors.title =
      'Dejaste el nombre vacío. Ingresa qué gestión necesitas realizar.';
  }

  if (!formData.hours || Number(formData.hours) <= 0) {
    newErrors.hours =
      'Ingresaste 0 o menos. Asigna al menos 1 hora de esfuerzo.';
  }

  if (!formData.date) {
    newErrors.date =
      'Falta la fecha límite. Selecciona cuándo debe estar lista.';
  }

  return newErrors;
};

const validateEventForm = (formData) => {
  const newErrors = {};

  if (!formData.nombre.trim()) {
    newErrors.nombre =
      'Dejaste el nombre vacío. Ingresa un título para identificar el evento.';
  }
  if (!formData.cliente.trim()) {
    newErrors.cliente =
      'Falta el contacto. Escribe el nombre del cliente o responsable.';
  }
  if (!formData.fecha) {
    newErrors.fecha =
      'La fecha está vacía. Selecciona el día en que se realizará el evento.';
  }
  if (!formData.lugar.trim()) {
    newErrors.lugar =
      'El lugar está vacío. Indica la ubicación donde se llevará a cabo.';
  }

  return newErrors;
};

const getStateLabel = (state) => {
  const labels = {
    pendiente: 'Pendiente',
    ejecutada: 'Completada',
    pospuesta: 'Pospuesta',
  };

  return labels[state] || 'Pendiente';
};

export function EventDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialSubtaskData);
  const [errors, setErrors] = useState({});
  const [isSavingSubtask, setIsSavingSubtask] = useState(false);
  const [actionError, setActionError] = useState('');

  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    nombre: '',
    cliente: '',
    fecha: '',
    lugar: '',
  });
  const [eventErrors, setEventErrors] = useState({});
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [updatingSubtaskId, setUpdatingSubtaskId] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const [eventResponse, subtasksResponse] = await Promise.all([
        api.getEvent(id),
        api.getSubtasks(id),
      ]);
      const loadedEvent = normalizeEvent(unwrapData(eventResponse), id);
      const loadedSubtasks = unwrapData(subtasksResponse);

      setEvent(loadedEvent);
      setEventForm(eventToForm(loadedEvent));
      setSubtasks(
        Array.isArray(loadedSubtasks)
          ? loadedSubtasks.map((subtask) => normalizeSubtask(subtask))
          : []
      );
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // La carga inicial sincroniza la vista con el endpoint externo.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadData();
  }, [loadData]);

  const completedCount = useMemo(
    () => subtasks.filter((subtask) => subtask.state === 'ejecutada').length,
    [subtasks]
  );
  const progress = subtasks.length
    ? Math.round((completedCount / subtasks.length) * 100)
    : 0;

  const updateSubtaskField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setActionError('');
  };

  const updateEventField = (field, value) => {
    setEventForm((current) => ({ ...current, [field]: value }));
    setEventErrors((current) => ({ ...current, [field]: '' }));
    setActionError('');
  };

  const handleAddSubtask = async (event) => {
    event.preventDefault();
    const validationErrors = validateSubtask(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setActionError('');
    setIsSavingSubtask(true);

    try {
      const response = unwrapData(
        await api.createSubtask(id, {
          nombreGestion: formData.title.trim(),
          horasEstimadas: Number(formData.hours),
          fechaObjetivo: formData.date,
          estado: 'pendiente',
        })
      );
      const newSubtask = normalizeSubtask(
        response || {
          idSubtarea: Date.now(),
          nombreGestion: formData.title.trim(),
          horasEstimadas: Number(formData.hours),
          fechaObjetivo: formData.date,
          estado: 'pendiente',
        },
        Date.now()
      );

      setSubtasks((current) => [...current, newSubtask]);
      setFormData(initialSubtaskData);
      setShowForm(false);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsSavingSubtask(false);
    }
  };

  const handleToggleSubtask = async (subtask) => {
    const nextState = subtask.state === 'ejecutada' ? 'pendiente' : 'ejecutada';

    setUpdatingSubtaskId(subtask.id);
    setActionError('');

    try {
      const response = unwrapData(
        await api.updateSubtask(subtask.id, {
          idSubtarea: subtask.id,
          idEvento: Number(id),
          nombreGestion: subtask.title,
          horasEstimadas: Number(subtask.hours),
          fechaObjetivo: subtask.date,
          estado: nextState,
        })
      );
      const updatedSubtask = normalizeSubtask(
        response || {
          idSubtarea: subtask.id,
          nombreGestion: subtask.title,
          horasEstimadas: subtask.hours,
          fechaObjetivo: subtask.date,
          estado: nextState,
        },
        subtask.id
      );
      setSubtasks((current) =>
        current.map((item) => (item.id === subtask.id ? updatedSubtask : item))
      );
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setUpdatingSubtaskId(null);
    }
  };

  const handleDeleteSubtask = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      await api.deleteSubtask(deleteTarget.id);
      setSubtasks((current) =>
        current.filter((subtask) => subtask.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEvent = async (event) => {
    event.preventDefault();
    const validationErrors = validateEventForm(eventForm);

    if (Object.keys(validationErrors).length > 0) {
      setEventErrors(validationErrors);
      return;
    }

    setEventErrors({});
    setActionError('');
    setIsSavingEvent(true);

    try {
      const payload = {
        idUsuario: event.idUsuario,
        idTipoEvento: event.idTipoEvento,
        nombre: eventForm.nombre.trim(),
        cliente: eventForm.cliente.trim(),
        fechaEvento: toApiDateTime(eventForm.fecha),
        lugar: eventForm.lugar.trim(),
      };
      const response = unwrapData(await api.updateEvent(event.id, payload));
      const updatedEvent = normalizeEvent(
        { ...event, ...payload, ...(response || {}) },
        event.id
      );

      setEvent(updatedEvent);
      setEventForm(eventToForm(updatedEvent));
      setIsEditingEvent(false);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsSavingEvent(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center text-gray-600"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        Cargando evento...
      </div>
    );
  }

  if (loadError || !event) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState
          title="No pudimos cargar el evento"
          message={loadError || 'El evento solicitado no está disponible.'}
          onRetry={() => void loadData()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase text-blue-600">
              Evento #{event.id}
            </span>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {event.nombre}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Plan logístico del evento
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="neutral"
              onClick={() => navigate('/hoy')}
            >
              Volver a hoy
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsEditingEvent((current) => !current)}
              disabled={isSavingEvent}
            >
              {isEditingEvent ? 'Cancelar edición' : 'Editar evento'}
            </Button>
          </div>
        </div>

        {isEditingEvent ? (
          <form
            onSubmit={handleSaveEvent}
            className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2"
            noValidate
            aria-busy={isSavingEvent}
          >
            <div>
              <label
                htmlFor="edit-event-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Nombre del evento *
              </label>
              <input
                id="edit-event-name"
                name="nombre"
                type="text"
                value={eventForm.nombre}
                onChange={(event) =>
                  updateEventField('nombre', event.target.value)
                }
                aria-invalid={Boolean(eventErrors.nombre)}
                aria-describedby={
                  eventErrors.nombre ? 'edit-event-name-error' : undefined
                }
                className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  eventErrors.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {eventErrors.nombre && (
                <p
                  id="edit-event-name-error"
                  role="alert"
                  className="mt-1 text-xs text-red-600"
                >
                  {eventErrors.nombre}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="edit-event-client"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Cliente / contacto *
              </label>
              <input
                id="edit-event-client"
                name="cliente"
                type="text"
                value={eventForm.cliente}
                onChange={(event) =>
                  updateEventField('cliente', event.target.value)
                }
                aria-invalid={Boolean(eventErrors.cliente)}
                aria-describedby={
                  eventErrors.cliente ? 'edit-event-client-error' : undefined
                }
                className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  eventErrors.cliente ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {eventErrors.cliente && (
                <p
                  id="edit-event-client-error"
                  role="alert"
                  className="mt-1 text-xs text-red-600"
                >
                  {eventErrors.cliente}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="edit-event-date"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Fecha del evento *
              </label>
              <input
                id="edit-event-date"
                name="fecha"
                type="date"
                value={eventForm.fecha}
                onChange={(event) =>
                  updateEventField('fecha', event.target.value)
                }
                aria-invalid={Boolean(eventErrors.fecha)}
                aria-describedby={
                  eventErrors.fecha ? 'edit-event-date-error' : undefined
                }
                className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  eventErrors.fecha ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {eventErrors.fecha && (
                <p
                  id="edit-event-date-error"
                  role="alert"
                  className="mt-1 text-xs text-red-600"
                >
                  {eventErrors.fecha}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="edit-event-location"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Lugar del evento *
              </label>
              <input
                id="edit-event-location"
                name="lugar"
                type="text"
                value={eventForm.lugar}
                onChange={(event) =>
                  updateEventField('lugar', event.target.value)
                }
                aria-invalid={Boolean(eventErrors.lugar)}
                aria-describedby={
                  eventErrors.lugar ? 'edit-event-location-error' : undefined
                }
                className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  eventErrors.lugar ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {eventErrors.lugar && (
                <p
                  id="edit-event-location-error"
                  role="alert"
                  className="mt-1 text-xs text-red-600"
                >
                  {eventErrors.lugar}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t pt-4 sm:col-span-2">
              <Button
                type="button"
                variant="neutral"
                onClick={() => setIsEditingEvent(false)}
                disabled={isSavingEvent}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSavingEvent}
                aria-busy={isSavingEvent}
              >
                {isSavingEvent ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        ) : (
          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tipo
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{event.tipo}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Fecha
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(event.fechaEvento)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Cliente / contacto
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{event.cliente}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Lugar
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{event.lugar}</dd>
            </div>
          </dl>
        )}
      </section>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Plan inicial de subtareas
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {subtasks.length === 0
                ? 'Añade la primera gestión para comenzar.'
                : `${completedCount} de ${subtasks.length} gestos completadas.`}
            </p>
          </div>
          {!showForm && subtasks.length > 0 && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowForm(true)}
            >
              + Añadir gestión
            </Button>
          )}
        </div>

        <div className="py-5">
          <ProgressBar value={progress} label="Progreso logístico" />
        </div>

        {actionError && (
          <p
            role="alert"
            className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
          >
            {actionError}
          </p>
        )}

        {subtasks.length === 0 && !showForm && (
          <EmptyState
            title="¿Aún no hay gestiones logísticas?"
            description="Divide el evento en tareas pequeñas, asigna horas y define una fecha límite para cada gestión."
            actionLabel="Añadir gestión"
            onAction={() => setShowForm(true)}
          />
        )}

        {showForm && (
          <form
            onSubmit={handleAddSubtask}
            className="space-y-4 rounded-md border bg-gray-50 p-4"
            noValidate
            aria-busy={isSavingSubtask}
          >
            <h4 className="text-sm font-semibold text-gray-700">
              Nueva gestión logística
            </h4>

            <div>
              <label
                htmlFor="subtask-title"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Nombre de la gestión *
              </label>
              <input
                id="subtask-title"
                name="title"
                type="text"
                value={formData.title}
                onChange={(event) =>
                  updateSubtaskField('title', event.target.value)
                }
                aria-invalid={Boolean(errors.title)}
                aria-describedby={
                  errors.title ? 'subtask-title-error' : undefined
                }
                className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Reservar salón de eventos"
                required
              />
              {errors.title && (
                <p
                  id="subtask-title-error"
                  role="alert"
                  className="mt-1 text-xs text-red-600"
                >
                  {errors.title}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="subtask-hours"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Horas estimadas *
                </label>
                <input
                  id="subtask-hours"
                  name="hours"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.hours}
                  onChange={(event) =>
                    updateSubtaskField('hours', event.target.value)
                  }
                  aria-invalid={Boolean(errors.hours)}
                  aria-describedby={
                    errors.hours ? 'subtask-hours-error' : undefined
                  }
                  className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.hours ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 4"
                  required
                />
                {errors.hours && (
                  <p
                    id="subtask-hours-error"
                    role="alert"
                    className="mt-1 text-xs text-red-600"
                  >
                    {errors.hours}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="subtask-date"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Fecha límite *
                </label>
                <input
                  id="subtask-date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={(event) =>
                    updateSubtaskField('date', event.target.value)
                  }
                  aria-invalid={Boolean(errors.date)}
                  aria-describedby={
                    errors.date ? 'subtask-date-error' : undefined
                  }
                  className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.date && (
                  <p
                    id="subtask-date-error"
                    role="alert"
                    className="mt-1 text-xs text-red-600"
                  >
                    {errors.date}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="neutral"
                onClick={() => {
                  setShowForm(false);
                  setErrors({});
                }}
                disabled={isSavingSubtask}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSavingSubtask}
                aria-busy={isSavingSubtask}
              >
                {isSavingSubtask ? 'Guardando...' : 'Guardar gestión'}
              </Button>
            </div>
          </form>
        )}

        {subtasks.length > 0 && (
          <ul className="space-y-2" aria-live="polite">
            {subtasks.map((subtask) => (
              <li
                key={subtask.id}
                className="flex flex-col gap-3 rounded-md border bg-gray-50 p-3 text-sm transition-colors hover:bg-gray-100 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p
                    className={`font-medium ${
                      subtask.state === 'ejecutada'
                        ? 'text-gray-500 line-through'
                        : 'text-gray-800'
                    }`}
                  >
                    {subtask.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Fecha límite: {formatDate(subtask.date)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700">
                    {subtask.hours} hrs
                  </span>
                  <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                    {getStateLabel(subtask.state)}
                  </span>
                  <Button
                    type="button"
                    variant="neutral"
                    className="px-2 py-1 text-xs"
                    onClick={() => void handleToggleSubtask(subtask)}
                    disabled={updatingSubtaskId === subtask.id}
                    aria-label={
                      subtask.state === 'ejecutada'
                        ? `Marcar ${subtask.title} como pendiente`
                        : `Marcar ${subtask.title} como completada`
                    }
                  >
                    {subtask.state === 'ejecutada' ? 'Reabrir' : 'Completar'}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="px-2 py-1 text-xs"
                    onClick={() => {
                      setDeleteError('');
                      setDeleteTarget(subtask);
                    }}
                    aria-label={`Eliminar ${subtask.title}`}
                  >
                    Eliminar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Eliminar gestión"
        message={
          deleteTarget
            ? `¿Seguro que quieres eliminar “${deleteTarget.title}”? Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar"
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
            setDeleteError('');
          }
        }}
        onConfirm={() => void handleDeleteSubtask()}
        isConfirming={isDeleting}
        error={deleteError}
      />
    </div>
  );
}
