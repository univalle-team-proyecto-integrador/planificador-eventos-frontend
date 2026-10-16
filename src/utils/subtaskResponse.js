import { normalizeSubtask } from './taskMetrics';

/**
 * Valida y normaliza la subtarea que devuelve `PATCH /api/subtareas/{id}/estado`.
 *
 * Vive aparte y no dentro de una vista porque las dos que cambian el estado (el
 * detalle del evento y el panel de hoy) necesitan exactamente lo mismo. Con el
 * helper en la vista, la segunda tenía que copiarlo o importar desde un archivo
 * de 2000 líneas.
 *
 * `currentSubtask` aporta lo que el servidor no manda y la respuesta manda sobre
 * todo lo demás. El ORDEN importa y no es un detalle: la forma del cliente usa
 * `state` y la del servidor `estado`. Si se mezclan los objetos en crudo, el
 * `state` viejo del cliente sobrevive al merge y `normalizeSubtask` lee ese
 * primero, así que la gestión se quedaba en `pendiente` con un 200 en la cara.
 * Por eso se normaliza la respuesta ANTES de mezclar: ya en la misma clave, el
 * servidor gana.
 *
 * Mezclar en crudo además perdería `eventName` y cualquier otro campo que solo
 * existe en el cliente (el panel de hoy lo añade para pintar la tarjeta).
 *
 * @throws {Error} Si la respuesta no trae identificador: sin `id` no se puede
 * saber a qué tarjeta aplicar el cambio, y adivinarlo escribiría el estado en
 * la gestión equivocada.
 */
export const requireSubtaskResponse = (payload, currentSubtask = null) => {
  const source = payload || {};
  const id = source.id ?? source.idSubtarea;

  if (id === undefined || id === null) {
    throw new Error(
      'La respuesta del servidor no incluye la subtarea actualizada.'
    );
  }

  const delServidor = normalizeSubtask(source);

  return currentSubtask ? { ...currentSubtask, ...delServidor } : delServidor;
};
