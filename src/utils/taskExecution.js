/**
 * Lógica pura del registro de una gestión como ejecutada o pospuesta (US-09).
 *
 * Vive en `utils/` y no toca React ni la red a propósito: el patrón mayoritario
 * del repo y el que permite probar las reglas sin montar nada. La vista decide
 * cuándo llamar y qué hacer con el resultado.
 */

/** Los tres estados que acepta el backend en `PATCH /api/subtareas/{id}/estado`. */
export const ESTADO_EJECUTADA = 'ejecutada';
export const ESTADO_POSPUEESTA = 'pospuesta';
export const ESTADO_PENDIENTE = 'pendiente';

/** Acciones que ofrecen los botones rápidos de una tarjeta. */
export const ACCION_COMPLETAR = 'completar';
export const ACCION_POSPONER = 'posponer';

/**
 * A qué estado lleva la gestión cada acción.
 *
 * "Completar" alterna a `ejecutada` y "Posponer" va a `pospuesta`. Si la
 * gestión ya está en el estado al que lleva la acción, la acción no tiene
 * sentido y devuelve `null`: el botón queda deshabilitado en vez de hacer un
 * PATCH que el servidor no iba a cambiar nada.
 */
export const siguienteEstado = (estadoActual, accion) => {
  const actual = estadoActual || ESTADO_PENDIENTE;

  if (accion === ACCION_COMPLETAR) {
    return actual === ESTADO_EJECUTADA ? null : ESTADO_EJECUTADA;
  }

  if (accion === ACCION_POSPONER) {
    return actual === ESTADO_POSPUEESTA ? null : ESTADO_POSPUEESTA;
  }

  return null;
};

/**
 * Si la nota es obligatoria. Al posponer sí: sin un motivo, "pospuesta" no le
 * dice al resto del equipo por qué la gestión no avanza, y es la acción que más
 * se pierde sin explicación. Al completar es opcional: la propia ejecución ya
 * es la explicación y forzar un texto convertiría la acción más frecuente de la
 * pantalla en la más lenta.
 */
export const esNotaObligatoria = (estado) => estado === ESTADO_POSPUEESTA;

/**
 * Valida la nota antes de enviarla.
 *
 * @returns {string} El mensaje del error, o `''` si la nota sirve.
 */
export const validarNota = (nota, estado) => {
  const texto = String(nota ?? '').trim();

  if (!esNotaObligatoria(estado)) {
    return '';
  }

  if (!texto) {
    return 'Escribe por qué se pospone la gestión para que el equipo lo sepa.';
  }

  if (texto.length > 500) {
    return `La nota es demasiado larga (${texto.length} de 500 caracteres). Resume el motivo.`;
  }

  return '';
};

/** Títulos del modal según el estado al que se va. */
export const getTituloModal = (estado) => {
  if (estado === ESTADO_POSPUEESTA) {
    return 'Poner la gestión en pospuesta';
  }

  if (estado === ESTADO_EJECUTADA) {
    return 'Marcar la gestión como completada';
  }

  return 'Cambiar el estado de la gestión';
};

/** Textos de apoyo del modal, que también dicen si la nota es obligatoria. */
export const getDescripcionModal = (estado) => {
  if (estado === ESTADO_POSPUEESTA) {
    return 'Explica por qué queda pospuesta. El motivo queda guardado en la gestión y el equipo lo ve.';
  }

  if (estado === ESTADO_EJECUTADA) {
    return 'Opcionalmente deja una nota con el detalle de cómo terminó.';
  }

  return 'El estado se guarda en el servidor al confirmar.';
};

/** Etiqueta del botón de confirmación. */
export const getEtiquetaConfirmar = (estado) => {
  if (estado === ESTADO_POSPUEESTA) {
    return 'Poner en pospuesta';
  }

  if (estado === ESTADO_EJECUTADA) {
    return 'Marcar como completada';
  }

  return 'Guardar estado';
};

/** Texto del toast tras un guardado correcto. */
export const getMensajeConfirmacion = (estado) => {
  if (estado === ESTADO_POSPUEESTA) {
    return 'Gestión pospuesta.';
  }

  if (estado === ESTADO_EJECUTADA) {
    return 'Gestión marcada como completada.';
  }

  if (estado === ESTADO_PENDIENTE) {
    return 'Gestión reabierta.';
  }

  return 'Estado de la gestión actualizado.';
};

/**
 * Las horas que la gestión deja de ocupar al pasar a `ejecutada`.
 *
 * Al completar, la carga del día baja sola; al posponer no cambia, porque la
 * gestión sigue sin hacer y sigue contando para el límite diario.
 */
export const getHorasLiberadas = (task, estado) => {
  if (estado !== ESTADO_EJECUTADA) {
    return 0;
  }

  const hours = Number(task?.hours ?? task?.horasEstimadas);

  return Number.isFinite(hours) ? hours : 0;
};
