// Búsqueda de tareas en cliente.
//
// El backend no tiene endpoint de búsqueda (ver ARCHITECTURE.md §6), así que
// el buscador arma un índice con los datos que ya descarga el resto de la app y
// filtra en memoria. Este módulo es pura lógica a propósito: se testea sin DOM
// ni fetch, siguiendo el patrón de utils/taskMetrics.js.

import {
  getTaskDate,
  getTaskHours,
  getTaskState,
  normalizeEvent,
  normalizeSubtask,
} from './taskMetrics';

export const DEFAULT_RESULT_LIMIT = 8;

/**
 * Quita acentos y pasa a minúsculas para que "flores" encuentre "Flóres".
 * Sin esto, buscar con tilde no encuentra nada.
 */
export const normalizeForSearch = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/**
 * Construye el índice a partir de los eventos y un mapa de subtareas por evento.
 *
 * @param {Array} events eventos normalizados (id, name)
 * @param {Record<string|number, Array>} subtareasByEvent subtareas por id de evento
 * @returns {Array<object>} tareas indexadas, ya normalizadas y con eventName
 */
export const buildSearchIndex = (events, subtareasByEvent) => {
  const taskList = Array.isArray(events) ? events : [];
  const byEvent = subtareasByEvent ?? {};

  return taskList
    .map((rawEvent) => normalizeEvent(rawEvent))
    .filter((event) => event.id)
    .flatMap((event) =>
      (Array.isArray(byEvent[event.id]) ? byEvent[event.id] : [])
        .map((rawSubtask) => ({
          ...normalizeSubtask(rawSubtask),
          eventId: event.id,
          eventName: event.name,
        }))
        .filter((task) => task.id)
    );
};

/**
 * Filtra el índice por texto.
 *
 * Busca en el nombre de la tarea y en el nombre del evento al que pertenece,
 * como pide el buscador global. Prioriza las coincidencias del nombre de la
 * tarea sobre las del evento, y dentro de cada grupo ordena por fecha objetivo
 * para que lo más próximo aparezca primero.
 *
 * @param {Array} index índice de buildSearchIndex
 * @param {string} query texto buscado
 * @param {{limit?: number}} options
 */
export const searchTasks = (index, query, { limit = DEFAULT_RESULT_LIMIT } = {}) => {
  const needle = normalizeForSearch(query);
  const taskList = Array.isArray(index) ? index : [];

  if (needle.length < 2) {
    // Con menos de dos caracteres hay demasiados resultados que no ayudan a
    // encontrar nada; el llamador muestra el estado vacío en vez de la lista.
    return [];
  }

  const scored = taskList
    .map((task) => {
      const title = normalizeForSearch(task.title);
      const eventName = normalizeForSearch(task.eventName);

      if (title.startsWith(needle)) return 0;
      if (title.includes(needle)) return 1;
      if (eventName.startsWith(needle)) return 2;
      if (eventName.includes(needle)) return 3;
      return null;
    })
    .map((rank, position) => ({ task: taskList[position], rank }))
    .filter((entry) => entry.rank !== null);

  scored.sort((a, b) => {
    if (a.rank !== b.rank) {
      return a.rank - b.rank;
    }

    const dateA = getTaskDate(a.task);
    const dateB = getTaskDate(b.task);

    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    return getTaskHours(b.task) - getTaskHours(a.task);
  });

  return scored.slice(0, limit).map((entry) => entry.task);
};

/** Datos listos para pintar un resultado del desplegable. */
export const toSearchResult = (task) => ({
  id: task.id,
  eventId: task.eventId,
  title: task.title,
  eventName: task.eventName,
  date: getTaskDate(task),
  hours: getTaskHours(task),
  state: getTaskState(task),
});