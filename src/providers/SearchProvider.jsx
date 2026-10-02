import { useCallback, useMemo, useRef, useState } from 'react';
import { SearchContext } from './search-context';
import { loadTaskSearchIndex } from '../services/taskSearchService';
import { searchTasks } from '../utils/taskSearch';

/**
 * Índice de tareas para el buscador global.
 *
 * Se carga bajo demanda: hasta que alguien escribe no se pide nada, para que
 * abrir la app no pague un N+1 que casi nadie va a usar. Una vez cargado queda
 * en memoria y se reutiliza en cada búsqueda posterior.
 *
 * Como las tareas cambian desde el detalle del evento y desde la creación, las
 * vistas llaman a `invalidate()` tras cada mutación confirmada por el servidor:
 * el siguiente tecleo vuelve a traer el índice en vez de mostrar datos viejos.
 */
export const SearchProvider = ({ children }) => {
  const indexRef = useRef(null);
  const pendingRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /** Descarga el índice una vez y lo recuerda; llamadas simultáneas comparten la misma petición. */
  const ensureIndex = useCallback(async () => {
    if (indexRef.current) {
      return indexRef.current;
    }

    if (pendingRef.current) {
      return pendingRef.current;
    }

    setIsLoading(true);
    setError('');

    pendingRef.current = loadTaskSearchIndex()
      .then((index) => {
        indexRef.current = index;
        setIsLoading(false);
        return index;
      })
      .catch((loadError) => {
        setIsLoading(false);
        setError(
          loadError?.message ||
            'No pudimos buscar tareas. Revisa tu red e inténtalo de nuevo.'
        );
        throw loadError;
      })
      .finally(() => {
        pendingRef.current = null;
      });

    return pendingRef.current;
  }, []);

  const search = useCallback(
    async (query, options) => {
      try {
        const index = await ensureIndex();
        return searchTasks(index, query, options);
      } catch {
        // El mensaje ya quedó en `error`; el llamador solo necesita saber que
        // no hay resultados que pintar.
        return [];
      }
    },
    [ensureIndex]
  );

  /** Olvida el índice cacheado para que la próxima búsqueda lo recargue. */
  const invalidate = useCallback(() => {
    indexRef.current = null;
  }, []);

  const value = useMemo(
    () => ({ ensureIndex, search, invalidate, isLoading, error }),
    [ensureIndex, search, invalidate, isLoading, error]
  );

  return <SearchContext value={value}>{children}</SearchContext>;
};