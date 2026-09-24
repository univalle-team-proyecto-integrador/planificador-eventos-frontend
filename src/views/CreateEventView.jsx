import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '../components/states/ErrorState';
import { Button } from '../components/ui/Button';
import {
  api,
  getDefaultUserId,
  toApiDateTime,
  unwrapData,
} from '../services/api';

const initialFormData = {
  nombre: '',
  tipoEvento: '',
  cliente: '',
  fecha: '',
  lugar: '',
};

const getToday = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const getErrorMessage = (error) =>
  error?.message || 'No pudimos guardar el evento. Inténtalo de nuevo.';

const getTypesErrorMessage = (error) =>
  error?.message ||
  'No pudimos cargar los tipos de evento. Inténtalo de nuevo.';

const normalizeEventType = (payload) => ({
  id: payload?.id ?? payload?.idTipoEvento,
  name: payload?.nombre ?? payload?.name ?? '',
});

export function CreateEventView() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [eventTypes, setEventTypes] = useState([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [typesError, setTypesError] = useState('');

  const loadEventTypes = useCallback(async () => {
    setIsLoadingTypes(true);
    setEventTypes([]);
    setTypesError('');

    try {
      const response = unwrapData(await api.listEventTypes());
      const types = Array.isArray(response)
        ? response
            .map(normalizeEventType)
            .filter((type) => type.id && type.name)
        : [];

      if (types.length === 0) {
        setTypesError(
          'No hay tipos de evento configurados. Contacta al administrador del servicio.'
        );
        return;
      }

      setEventTypes(types);
    } catch (error) {
      setTypesError(getTypesErrorMessage(error));
    } finally {
      setIsLoadingTypes(false);
    }
  }, []);

  useEffect(() => {
    // El catálogo se carga antes de permitir la creación de un evento.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadEventTypes();
  }, [loadEventTypes]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre =
        'Dejaste el nombre vacío. Ingresa un título para identificar el evento.';
    }
    if (!formData.tipoEvento) {
      newErrors.tipoEvento =
        'No has seleccionado el tipo. Elige una opción de la lista desplegable.';
    }
    if (!formData.cliente.trim()) {
      newErrors.cliente =
        'Falta el contacto. Escribe el nombre del cliente o responsable.';
    }
    if (!formData.fecha) {
      newErrors.fecha =
        'La fecha está vacía. Selecciona el día en que se realizará el evento.';
    } else if (formData.fecha < getToday()) {
      newErrors.fecha =
        'La fecha ya pasó. Selecciona hoy o una fecha futura para el evento.';
    }
    if (!formData.lugar.trim()) {
      newErrors.lugar =
        'El lugar está vacío. Indica la ubicación donde se llevará a cabo.';
    }

    return newErrors;
  };

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setSubmitError('');
  };

  const submitEvent = async () => {
    if (isLoadingTypes) {
      setSubmitError('Espera a que terminen de cargar los tipos de evento.');
      return;
    }

    if (typesError) {
      setSubmitError(typesError);
      return;
    }

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitError('');
      return;
    }

    setErrors({});
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const response = unwrapData(
        await api.createEvent({
          idUsuario: getDefaultUserId(),
          idTipoEvento: Number(formData.tipoEvento),
          nombre: formData.nombre.trim(),
          cliente: formData.cliente.trim(),
          fechaEvento: toApiDateTime(formData.fecha),
          lugar: formData.lugar.trim(),
        })
      );

      const eventId = response?.id ?? response?.idEvento;
      if (!eventId) {
        throw new Error(
          'La respuesta del servidor no incluye el evento creado.'
        );
      }

      navigate(`/evento/${eventId}`);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    void submitEvent();
  };

  const fieldProps = (field) => ({
    id: `event-${field}`,
    name: field,
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': errors[field] ? `event-${field}-error` : undefined,
  });

  return (
    <div className="mx-auto mt-6 max-w-3xl rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
          US-01 · Crear evento
        </p>
        <h2 className="text-2xl font-bold text-gray-900">Crear nuevo evento</h2>
        <p className="mt-2 text-sm text-gray-600">
          Registra los datos esenciales para preparar el plan logístico.
        </p>
      </div>

      {submitError && (
        <div className="mb-6">
          <ErrorState
            title="No pudimos guardar el evento"
            message={submitError}
            onRetry={() => void submitEvent()}
            isRetrying={isSubmitting}
          />
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        noValidate
        aria-busy={isSubmitting || isLoadingTypes}
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="event-nombre"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nombre del evento *
            </label>
            <input
              {...fieldProps('nombre')}
              type="text"
              className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.nombre ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: Boda de Carlos y Laura"
              value={formData.nombre}
              onChange={(event) => updateField('nombre', event.target.value)}
              autoComplete="off"
              required
            />
            {errors.nombre && (
              <p
                id="event-nombre-error"
                role="alert"
                className="mt-1 text-xs text-red-600"
              >
                {errors.nombre}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="event-tipoEvento"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Tipo de evento *
            </label>
            <select
              {...fieldProps('tipoEvento')}
              aria-invalid={Boolean(errors.tipoEvento || typesError)}
              aria-describedby={
                typesError
                  ? 'event-tipoEvento-load-error'
                  : errors.tipoEvento
                    ? 'event-tipoEvento-error'
                    : undefined
              }
              className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 ${
                errors.tipoEvento || typesError
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              value={formData.tipoEvento}
              onChange={(event) =>
                updateField('tipoEvento', event.target.value)
              }
              disabled={isLoadingTypes || Boolean(typesError)}
              required
            >
              {isLoadingTypes ? (
                <option value="">Cargando tipos...</option>
              ) : typesError ? (
                <option value="">No se pudieron cargar los tipos</option>
              ) : (
                <>
                  <option value="">Selecciona un tipo...</option>
                  {eventTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {errors.tipoEvento && (
              <p
                id="event-tipoEvento-error"
                role="alert"
                className="mt-1 text-xs text-red-600"
              >
                {errors.tipoEvento}
              </p>
            )}
            {typesError && (
              <div
                id="event-tipoEvento-load-error"
                role="alert"
                className="mt-1 flex items-center justify-between gap-2 text-xs text-red-600"
              >
                <span>{typesError}</span>
                <button
                  type="button"
                  className="font-semibold underline hover:text-red-800"
                  onClick={() => void loadEventTypes()}
                  disabled={isLoadingTypes}
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="event-cliente"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Cliente / contacto *
            </label>
            <input
              {...fieldProps('cliente')}
              type="text"
              className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.cliente ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: María Pérez"
              value={formData.cliente}
              onChange={(event) => updateField('cliente', event.target.value)}
              autoComplete="organization"
              required
            />
            {errors.cliente && (
              <p
                id="event-cliente-error"
                role="alert"
                className="mt-1 text-xs text-red-600"
              >
                {errors.cliente}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="event-fecha"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Fecha del evento *
            </label>
            <input
              {...fieldProps('fecha')}
              type="date"
              min={getToday()}
              className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.fecha ? 'border-red-500' : 'border-gray-300'
              }`}
              value={formData.fecha}
              onChange={(event) => updateField('fecha', event.target.value)}
              required
            />
            {errors.fecha && (
              <p
                id="event-fecha-error"
                role="alert"
                className="mt-1 text-xs text-red-600"
              >
                {errors.fecha}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="event-lugar"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Lugar del evento *
          </label>
          <input
            {...fieldProps('lugar')}
            type="text"
            className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              errors.lugar ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: Salón Campestre, Yumbo"
            value={formData.lugar}
            onChange={(event) => updateField('lugar', event.target.value)}
            autoComplete="street-address"
            required
          />
          {errors.lugar && (
            <p
              id="event-lugar-error"
              role="alert"
              className="mt-1 text-xs text-red-600"
            >
              {errors.lugar}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
          <Button
            type="button"
            variant="neutral"
            onClick={() => navigate('/hoy')}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || isLoadingTypes || Boolean(typesError)}
            aria-busy={isSubmitting || isLoadingTypes}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar evento'}
          </Button>
        </div>
      </form>
    </div>
  );
}
