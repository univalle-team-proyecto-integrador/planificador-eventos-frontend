import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '../components/states/ErrorState';
import { Button } from '../components/ui/Button';
import { FieldSuccess } from '../components/ui/FieldSuccess';
import { useNotifications } from '../providers/notifications-context';
import { useTaskSearch } from '../providers/search-context';
import { api, toApiDateTime, unwrapData } from '../services/api';
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
  horasEstimadas: '',
  lugar: '',
};

const SUCCESS_MESSAGES = {
  nombre: '¡Listo! Nombre válido.',
  tipoEvento: 'Bien, tipo seleccionado.',
  cliente: '¡Listo! Cliente registrado.',
  fecha: 'Bien, fecha válida.',
  horasEstimadas: '¡Listo! Horas estimadas registradas.',
  lugar: '¡Listo! Lugar correcto.',
};

// El backend exige horasEstimadas > 0, así que el 1 es el piso real y no una
// decisión de diseño. El texto explica que es una estimación del evento
// completo, porque la carga por día la controla el límite diario aparte.
const MIN_HORAS_ESTIMADAS = 1;

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
  const { invalidate: invalidateSearchIndex } = useTaskSearch();
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

  /**
   * El campo es texto libre, no number: en un input numérico el usuario puede
   * escribir "e" o "1e" y el navegador lo entrega vacío, lo que produce un error
   * de validación en vez del mensaje de "no has escrito nada".
   */
  const getHorasEstimadasError = (value) => {
    if (value === '' || value === null || value === undefined) {
      return 'Faltan las horas estimadas. Indica cuánto trabajo llevará el evento en total.';
    }

    const horas = Number(value);
    if (!Number.isInteger(horas)) {
      return 'Las horas deben ser un número entero, sin decimales.';
    }
    if (horas < MIN_HORAS_ESTIMADAS) {
      return `Las horas estimadas deben ser al menos ${MIN_HORAS_ESTIMADAS}.`;
    }

    return '';
  };

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
      case 'horasEstimadas':
        return getHorasEstimadasError(data.horasEstimadas);
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
    const errorHoras = getHorasEstimadasError(formData.horasEstimadas);
    if (errorHoras) {
      newErrors.horasEstimadas = errorHoras;
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
      ? 'border-danger'
      : isFieldSuccess(field)
        ? 'border-emerald-500'
        : 'border-border';

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
          idTipoEvento: Number(formData.tipoEvento),
          nombre: formData.nombre.trim(),
          cliente: formData.cliente.trim(),
          fechaEvento: toApiDateTime(formData.fecha),
          horasEstimadas: Number(formData.horasEstimadas),
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
      // El buscador global mantiene su propia copia de eventos y tareas: sin
      // invalidarla, buscaría el nombre de un evento recién creado sin
      // encontrarlo.
      invalidateSearchIndex();
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
    <div className="mx-auto mt-6 max-w-3xl rounded-lg bg-surface-raised p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary">Crear nuevo evento</h2>
        <p className="mt-2 text-sm text-muted-text">
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
          <legend className="mb-3 text-sm font-semibold text-secondary-text">
            ¿Qué evento es?
          </legend>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="event-nombre"
                className="mb-1 block text-sm font-medium text-secondary-text"
              >
                Nombre del evento *
              </label>
              <input
                {...fieldProps('nombre')}
                type="text"
                className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-accent focus:outline-none ${inputBorderClass('nombre')}`}
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
                  className="mt-1 text-xs text-muted-text"
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
                className="mb-1 block text-sm font-medium text-secondary-text"
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
                className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 ${
                  errors.tipoEvento || typesError
                    ? 'border-danger'
                    : isFieldSuccess('tipoEvento')
                      ? 'border-emerald-500'
                      : 'border-border'
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
                  className="mt-1 text-xs text-muted-text"
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
          <legend className="mb-3 text-sm font-semibold text-secondary-text">
            ¿Cuándo, dónde y con quién?
          </legend>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="event-cliente"
                className="mb-1 block text-sm font-medium text-secondary-text"
              >
                Cliente / contacto *
              </label>
              <input
                {...fieldProps('cliente')}
                type="text"
                className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-accent focus:outline-none ${inputBorderClass('cliente')}`}
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
                  className="mt-1 text-xs text-muted-text"
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
                className="mb-1 block text-sm font-medium text-secondary-text"
              >
                Fecha del evento *
              </label>
              <input
                {...fieldProps('fecha')}
                type="date"
                min={getToday()}
                className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-accent focus:outline-none ${inputBorderClass('fecha')}`}
                value={formData.fecha}
                onChange={(event) => updateField('fecha', event.target.value)}
                onBlur={() => markTouched('fecha')}
                required
              />
              {errors.fecha ? (
                <p
                  id="event-fecha-error"
                  role="alert"
                  className="mt-1 text-xs text-muted-text"
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
                  className="mt-1 text-xs text-muted-text"
                >
                  Selecciona hoy o una fecha futura.
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="event-lugar"
              className="mb-1 block text-sm font-medium text-secondary-text"
            >
              Lugar del evento *
            </label>
            <input
              {...fieldProps('lugar')}
              type="text"
              className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-accent focus:outline-none ${inputBorderClass('lugar')}`}
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
                className="mt-1 text-xs text-muted-text"
              >
                {errors.lugar}
              </p>
            ) : isFieldSuccess('lugar') ? (
              <FieldSuccess id="event-lugar-success">
                {SUCCESS_MESSAGES.lugar}
              </FieldSuccess>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="event-horas-estimadas"
              className="mb-1 block text-sm font-medium text-secondary-text"
            >
              Horas estimadas *
            </label>
            <input
              {...fieldProps('horasEstimadas')}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={`w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-accent focus:outline-none ${inputBorderClass('horasEstimadas')}`}
              placeholder="Ej: 20"
              value={formData.horasEstimadas}
              onChange={(event) =>
                updateField('horasEstimadas', event.target.value)
              }
              onBlur={() => markTouched('horasEstimadas')}
              required
            />
            {errors.horasEstimadas ? (
              <p
                id="event-horas-estimadas-error"
                role="alert"
                className="mt-1 text-xs text-muted-text"
              >
                {errors.horasEstimadas}
              </p>
            ) : isFieldSuccess('horasEstimadas') ? (
              <FieldSuccess id="event-horas-estimadas-success">
                {SUCCESS_MESSAGES.horasEstimadas}
              </FieldSuccess>
            ) : (
              <p
                id="event-horas-estimadas-help"
                className="mt-1 text-xs text-muted-text"
              >
                Total de trabajo del evento. El límite de horas por día se
                ajusta aparte, en tu perfil.
              </p>
            )}
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
