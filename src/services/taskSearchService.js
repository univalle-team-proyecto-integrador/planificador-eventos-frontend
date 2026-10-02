import { api, unwrapData } from './api';
import { buildSearchIndex } from '../utils/taskSearch';
import { normalizeEvent } from '../utils/taskMetrics';

// Carga del índice del buscador global.
//
// El backend todavía no expone una búsqueda: hay que traer los eventos y luego
// las subtareas de cada uno. Es un N+1 (1 + número de eventos) que el mismo
// patrón ya usa HoyPage y ProgresoPage, así que aquí no se inventa nada nuevo.
//
// Cuando exista `GET /api/subtareas/buscar?search=...`, esta función es lo
// único que hay que reemplazar: el resto del buscador recibe el mismo índice.

const normalizeEvents = (payload) => {
  const raw = Array.isArray(payload) ? payload : [];

  return raw.map(normalizeEvent).filter((event) => event.id);
};

/**
 * Devuelve el índice de tareas del organizador.
 *
 * @returns {Promise<Array<object>>} índice de buildSearchIndex
 */
export const loadTaskSearchIndex = async () => {
  const events = normalizeEvents(unwrapData(await api.listEvents()));

  if (events.length === 0) {
    return [];
  }

  const groups = await Promise.all(
    events.map(async (event) => {
      const response = unwrapData(await api.getSubtasks(event.id));
      return [event.id, Array.isArray(response) ? response : []];
    })
  );

  return buildSearchIndex(events, Object.fromEntries(groups));
};