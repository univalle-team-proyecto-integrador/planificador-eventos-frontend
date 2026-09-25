import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '../components/states/ErrorState';
import { Button } from '../components/ui/Button';
import { FieldSuccess } from '../components/ui/FieldSuccess';
import { useNotifications } from '../providers/notifications-context';
import {
  api,
  getDefaultUserId,
  toApiDateTime,
  unwrapData,
} from '../services/api';
import { focusFirstInvalidField } from '../utils/formFocus';
import {
  getPastDateMessage,
  getToday,
  isDateInPast,
} from '../utils/dateValidation';

const initialFormData = {
  nombre: '',
  tipoEvento: '',
  cliente: '',
  fecha: '',
  lugar: '',
};

const SUCCESS_MESSAGES = {
  nombre: '¡Listo! Nombre válido.',
  tipoEvento: 'Bien, tipo seleccionado.',
  cliente: '¡Listo! Cliente registrado.',
  fecha: 'Bien, fecha válida.',
  lugar: '¡Listo! Lugar correcto.',
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
  const { notifySuccess, notifyError } = useNotifications();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [eventTypes, setEventTypes] = useState([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [typesError, setTypesError] = useState('');
  const formRef = useRef(null);

  const getDateError = (value) =>
    isDateInPast(value) ? getPastDateMessage('La fecha del evento') : '';

  const getFieldError = (field, data) => {
    switch (field) {
      case 'nombre':
        return data.nombre.trim()
          ? ''
          : 'Dejaste el nombre vacío. Ingresa un título para identificar el evento.';
      case 'tipoEvento':
        return data.tipoEvento
          ? ''
          : 'No has seleccionado el tipo. Elige una opción de la lista desplegable.';
      case 'cliente':
        return data.cliente.trim()
          ? ''
          : 'Falta el contacto. Escribe el nombre del cliente o responsable.';
      case 'fecha':
        if (!data.fecha) {
          return 'La fecha está vacía. Selecciona el día en que se realizará el evento.';
        }
        return getDateError(data.fecha);
      case 'lugar':
        return data.lugar.trim()
          ? ''
          : 'El lugar está vacío. Indica la ubicación donde se llevará a cabo.';
      default:
        return '';
    }
  };

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
    } else if (isDateInPast(formData.fecha)) {
      newErrors.fecha = getPastDateMessage('La fecha del evento');
    }
    if (!formData.lugar.trim()) {
      newErrors.lugar =
        'El lugar está vacío. Indica la ubicación donde se llevará a cabo.';
    }

    return newErrors;
  };

  const markTouched = (field) => {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({
      ...current,
      [field]: getFieldError(field, formData),
    }));
  };

  const updateField = (field, value) => {
    const next = { ...formData, [field]: value };
    setFormData(next);

    if (touched[field]) {
      setErrors((current) => ({
        ...current,
        [field]: getFieldError(field, next),
      }));
    }

    setSubmitError('');
  };

  const isFieldSuccess = (field) =>
    Boolean(touched[field]) &&
    !errors[field] &&
    Boolean(String(formData[field] ?? '').trim());

  const inputBorderClass = (field) =>
    errors[field]
      ? 'border-red-500'
      : isFieldSuccess(field)
        ? 'border-emerald-500'
        : 'border-gray-300';

  const submitEvent = async () => {
    if (isSubmitting) {
      return;
    }

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
      focusFirstInvalidField(formRef, validationErrors);
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

      notifySuccess({
        icon: 'check',
        message: 'Evento creado correctamente.',
      });
      navigate(`/evento/${eventId}`);
    } catch (error) {
      notifyError({
        title: 'No pudimos guardar el evento',
        message: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    void submitEvent();
  };

  const fieldProps = (field) => {
    const feedbackIds = [
      errors[field] ? `event-${field}-error` : '',
      field === 'fecha' && !isFieldSuccess('fecha') ? 'event-fecha-help' : '',
      isFieldSuccess(field) ? `event-${field}-success` : '',
    ]
      .filter(Boolean)
      .join(' ');

    return {
      id: `event-${field}`,
      name: field,
      'aria-invalid': Boolean(errors[field]),
      'aria-describedby': feedbackIds || undefined,
    };
  };

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

      {typesError && (
        <div className="mb-5">
          <ErrorState
            id="event-types-error"
            title="No pudimos cargar los tipos de evento"
            message={typesError}
            onRetry={() => void loadEventTypes()}
            isRetrying={isLoadingTypes}
          />
        </div>
      )}

      {submitError && (
        <p
          role="alert"
          className="mb-5 rounded-md bg-amber-50 p-3 text-sm text-amber-700"
        >
          {submitError}
        </p>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-6"
        noValidate
        aria-busy={isSubmitting || isLoadingTypes}
      >
        <fieldset className="space-y-4 border-0 p-0">
          <legend className="mb-3 text-sm font-semibold text-gray-800">
            ¿Qué evento es?
          </legend>
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
                className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${inputBorderClass('nombre')}`}
                placeholder="Ej: Boda de Carlos y Laura"
                value={formData.nombre}
                onChange={(event) => updateField('nombre', event.target.value)}
                onBlur={() => markTouched('nombre')}
                autoComplete="off"
                required
              />
              {errors.nombre ? (
                <p
                  id="event-nombre-error"
                  role="alert"
                  className="mt-1 text-xs text-red-600"
                >
                  {errors.nombre}
                </p>
              ) : isFieldSuccess('nombre') ? (
                <FieldSuccess id="event-nombre-success">
                  {SUCCESS_MESSAGES.nombre}
                </FieldSuccess>
              ) : null}
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
                    ? 'event-types-error'
                    : errors.tipoEvento
                      ? 'event-tipoEvento-error'
                      : isFieldSuccess('tipoEvento')
                        ? 'event-tipoEvento-success'
                        : undefined
                }
                className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 ${
                  errors.tipoEvento || typesError
                    ? 'border-red-500'
                    : isFieldSuccess('tipoEvento')
                      ? 'border-emerald-500'
                      : 'border-gray-300'
                }`}
                value={formData.tipoEvento}
                onChange={(event) =>
                  updateField('tipoEvento', event.target.value)
                }
                onBlur={() => markTouched('tipoEvento')}
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
              {!errors.tipoEvento &&
                !typesError &&
                isFieldSuccess('tipoEvento') && (
                  <FieldSuccess id="event-tipoEvento-success">
                    {SUCCESS_MESSAGES.tipoEvento}
                  </FieldSuccess>
                )}
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4 border-0 p-0">
          <legend className="mb-3 text-sm font-semibold text-gray-800">
            ¿Cuándo, dónde y con quién?
          </legend>
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
                className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${inputBorderClass('cliente')}`}
                placeholder="Ej: María Pérez"
                value={formData.cliente}
                onChange={(event) => updateField('cliente', event.target.value)}
                onBlur={() => markTouched('cliente')}
                autoComplete="organization"
                required
              />
              {errors.cliente ? (
                <p
                  id="event-cliente-error"
                  role="alert"
                  className="mt-1 text-xs text-red-600"
                >
                  {errors.cliente}
                </p>
              ) : isFieldSuccess('cliente') ? (
                <FieldSuccess id="event-cliente-success">
                  {SUCCESS_MESSAGES.cliente}
                </FieldSuccess>
              ) : null}
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
                className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${inputBorderClass('fecha')}`}
                value={formData.fecha}
                onChange={(event) => updateField('fecha', event.target.value)}
                onBlur={() => markTouched('fecha')}
                required
              />
              {errors.fecha ? (
                <p
                  id="event-fecha-error"
                  role="alert"
                  className="mt-1 text-xs text-red-600"
                >
                  {errors.fecha}
                </p>
              ) : isFieldSuccess('fecha') ? (
                <FieldSuccess id="event-fecha-success">
                  {SUCCESS_MESSAGES.fecha}
                </FieldSuccess>
              ) : (
                <p
                  id="event-fecha-help"
                  className="mt-1 text-xs text-gray-500"
                >
                  Selecciona hoy o una fecha futura.
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
                className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${inputBorderClass('lugar')}`}
                placeholder="Ej: Salón Campestre, Yumbo"
                value={formData.lugar}
                onChange={(event) => updateField('lugar', event.target.value)}
                onBlur={() => markTouched('lugar')}
                autoComplete="street-address"
                required
              />
              {errors.lugar ? (
                <p
                  id="event-lugar-error"
                  role="alert"
                  className="mt-1 text-xs text-red-600"
                >
                  {errors.lugar}
                </p>
              ) : isFieldSuccess('lugar') ? (
                <FieldSuccess id="event-lugar-success">
                  {SUCCESS_MESSAGES.lugar}
                </FieldSuccess>
              ) : null}
          </div>
        </fieldset>

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
