import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useTaskSearch } from '../../providers/search-context';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { formatHours, getStateLabel } from '../../utils/taskMetrics';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

/**
 * Buscador global de tareas.
 *
 * Busca por nombre de tarea y por nombre del evento, y al elegir un resultado
 * lleva al detalle de su evento (`/evento/:id`).
 *
 * Accesibilidad: patrón combobox de ARIA. El input es el combobox y la lista es
 * un listbox; el resaltado se mueve con `aria-activedescendant` en vez de
 * mover el foco real, para que al pulsar Enter no se pierda lo escrito. Con
 * ↑/↓ se recorre, Enter abre y Escape cierra.
 */
export function SearchBar() {
  const navigate = useNavigate();
  const { search, invalidate, isLoading, error: searchError } = useTaskSearch();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const listboxId = useId();
  const optionId = (index) => `${listboxId}-opcion-${index}`;

  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const trimmedQuery = debouncedQuery.trim();
  const isQueryLongEnough = trimmedQuery.length >= MIN_QUERY_LENGTH;

  // Con menos de dos caracteres no hay búsqueda que hacer. En vez de vaciar el
  // estado desde el efecto, se deriva: `results` puede conservar la última
  // búsqueda mientras tanto, pero nunca se pinta.
  const visibleResults = isQueryLongEnough ? results : [];

  // La búsqueda arranca con 300 ms de debounce para no pedir datos en cada
  // tecla. `alive` evita pintar resultados de una consulta que ya quedó vieja.
  useEffect(() => {
    if (!isQueryLongEnough) {
      return undefined;
    }

    let alive = true;

    search(trimmedQuery).then((found) => {
      if (!alive) {
        return;
      }

      setResults(found);
      setActiveIndex(found.length > 0 ? 0 : -1);
    });

    return () => {
      alive = false;
    };
  }, [trimmedQuery, isQueryLongEnough, search]);

  const close = useCallback(() => setIsOpen(false), []);

  useClickOutside(containerRef, close, isOpen);

  const goToEvent = useCallback(
    (result) => {
      setQuery('');
      setResults([]);
      setActiveIndex(-1);
      close();
      navigate(`/evento/${result.eventId}`);
    },
    [navigate, close]
  );

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      close();
      return;
    }

    if (visibleResults.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % visibleResults.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) =>
        index <= 0 ? visibleResults.length - 1 : index - 1
      );
      return;
    }

    if (event.key === 'Enter') {
      const selected = visibleResults[activeIndex] ?? visibleResults[0];

      if (selected) {
        event.preventDefault();
        goToEvent(selected);
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setActiveIndex(-1);
    close();
    invalidate();
  };

  const isEmptyState = isQueryLongEnough && visibleResults.length === 0;
  const isErrorState = isEmptyState && Boolean(searchError);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <label htmlFor={`${listboxId}-input`} className="sr-only">
        Buscar tareas por nombre o por evento
      </label>

      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-text"
        />

        <input
          id={`${listboxId}-input`}
          type="search"
          role="combobox"
          autoComplete="off"
          placeholder="Buscar tareas..."
          value={query}
          aria-expanded={isOpen && visibleResults.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-full border border-border bg-surface-raised py-2 pl-9 pr-9 text-sm text-primary-text placeholder:text-muted-text focus-visible:outline-2 focus-visible:outline-offset-2"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpiar la búsqueda"
            className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-text hover:bg-surface-sunken hover:text-secondary-text"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>

      {isOpen && isQueryLongEnough && (
        <div className="dropdown-in absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-border bg-surface-raised shadow-lg">
          {isLoading ? (
            <p role="status" className="px-4 py-3 text-sm text-secondary-text">
              Buscando tareas...
            </p>
          ) : isErrorState ? (
            <div role="status" className="px-4 py-3">
              <p className="text-sm font-semibold text-primary-text">
                No pudimos buscar tareas
              </p>
              <p className="mt-1 text-xs text-muted-text">{searchError}</p>
            </div>
          ) : visibleResults.length === 0 ? (
            <p role="status" className="px-4 py-3 text-sm text-secondary-text">
              No encontramos tareas con ese nombre
            </p>
          ) : (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Resultados de la búsqueda de tareas"
              className="max-h-80 overflow-y-auto"
            >
              {visibleResults.map((result, index) => (
                <li key={result.id}>
                  <button
                    id={optionId(index)}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    tabIndex={-1}
                    onClick={() => goToEvent(result)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors ${
                      index === activeIndex
                        ? 'bg-primary-soft'
                        : 'hover:bg-surface-sunken'
                    }`}
                  >
                    <span className="truncate text-sm font-semibold text-primary-text">
                      {result.title}
                    </span>
                    <span className="truncate text-xs text-muted-text">
                      {result.eventName} · {formatHours(result.hours)} ·{' '}
                      {getStateLabel(result.state)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
