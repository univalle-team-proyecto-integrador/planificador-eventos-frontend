import { useEffect, useState } from 'react';

/**
 * Retrasa la propagación de un valor.
 *
 * El buscador lo usa para no lanzar una búsqueda por cada tecla: espera a que
 * la persona deje de escribir unos 300 ms.
 *
 * @param {*} value valor a retrasar
 * @param {number} delay milisegundos de espera
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    // Cada cambio reinicia la cuenta: solo el último valor llega al final.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}