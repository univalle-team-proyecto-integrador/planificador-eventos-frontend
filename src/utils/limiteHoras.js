/**
 * Cálculos puros sobre las horas ya asignadas por día, para avisar cuando una
 * fecha supera el límite diario del organizador.
 *
 * Trabajan sobre subtareas normalizadas por la UI: `{ date, hours, state }`,
 * donde `state === 'ejecutada'` marca las completadas.
 */

const esEjecutada = (subtarea) => subtarea?.state === 'ejecutada';

const horasValidas = (valor) => {
  const horas = Number(valor);
  return Number.isFinite(horas) && horas > 0 ? horas : 0;
};

/**
 * Suma las horas por fecha (yyyy-mm-dd). Por defecto ignora las ejecutadas,
 * porque ya no consumen el día.
 *
 * @param {Array<object>} subtareas
 * @param {{ incluirEjecutadas?: boolean }} [opciones]
 * @returns {Record<string, number>}
 */
export const sumarHorasPorFecha = (
  subtareas,
  { incluirEjecutadas = false } = {}
) => {
  const totales = {};

  (Array.isArray(subtareas) ? subtareas : []).forEach((subtarea) => {
    if (!subtarea) {
      return;
    }
    if (!incluirEjecutadas && esEjecutada(subtarea)) {
      return;
    }
    const fecha = subtarea.date;
    if (!fecha) {
      return;
    }
    totales[fecha] = (totales[fecha] ?? 0) + horasValidas(subtarea.hours);
  });

  return totales;
};

/**
 * Devuelve las fechas cuyo total de horas supera el límite, ordenadas por
 * fecha. Un límite inválido (<= 0 o no numérico) no genera avisos.
 *
 * @param {Array<object>} subtareas
 * @param {number} limite
 * @param {{ incluirEjecutadas?: boolean }} [opciones]
 * @returns {Array<{ fecha: string, total: number, exceso: number }>}
 */
export const fechasSobreLimite = (subtareas, limite, opciones) => {
  const maximo = Number(limite);
  if (!Number.isFinite(maximo) || maximo <= 0) {
    return [];
  }

  return Object.entries(sumarHorasPorFecha(subtareas, opciones))
    .filter(([, total]) => total > maximo)
    .map(([fecha, total]) => ({ fecha, total, exceso: total - maximo }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
};
