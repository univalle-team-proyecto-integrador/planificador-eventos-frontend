import { getPastDateMessage, isDateInPast } from './dateValidation';

/**
 * Lógica pura del flujo de reprogramación (contrato en
 * docs/contrato-reprogramacion.md). El backend responde 200 con
 * `{ conflicto, limiteDiario, horasTotalesCalculadas, subtarea? }`; aquí se
 * interpreta esa forma y se validan los campos antes de enviar.
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

  return `Ese día quedaría con ${total} h y tu límite diario es ${limite} h. Reduce las horas o mueve la gestión a otro día.`;
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
