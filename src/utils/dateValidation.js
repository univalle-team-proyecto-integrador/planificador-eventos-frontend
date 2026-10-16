export const getToday = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

export const isDateInPast = (value, today = getToday()) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return value < today;
};

export const getPastDateMessage = (label = 'La fecha') =>
  `${label} ya pasó. Selecciona hoy o una fecha futura.`;

/**
 * Tope del `<input type="date">` de la fecha límite de una gestión: el día del
 * evento, porque no tiene sentido ejecutar una gestión después de que pasó.
 *
 * Devuelve `null` cuando ese tope dejaría el calendario sin un solo día
 * seleccionable. El `min` del input es siempre hoy, así que si el evento ya
 * pasó, un `max` con su fecha quedaría por detrás del `min` y el selector
 * nativo no tendría nada que ofrecer: el campo se volvía inusable justo en los
 * eventos vencidos, que son los más habituales en la vista /hoy.
 */
export const maxGestionDate = (fechaEvento, hoy = getToday()) => {
  if (!fechaEvento) {
    return null;
  }

  return fechaEvento < hoy ? null : fechaEvento;
};
