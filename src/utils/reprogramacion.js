import { getPastDateMessage, isDateInPast } from './dateValidation';

/**
 * Lógica pura del flujo de reprogramación (contrato en
 * docs/contrato-reprogramacion.md). El backend responde 200 con la
 * `SubtareaDTO` actualizada o 409 cuando la reprogramación supera el límite
 * diario; `normalizarConflicto409` traduce ese 409 a la forma
 * `{ conflicto, limiteDiario, horasTotalesCalculadas, mensaje }` con la que
 * trabaja la UI.
 */

export const esConflicto = (respuesta) => respuesta?.conflicto === true;

export const getHorasTotales = (respuesta) =>
  Number(respuesta?.horasTotalesCalculadas) || 0;

export const getLimiteDiario = (respuesta) =>
  Number(respuesta?.limiteDiario) || 0;

export const getExceso = (respuesta) =>
  Math.max(0, getHorasTotales(respuesta) - getLimiteDiario(respuesta));

/**
 * Mensaje de conflicto con la regla "qué pasó + cómo corregirlo": dice cuántas
 * horas quedarían, cuál es el límite y qué hacer.
 */
export const getMensajeConflicto = (respuesta) => {
  const total = getHorasTotales(respuesta);
  const limite = getLimiteDiario(respuesta);

  if (!total && !limite) {
    return (
      respuesta?.mensaje ||
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
 * conflicto que consume la UI. El body del 409 no define nombres de campo fijos,
 * así que la extracción es tolerante: se prueban variantes y, si falta la
 * aritmética, se cae a un mensaje genérico.
 */
export const normalizarConflicto409 = (details, nuevasHoras = 0) => {
  const source =
    details && typeof details === 'object' ? details : { message: details };

  const limite =
    numberLike(source.limiteDiario) ??
    numberLike(source.limiteHorasDiarias) ??
    numberLike(source.capacidad?.limiteHorasDiarias);

  const horasALiberar = numberLike(source.horasALiberar);

  const horasPlanificadas = numberLike(source.horasPlanificadas);
  const nuevas = Number.isFinite(Number(nuevasHoras)) ? Number(nuevasHoras) : 0;

  const total =
    numberLike(source.horasTotalesCalculadas) ??
    (limite !== undefined && horasALiberar !== undefined
      ? limite + horasALiberar
      : undefined) ??
    (horasPlanificadas !== undefined ? horasPlanificadas + nuevas : undefined);

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
    errores.horas = 'Ingresaste 0 o menos. Asigna al menos 1 hora de esfuerzo.';
  }

  return errores;
};
