import { getPastDateMessage, isDateInPast } from './dateValidation';

/**
 * Lógica pura del flujo de reprogramación (contrato en
 * docs/contrato-reprogramacion.md).
 *
 * El backend NO responde `200` con `{ conflicto: true }`: cuando la
 * reprogramación no cabe en el límite diario devuelve un **409** con un
 * `ProblemDetail`. Sus propiedades van **aplanadas en el nivel raíz**, no
 * anidadas bajo una clave `properties`:
 *
 * ```json
 * { "title": "Límite diario excedido", "status": 409,
 *   "detail": "...", "limiteDiario": 5, "horasAsignadasPreviamente": 3,
 *   "horasSolicitadas": 3, "horasPlanificadasTotales": 6, "excedente": 1,
 *   "fecha": "2026-11-20", "idSubtarea": 1 }
 * ```
 *
 * Cuando cabe, responde `200` con la `SubtareaDTO` plana, sin envoltorio.
 * Los accesores aceptan tanto el `ApiError` que lanza `services/api.js` como el
 * cuerpo suelto, para que la vista no tenga que desempaquetar antes de decidir.
 *
 * Estos nombres no son un capricho: son los que devuelve `GlobalExceptionHandler`
 * y los fija `CapacidadApiTest` en el backend. Leer `horasTotalesCalculadas` o
 * `properties.limiteDiario` devuelve `undefined` y el modal llega a decir
 * "quedaría con 0 h".
 */

/**
 * Saca el cuerpo del 409. `services/api.js` lo envuelve en un `ApiError` con
 * el cuerpo plano en `details`; si le llega el objeto directamente, se usa tal cual.
 */
const cuerpo = (entrada) => {
  if (!entrada || typeof entrada !== 'object') {
    return {};
  }

  if ('details' in entrada && 'status' in entrada) {
    return entrada.details ?? {};
  }

  return entrada;
};

/**
 * Detecta el conflicto en cualquiera de las dos formas que llegan a la vista:
 * el `ApiError` con `status === 409` (camino normal) o el objeto ya
 * normalizado por `normalizarConflicto409` (camino del mock y del servicio).
 */
export const esConflicto = (entrada) =>
  entrada?.conflicto === true ||
  entrada?.status === 409 ||
  cuerpo(entrada)?.status === 409;

export const getLimiteDiario = (entrada) => Number(cuerpo(entrada)?.limiteDiario) || 0;

// El backend manda `horasPlanificadasTotales`; `horasTotalesCalculadas` es el
// nombre del objeto normalizado. Se aceptan ambos, con el real primero.
export const getHorasTotales = (entrada) => {
  const source = cuerpo(entrada);

  return (
    Number(source?.horasPlanificadasTotales) ||
    Number(source?.horasTotalesCalculadas) ||
    0
  );
};

/**
 * El backend ya envía `excedente`; solo se recalcula si viniera ausente, para no
 * mostrar 0 h cuando el servidor sí nos dio el número.
 */
export const getExceso = (entrada) => {
  const delServidor = Number(cuerpo(entrada)?.excedente);

  if (Number.isFinite(delServidor)) {
    return delServidor;
  }

  return Math.max(0, getHorasTotales(entrada) - getLimiteDiario(entrada));
};

/**
 * Mensaje de conflicto con la regla "qué pasó + cómo corregirlo": dice cuántas
 * horas quedarían, cuál es el límite y qué hacer.
 *
 * Si el backend no trajo cifras, se cae al texto que él mandó (`detail`) y, si
 * tampoco, a una regla general. Nunca se inventan cantidades: mostrar "0 h"
 * cuando el servidor sí mandó los números es peor que no mostrarlos.
 */
/**
 * Aviso de que el guardado ocurrió pero el día sigue pasándose (US-08).
 * El backend solo devuelve `resuelto: false` en ese caso.
 */
export const getMensajeConflictoPersistente = () =>
  'Horas actualizadas, pero ese día sigue por encima de tu límite. Reduce más o mueve la gestión a otro día.';

export const getMensajeConflicto = (entrada) => {
  const total = getHorasTotales(entrada);
  const limite = getLimiteDiario(entrada);

  if (!total && !limite) {
    const source = cuerpo(entrada);

    return (
      (typeof source?.detail === 'string' && source.detail.trim()) ||
      (typeof source?.title === 'string' && source.title.trim()) ||
      (typeof source?.mensaje === 'string' && source.mensaje.trim()) ||
      'Ese día ya cubre tu límite de horas. Reduce las horas o elige otro día.'
    );
  }

  return `Ese día quedaría con ${total} h y tu límite diario es ${limite} h. Reduce las horas o mueve la gestión a otro día.`;
};

const numberLike = (value) => {
  const numero = Number(value);
  return Number.isFinite(numero) && numero > 0 ? numero : undefined;
};

/**
 * Normaliza el 409 del backend (docs/contrato-reprogramacion.md) a la forma de
 * conflicto que consume la UI.
 *
 * El body real es un `ProblemDetail` que trae `limiteDiario`,
 * `horasPlanificadasTotales` y `excedente` (`CapacidadExcedidaException` +
 * `GlobalExceptionHandler`). Se prueban también nombres antiguos como
 * respaldo, pero van DESPUÉS del real: cuando se probaron primero (la spec de
 * OpenAPI no documentaba el body del 409, así que se dedujo a ojo) el total
 * salía `undefined` y el modal llegaba a decir "quedaría con 0 h", que es peor
 * que no mostrar cifras.
 */
export const normalizarConflicto409 = (details, nuevasHoras = 0) => {
  const source =
    details && typeof details === 'object' ? details : { message: details };

  const limite =
    numberLike(source.limiteDiario) ??
    numberLike(source.limiteHorasDiarias) ??
    numberLike(source.capacidad?.limiteHorasDiarias);

  // El backend manda `excedente`, no "horas a liberar": la suma del límite y el
  // exceso es justamente el total planificado.
  const excedente = numberLike(source.excedente) ?? numberLike(source.horasALiberar);

  const nuevas = Number.isFinite(Number(nuevasHoras)) ? Number(nuevasHoras) : 0;

  const total =
    numberLike(source.horasPlanificadasTotales) ??
    numberLike(source.horasTotalesCalculadas) ??
    (limite !== undefined && excedente !== undefined
      ? limite + excedente
      : undefined) ??
    (numberLike(source.horasPlanificadas) !== undefined
      ? numberLike(source.horasPlanificadas) + nuevas
      : undefined);

  const mensaje =
    (typeof source.mensaje === 'string' && source.mensaje.trim()) ||
    (typeof source.detail === 'string' && source.detail.trim()) ||
    (typeof source.message === 'string' && source.message.trim()) ||
    'La reprogramación supera el límite diario de horas asignado.';

  return {
    conflicto: true,
    limiteDiario: limite,
    horasTotalesCalculadas: total,
    mensaje,
  };
};

/**
 * Valida los campos del modal de reprogramación.
 *
 * @param {{ fecha?: string, horas?: string|number }} valores
 * @param {string} [hoy] fecha local de referencia (inyectable en tests)
 * @returns {Record<string, string>} errores por campo
 */
export const validarReprogramacion = ({ fecha, horas } = {}, hoy) => {
  const errores = {};

  if (!fecha) {
    errores.fecha =
      'Falta la nueva fecha. Elige el día al que quieres moverla.';
  } else if (isDateInPast(fecha, hoy)) {
    errores.fecha = getPastDateMessage('La nueva fecha');
  }

  const numero = Number(horas);

  if (!horas && horas !== 0) {
    errores.horas = 'Faltan las horas. Ingresa un valor mayor a 0.';
  } else if (!Number.isFinite(numero)) {
    errores.horas =
      'Ingresaste un valor no válido. Asigna al menos 1 hora de esfuerzo.';
  } else if (!Number.isInteger(numero)) {
    errores.horas =
      'Ingresaste una fracción de hora. Ingresa un número entero de horas.';
  } else if (numero <= 0) {
    errores.horas =
      'Ingresaste 0 o menos. Asigna al menos 1 hora de esfuerzo.';
  }

  return errores;
};
