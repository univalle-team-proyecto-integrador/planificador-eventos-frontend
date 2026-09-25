import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Undo2,
  UserRound,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { WorkloadSummary } from '../components/ui/WorkloadSummary';
import { getEventTypeIcon } from '../utils/eventTypeIcons';
import { getTaskMetrics } from '../utils/taskMetrics';
import {
  getPastDateMessage,
  getToday,
  isDateInPast,
} from '../utils/dateValidation';
import { focusFirstInvalidField } from '../utils/formFocus';
import { useNotifications } from '../providers/notifications-context';
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

const normalizeEventType = (payload) => ({
  id: payload?.id ?? payload?.idTipoEvento,
  name: payload?.nombre ?? payload?.name ?? '',
});

const normalizeEvent = (payload, fallbackId, typeName = '') => {
  const source = payload || {};

  return {
    id: source.id ?? source.idEvento ?? fallbackId,
    idUsuario: source.idUsuario ?? getDefaultUserId(),
    idTipoEvento: source.idTipoEvento ?? source.typeId ?? null,
    nombre: source.nombre ?? source.name ?? 'Evento sin nombre',
    cliente: source.cliente ?? source.client ?? 'Sin cliente',
    fechaEvento: source.fechaEvento ?? source.date ?? '',
    lugar: source.lugar ?? source.location ?? 'Sin lugar',
    tipo:
      source.tipoEvento?.nombre ??
      source.tipoEventoNombre ??
      (typeName || source.type || 'Sin tipo'),
  };
};

const requireEventResponse = (payload, fallbackId, typeName = '') => {
  const source = payload || {};
  const id = source.id ?? source.idEvento;

  if (id === undefined || id === null) {
    throw new Error(
      'La respuesta del servidor no incluye el evento solicitado.'
    );
  }

  return normalizeEvent(source, id, typeName);
};

const eventToForm = (event) => ({
  nombre: event.nombre,
  cliente: event.cliente,
  fecha: toDateInputValue(event.fechaEvento),
  lugar: event.lugar,
});

const normalizeSubtask = (payload, fallbackId) => {
  const source = payload || {};

  return {
    id: source.id ?? source.idSubtarea ?? fallbackId,
    title: source.nombreGestion ?? source.title ?? source.name ?? '',
    hours: source.horasEstimadas ?? source.hours ?? '',
    date: source.fechaObjetivo ?? source.date ?? '',
    state: source.estado ?? source.state ?? 'pendiente',
  };
};

const requireSubtaskResponse = (payload, currentSubtask = null) => {
  const source = payload || {};
  const id = source.id ?? source.idSubtarea;

  if (id === undefined || id === null) {
    throw new Error(
      'La respuesta del servidor no incluye la subtarea actualizada.'
    );
  }

  return normalizeSubtask(
    currentSubtask ? { ...currentSubtask, ...source } : source,
    id
  );
};

const validateSubtask = (formData) => {
  const newErrors = {};

  if (!formData.title.trim()) {
    newErrors.title =
      'Dejaste el nombre vacío. Ingresa qué gestión necesitas realizar.';
  }

  const hours = Number(formData.hours);

  if (!formData.hours) {
    newErrors.hours = 'Faltan las horas estimadas. Ingresa un valor mayor a 0.';
  } else if (!Number.isFinite(hours)) {
    newErrors.hours =
      'Ingresaste un valor no válido. Asigna al menos 1 hora de esfuerzo.';
  } else if (hours <= 0) {
    newErrors.hours =
      'Ingresaste 0 o menos. Asigna al menos 1 hora de esfuerzo.';
  } else if (!Number.isInteger(hours)) {
    newErrors.hours =
      'Ingresaste una fracción de hora. Ingresa un número entero de horas.';
  }

  if (!formData.date) {
    newErrors.date =
      'Falta la fecha límite. Selecciona cuándo debe estar lista.';
  } else if (isDateInPast(formData.date)) {
    newErrors.date = getPastDateMessage('La fecha objetivo');
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
  } else if (isDateInPast(formData.fecha)) {
    newErrors.fecha = getPastDateMessage('La fecha del evento');
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
  const { notifySuccess, notifyError } = useNotifications();
  const navigate = useNavigate();
  const goToProgress = () => navigate('/progreso', { replace: true });
  const [event, setEvent] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialSubtaskData);
  const [errors, setErrors] = useState({});
  const [isSavingSubtask, setIsSavingSubtask] = useState(false);

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

  const [isEventDeleteOpen, setIsEventDeleteOpen] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [eventDeleteError, setEventDeleteError] = useState('');

  const [updatingSubtaskId, setUpdatingSubtaskId] = useState(null);
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskData, setEditingSubtaskData] = useState({
    title: '',
    hours: '',
    date: '',
  });
  const [editingErrors, setEditingErrors] = useState({});
  const [isSavingSubtaskEdit, setIsSavingSubtaskEdit] = useState(false);
  const eventFormRef = useRef(null);
  const subtaskFormRef = useRef(null);
  const editingSubtaskFormRef = useRef(null);

  const getSubtaskDateError = (value) =>
    isDateInPast(value) ? getPastDateMessage('La fecha objetivo') : '';

  const getEventDateError = (value) =>
    isDateInPast(value) ? getPastDateMessage('La fecha del evento') : '';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const [eventResponse, subtasksResponse, typesResponse] =
        await Promise.all([
          api.getEvent(id),
          api.getSubtasks(id),
          api.listEventTypes(),
        ]);
      const rawEvent = unwrapData(eventResponse);
      const rawTypes = unwrapData(typesResponse);
      const normalizedTypes = (Array.isArray(rawTypes) ? rawTypes : [])
        .map(normalizeEventType)
        .filter((type) => type.id && type.name);
      if (normalizedTypes.length === 0) {
        throw new Error(
          'No pudimos cargar el catálogo de tipos de evento. Inténtalo de nuevo.'
        );
      }
      const typeNames = new Map(
        normalizedTypes.map((type) => [String(type.id), type.name])
      );
      const loadedEvent = requireEventResponse(
        rawEvent,
        id,
        typeNames.get(String(rawEvent?.idTipoEvento))
      );
      const loadedSubtasks = unwrapData(subtasksResponse);

      setEvent(loadedEvent);
      setEventForm(eventToForm(loadedEvent));
      setSubtasks(
        Array.isArray(loadedSubtasks)
          ? loadedSubtasks.map((subtask) => requireSubtaskResponse(subtask))
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

  const workload = useMemo(() => getTaskMetrics(subtasks), [subtasks]);

  const updateSubtaskField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({
      ...current,
      [field]: field === 'date' ? getSubtaskDateError(value) : '',
    }));
  };

  const validateSubtaskDateOnBlur = () => {
    const dateError = getSubtaskDateError(formData.date);

    if (dateError) {
      setErrors((current) => ({ ...current, date: dateError }));
    }
  };

  const startEditingSubtask = (subtask) => {
    setEditingSubtaskId(subtask.id);
    setEditingSubtaskData({
      title: subtask.title,
      hours: String(subtask.hours ?? ''),
      date: toDateInputValue(subtask.date),
    });
    setEditingErrors({});
  };

  const cancelEditingSubtask = () => {
    setEditingSubtaskId(null);
    setEditingSubtaskData({ title: '', hours: '', date: '' });
    setEditingErrors({});
  };

  const updateEditingSubtaskField = (field, value) => {
    setEditingSubtaskData((current) => ({ ...current, [field]: value }));
    setEditingErrors((current) => ({
      ...current,
      [field]: field === 'date' ? getSubtaskDateError(value) : '',
    }));
  };

  const validateEditingSubtaskDateOnBlur = () => {
    const dateError = getSubtaskDateError(editingSubtaskData.date);

    if (dateError) {
      setEditingErrors((current) => ({ ...current, date: dateError }));
    }
  };

  const updateEventField = (field, value) => {
    setEventForm((current) => ({ ...current, [field]: value }));
    setEventErrors((current) => ({
      ...current,
      [field]: field === 'fecha' ? getEventDateError(value) : '',
    }));
  };

  const validateEventDateOnBlur = () => {
    const dateError = getEventDateError(eventForm.fecha);

    if (dateError) {
      setEventErrors((current) => ({ ...current, fecha: dateError }));
    }
  };

  const handleAddSubtask = async (event) => {
    event.preventDefault();

    if (isSavingSubtask) {
      return;
    }

    const validationErrors = validateSubtask(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      focusFirstInvalidField(subtaskFormRef, validationErrors);
      return;
    }

    setErrors({});
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
      const newSubtask = requireSubtaskResponse(response);

      setSubtasks((current) => [...current, newSubtask]);
      setFormData(initialSubtaskData);
      setShowForm(false);
      notifySuccess({
        icon: 'check',
        message: 'Gestión añadida correctamente.',
      });
    } catch (error) {
      notifyError({
        title: 'No pudimos añadir la gestión',
        message: getErrorMessage(error),
      });
    } finally {
      setIsSavingSubtask(false);
    }
  };

  const handleToggleSubtask = async (subtask) => {
    if (updatingSubtaskId === subtask.id) {
      return;
    }

    const nextState = subtask.state === 'ejecutada' ? 'pendiente' : 'ejecutada';

    setUpdatingSubtaskId(subtask.id);

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
      const updatedSubtask = requireSubtaskResponse(response, subtask);
      setSubtasks((current) =>
        current.map((item) => (item.id === subtask.id ? updatedSubtask : item))
      );
      notifySuccess({
        icon: nextState === 'ejecutada' ? 'check' : 'undo',
        message:
          nextState === 'ejecutada'
            ? 'Gestión marcada como completada.'
            : 'Gestión reabierta.',
      });
    } catch (error) {
      notifyError({
        title: 'No pudimos actualizar el estado',
        message: getErrorMessage(error),
      });
    } finally {
      setUpdatingSubtaskId(null);
    }
  };

  const handleSaveSubtask = async (event) => {
    event.preventDefault();

    if (isSavingSubtaskEdit) {
      return;
    }

    if (!editingSubtaskId) {
      return;
    }

    const validationErrors = validateSubtask(editingSubtaskData);
    if (Object.keys(validationErrors).length > 0) {
      setEditingErrors(validationErrors);
      focusFirstInvalidField(editingSubtaskFormRef, validationErrors);
      return;
    }

    setEditingErrors({});
    setIsSavingSubtaskEdit(true);

    try {
      const response = unwrapData(
        await api.updateSubtaskDetails(editingSubtaskId, {
          nombreGestion: editingSubtaskData.title.trim(),
          horasEstimadas: Number(editingSubtaskData.hours),
          fechaObjetivo: editingSubtaskData.date,
        })
      );
      const currentSubtask = subtasks.find(
        (subtask) => subtask.id === editingSubtaskId
      );
      const updatedSubtask = requireSubtaskResponse(response, currentSubtask);

      setSubtasks((current) =>
        current.map((subtask) =>
          subtask.id === editingSubtaskId ? updatedSubtask : subtask
        )
      );
      cancelEditingSubtask();
      notifySuccess({
        icon: 'edit',
        message: 'Gestión actualizada correctamente.',
      });
    } catch (error) {
      notifyError({
        title: 'No pudimos guardar los cambios',
        message: getErrorMessage(error),
      });
    } finally {
      setIsSavingSubtaskEdit(false);
    }
  };

  const handleDeleteSubtask = async () => {
    if (!deleteTarget || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      await api.deleteSubtask(deleteTarget.id);
      const deletedTitle = deleteTarget.title;
      setSubtasks((current) =>
        current.filter((subtask) => subtask.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
      notifySuccess({
        icon: 'trash',
        message: `La gestión “${deletedTitle}” se eliminó correctamente.`,
      });
    } catch (error) {
      setDeleteError(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event || isDeletingEvent) {
      return;
    }

    setIsDeletingEvent(true);
    setEventDeleteError('');

    try {
      await api.deleteEvent(event.id);
      notifySuccess({
        icon: 'trash',
        message: `El evento “${event.nombre}” se eliminó correctamente.`,
      });
      setIsEventDeleteOpen(false);
      setEventDeleteError('');
      goToProgress();
    } catch (error) {
      setEventDeleteError(getErrorMessage(error));
    } finally {
      setIsDeletingEvent(false);
    }
  };

  const handleSaveEvent = async (submitEvent) => {
    submitEvent.preventDefault();

    if (isSavingEvent) {
      return;
    }

    const validationErrors = validateEventForm(eventForm);

    if (Object.keys(validationErrors).length > 0) {
      setEventErrors(validationErrors);
      focusFirstInvalidField(eventFormRef, validationErrors);
      return;
    }

    setEventErrors({});
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
      const responseId = response?.id ?? response?.idEvento;
      if (responseId === undefined || responseId === null) {
        throw new Error(
          'La respuesta del servidor no incluye el evento actualizado.'
        );
      }
      const updatedEvent = requireEventResponse(
        { ...event, ...payload, ...response },
        responseId,
        event.tipo
      );

      setEvent(updatedEvent);
      setEventForm(eventToForm(updatedEvent));
      setIsEditingEvent(false);
      notifySuccess({
        icon: 'edit',
        message: 'Evento actualizado correctamente.',
      });
    } catch (error) {
      notifyError({
        title: 'No pudimos guardar el evento',
        message: getErrorMessage(error),
      });
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
        Cargando información...
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
      <Card className="p-6">
        <div className="space-y-4 border-b border-gray-200 pb-5">
          <Button
            type="button"
            variant="neutral"
            onClick={goToProgress}
            disabled={isSavingEvent || isDeletingEvent}
          >
            <ArrowLeft aria-hidden="true" className="mr-1 inline size-4" />
            Volver a eventos
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
              {!isEditingEvent && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setIsEditingEvent(true)}
                  disabled={isSavingEvent || isDeletingEvent}
                >
                  <Pencil aria-hidden="true" className="mr-1 inline size-4" />
                  Editar evento
                </Button>
              )}
              {!isEditingEvent && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    setEventDeleteError('');
                    setIsEventDeleteOpen(true);
                  }}
                  disabled={isSavingEvent || isDeletingEvent}
                >
                  <Trash2 aria-hidden="true" className="mr-1 inline size-4" />
                  Eliminar evento
                </Button>
              )}
            </div>
          </div>
        </div>

        {isEditingEvent ? (
          <form
            ref={eventFormRef}
            onSubmit={handleSaveEvent}
            className="mt-6 space-y-6"
            noValidate
            aria-busy={isSavingEvent}
          >
            <fieldset className="space-y-4 border-0 p-0">
              <legend className="mb-3 text-sm font-semibold text-gray-800">
                ¿Qué evento es?
              </legend>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                    placeholder="Ej: Boda de Carlos y Laura"
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
                      eventErrors.cliente
                        ? 'edit-event-client-error'
                        : undefined
                    }
                    className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      eventErrors.cliente ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: María Pérez"
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
              </div>
            </fieldset>

            <fieldset className="space-y-4 border-0 p-0">
              <legend className="mb-3 text-sm font-semibold text-gray-800">
                ¿Cuándo y dónde?
              </legend>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                    min={getToday()}
                    value={eventForm.fecha}
                    onChange={(event) =>
                      updateEventField('fecha', event.target.value)
                    }
                    onBlur={validateEventDateOnBlur}
                    aria-invalid={Boolean(eventErrors.fecha)}
                    aria-describedby={`edit-event-date-help${
                      eventErrors.fecha ? ' edit-event-date-error' : ''
                    }`}
                    className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      eventErrors.fecha ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  <p
                    id="edit-event-date-help"
                    className="mt-1 text-xs text-gray-500"
                  >
                    Selecciona hoy o una fecha futura.
                  </p>
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
                      eventErrors.lugar
                        ? 'edit-event-location-error'
                        : undefined
                    }
                    className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      eventErrors.lugar ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Salón Campestre, Yumbo"
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
              </div>
            </fieldset>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="neutral"
                onClick={() => {
                  setIsEditingEvent(false);
                  setEventErrors({});
                }}
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
                {getEventTypeIcon(event.tipo, {
                  className: 'mr-1 inline size-4 align-text-bottom',
                })}
                Tipo
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{event.tipo}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                <CalendarDays
                  aria-hidden="true"
                  className="mr-1 inline size-4 align-text-bottom"
                />
                Fecha
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(event.fechaEvento)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                <UserRound
                  aria-hidden="true"
                  className="mr-1 inline size-4 align-text-bottom"
                />
                Cliente / contacto
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{event.cliente}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                <MapPin
                  aria-hidden="true"
                  className="mr-1 inline size-4 align-text-bottom"
                />
                Lugar
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{event.lugar}</dd>
            </div>
          </dl>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Plan inicial de subtareas
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {subtasks.length === 0
                ? 'Añade la primera gestión para comenzar.'
                : `${workload.completed} de ${subtasks.length} tareas completadas.`}
            </p>
          </div>
          {!showForm && subtasks.length > 0 && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowForm(true)}
            >
              <Plus aria-hidden="true" className="mr-1 inline size-4" />
              Añadir gestión
            </Button>
          )}
        </div>

        {subtasks.length > 0 && (
          <WorkloadSummary
            metrics={workload}
            progressLabel="Progreso por horas"
            className="py-5"
          />
        )}

        {subtasks.length === 0 && !showForm && (
          <EmptyState
            title="¿Aún no hay gestiones logísticas?"
            actionIcon={Plus}
            actionLabel="Añadir gestión"
            onAction={() => setShowForm(true)}
          />
        )}

        {showForm && (
          <form
            ref={subtaskFormRef}
            onSubmit={handleAddSubtask}
            className="space-y-4 rounded-md border bg-gray-50 p-4"
            noValidate
            aria-busy={isSavingSubtask}
          >
            <h4 className="text-sm font-semibold text-gray-700">
              Nueva gestión logística
            </h4>

            <fieldset className="space-y-4 border-0 p-0">
              <legend className="text-sm font-semibold text-gray-700">
                ¿Qué gestión necesitas?
              </legend>
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
            </fieldset>

            <fieldset className="space-y-4 border-0 p-0">
              <legend className="text-sm font-semibold text-gray-700">
                ¿Cuánto esfuerzo requiere y cuándo debe estar lista?
              </legend>
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
                    min={getToday()}
                    value={formData.date}
                    onChange={(event) =>
                      updateSubtaskField('date', event.target.value)
                    }
                    onBlur={validateSubtaskDateOnBlur}
                    aria-invalid={Boolean(errors.date)}
                    aria-describedby={`subtask-date-help${
                      errors.date ? ' subtask-date-error' : ''
                    }`}
                    className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      errors.date ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  <p
                    id="subtask-date-help"
                    className="mt-1 text-xs text-gray-500"
                  >
                    Selecciona hoy o una fecha futura.
                  </p>
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
            </fieldset>

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

        {editingSubtaskId !== null && (
          <form
            ref={editingSubtaskFormRef}
            onSubmit={handleSaveSubtask}
            className="mb-5 space-y-4 rounded-md border border-blue-200 bg-blue-50/40 p-4"
            noValidate
            aria-busy={isSavingSubtaskEdit}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">
                  Editar gestión
                </h4>
                <p className="mt-1 text-xs text-gray-600">
                  Modifica el nombre, la fecha límite o las horas estimadas.
                </p>
              </div>
              <Button
                type="button"
                variant="neutral"
                onClick={cancelEditingSubtask}
                disabled={isSavingSubtaskEdit}
              >
                Cancelar
              </Button>
            </div>

            <fieldset className="space-y-4 border-0 p-0">
              <legend className="text-sm font-semibold text-gray-700">
                ¿Qué gestión necesitas?
              </legend>
              <div>
                <label
                  htmlFor="edit-subtask-title"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Nombre de la gestión *
                </label>
                <input
                  id="edit-subtask-title"
                  name="title"
                  type="text"
                  value={editingSubtaskData.title}
                  onChange={(event) =>
                    updateEditingSubtaskField('title', event.target.value)
                  }
                  aria-invalid={Boolean(editingErrors.title)}
                  aria-describedby={
                    editingErrors.title ? 'edit-subtask-title-error' : undefined
                  }
                  className={`w-full rounded-md border bg-white p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    editingErrors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Reservar salón de eventos"
                  required
                />
                {editingErrors.title && (
                  <p
                    id="edit-subtask-title-error"
                    role="alert"
                    className="mt-1 text-xs text-red-600"
                  >
                    {editingErrors.title}
                  </p>
                )}
              </div>
            </fieldset>

            <fieldset className="space-y-4 border-0 p-0">
              <legend className="text-sm font-semibold text-gray-700">
                ¿Cuánto esfuerzo requiere y cuándo debe estar lista?
              </legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="edit-subtask-hours"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Horas estimadas *
                  </label>
                  <input
                    id="edit-subtask-hours"
                    name="hours"
                    type="number"
                    min="1"
                    step="1"
                    value={editingSubtaskData.hours}
                    onChange={(event) =>
                      updateEditingSubtaskField('hours', event.target.value)
                    }
                    aria-invalid={Boolean(editingErrors.hours)}
                    aria-describedby={
                      editingErrors.hours
                        ? 'edit-subtask-hours-error'
                        : undefined
                    }
                    className={`w-full rounded-md border bg-white p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      editingErrors.hours ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: 4"
                    required
                  />
                  {editingErrors.hours && (
                    <p
                      id="edit-subtask-hours-error"
                      role="alert"
                      className="mt-1 text-xs text-red-600"
                    >
                      {editingErrors.hours}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="edit-subtask-date"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Fecha límite *
                  </label>
                  <input
                    id="edit-subtask-date"
                    name="date"
                    type="date"
                    min={getToday()}
                    value={editingSubtaskData.date}
                    onChange={(event) =>
                      updateEditingSubtaskField('date', event.target.value)
                    }
                    onBlur={validateEditingSubtaskDateOnBlur}
                    aria-invalid={Boolean(editingErrors.date)}
                    aria-describedby={`edit-subtask-date-help${
                      editingErrors.date ? ' edit-subtask-date-error' : ''
                    }`}
                    className={`w-full rounded-md border bg-white p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      editingErrors.date ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  <p
                    id="edit-subtask-date-help"
                    className="mt-1 text-xs text-gray-500"
                  >
                    Selecciona hoy o una fecha futura.
                  </p>
                  {editingErrors.date && (
                    <p
                      id="edit-subtask-date-error"
                      role="alert"
                      className="mt-1 text-xs text-red-600"
                    >
                      {editingErrors.date}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={isSavingSubtaskEdit}
                aria-busy={isSavingSubtaskEdit}
              >
                {isSavingSubtaskEdit ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        )}

        {subtasks.length > 0 && (
          <ul className="space-y-2" aria-live="polite">
            {subtasks.map((subtask) => (
              <Card
                as="li"
                key={subtask.id}
                className="p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
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
                    <Badge variant="neutral">{subtask.hours} hrs</Badge>
                    <Badge
                      variant={
                        subtask.state === 'ejecutada' ? 'success' : 'pending'
                      }
                    >
                      {getStateLabel(subtask.state)}
                    </Badge>
                    <Button
                      type="button"
                      variant="primary"
                      className="px-2 py-1 text-xs"
                      onClick={() => startEditingSubtask(subtask)}
                      disabled={
                        updatingSubtaskId === subtask.id ||
                        isSavingSubtaskEdit ||
                        editingSubtaskId === subtask.id
                      }
                      aria-label={`Editar ${subtask.title}`}
                    >
                      <Pencil
                        aria-hidden="true"
                        className="mr-1 inline size-3.5"
                      />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant={
                        subtask.state === 'ejecutada' ? 'neutral' : 'success'
                      }
                      className="px-2 py-1 text-xs"
                      onClick={() => void handleToggleSubtask(subtask)}
                      disabled={
                        updatingSubtaskId === subtask.id ||
                        isSavingSubtaskEdit ||
                        editingSubtaskId === subtask.id
                      }
                      aria-label={
                        subtask.state === 'ejecutada'
                          ? `Marcar ${subtask.title} como pendiente`
                          : `Marcar ${subtask.title} como completada`
                      }
                    >
                      {subtask.state === 'ejecutada' ? (
                        <>
                          <Undo2
                            aria-hidden="true"
                            className="mr-1 inline size-3.5"
                          />
                          Reabrir
                        </>
                      ) : (
                        <>
                          <Check
                            aria-hidden="true"
                            className="mr-1 inline size-3.5"
                          />
                          Completar
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className="px-2 py-1 text-xs"
                      onClick={() => {
                        setDeleteError('');
                        setDeleteTarget(subtask);
                      }}
                      disabled={
                        updatingSubtaskId === subtask.id ||
                        isSavingSubtaskEdit ||
                        editingSubtaskId === subtask.id
                      }
                      aria-label={`Eliminar ${subtask.title}`}
                    >
                      <Trash2
                        aria-hidden="true"
                        className="mr-1 inline size-3.5"
                      />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </Card>

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

      <ConfirmModal
        open={isEventDeleteOpen}
        title="¿Eliminar evento?"
        message="Esta acción borrará el evento y su logística asociada. No se puede deshacer."
        confirmLabel="Eliminar"
        onCancel={() => {
          if (!isDeletingEvent) {
            setIsEventDeleteOpen(false);
            setEventDeleteError('');
          }
        }}
        onConfirm={() => void handleDeleteEvent()}
        isConfirming={isDeletingEvent}
        error={eventDeleteError}
      />
    </div>
  );
}
