import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RESULT_LIMIT,
  buildSearchIndex,
  normalizeForSearch,
  searchTasks,
  toSearchResult,
} from './taskSearch';

const EVENTS = [
  { idEvento: 1, nombre: 'Boda de María' },
  { idEvento: 2, nombre: 'Cumpleaños de Ana' },
];

const SUBTASKS = {
  1: [
    {
      idSubtarea: 11,
      idEvento: 1,
      nombreGestion: 'Confirmar proveedor de flores',
      horasEstimadas: 3,
      fechaObjetivo: '2026-12-01',
      estado: 'pendiente',
    },
    {
      idSubtarea: 12,
      idEvento: 1,
      nombreGestion: 'Montar mesas',
      horasEstimadas: 5,
      fechaObjetivo: '2026-11-28',
      estado: 'ejecutada',
    },
  ],
  2: [
    {
      idSubtarea: 21,
      idEvento: 2,
      nombreGestion: 'Comprar torta',
      horasEstimadas: 2,
      fechaObjetivo: '2026-11-20',
      estado: 'pendiente',
    },
  ],
};

describe('normalizeForSearch', () => {
  it('pasa a minúsculas y quita los acentos', () => {
    expect(normalizeForSearch('  FLÓRES ')).toBe('flores');
    expect(normalizeForSearch('Año')).toBe('ano');
  });

  it('tolera valores vacíos', () => {
    expect(normalizeForSearch(null)).toBe('');
    expect(normalizeForSearch(undefined)).toBe('');
  });
});

describe('buildSearchIndex', () => {
  it('una tarea por subtarea, con su evento asociado', () => {
    const index = buildSearchIndex(EVENTS, SUBTASKS);

    expect(index).toHaveLength(3);
    expect(index.map((task) => task.id).sort()).toEqual([11, 12, 21]);

    const flores = index.find((task) => task.id === 11);
    expect(flores).toMatchObject({
      title: 'Confirmar proveedor de flores',
      eventId: 1,
      eventName: 'Boda de María',
      date: '2026-12-01',
      hours: 3,
      state: 'pendiente',
    });
  });

  it('descarta eventos sin id y subtareas huérfanas', () => {
    const index = buildSearchIndex(
      [{ idEvento: null, nombre: 'Sin id' }],
      { 1: [{ idSubtarea: null, nombreGestion: 'Sin id' }] }
    );

    expect(index).toEqual([]);
  });

  it('no falla con entradas vacías o inválidas', () => {
    expect(buildSearchIndex(null, null)).toEqual([]);
    expect(buildSearchIndex([{ idEvento: 3 }], {})).toEqual([]);
  });
});

describe('searchTasks', () => {
  const index = buildSearchIndex(EVENTS, SUBTASKS);

  it('encuentra por nombre de tarea sin importar acentos ni mayúsculas', () => {
    const found = searchTasks(index, 'FLORES');

    expect(found).toHaveLength(1);
    expect(found[0].title).toBe('Confirmar proveedor de flores');
  });

  it('encuentra por nombre del evento', () => {
    const found = searchTasks(index, 'boda');

    // Las dos coincide por evento y se ordenan por fecha objetivo: la más
    // próxima primero.
    expect(found.map((task) => task.title)).toEqual([
      'Montar mesas',
      'Confirmar proveedor de flores',
    ]);
  });

  it('prioriza el nombre de la tarea sobre el nombre del evento', () => {
    // "torta" coincide con una tarea; "Ana" solo coincide con un evento.
    const found = searchTasks(index, 'torta');
    expect(found[0].title).toBe('Comprar torta');

    const porEvento = searchTasks(index, 'Ana');
    expect(porEvento).toHaveLength(1);
  });

  it('prioriza el inicio de palabra sobre una coincidencia interior', () => {
    const found = searchTasks(index, 'mont');
    expect(found[0].title).toBe('Montar mesas');
  });

  it('devuelve vacío con menos de dos caracteres', () => {
    expect(searchTasks(index, 'f')).toEqual([]);
    expect(searchTasks(index, '')).toEqual([]);
    expect(searchTasks(index, '   ')).toEqual([]);
  });

  it('devuelve vacío cuando nada coincide', () => {
    expect(searchTasks(index, 'DJ')).toEqual([]);
  });

  it('respeta el límite de resultados', () => {
    expect(DEFAULT_RESULT_LIMIT).toBe(8);
    // "de" aparece en los dos nombres de evento: hay tres coincidencias.
    expect(searchTasks(index, 'de')).toHaveLength(3);
    expect(searchTasks(index, 'de', { limit: 1 })).toHaveLength(1);
  });

  it('ordena por fecha objetivo entre coincidencias del mismo rango', () => {
    const many = buildSearchIndex([{ idEvento: 9, nombre: 'Gala' }], {
      9: [
        { idSubtarea: 91, nombreGestion: 'Tarea posterior', fechaObjetivo: '2026-12-20' },
        { idSubtarea: 92, nombreGestion: 'Tarea temprana', fechaObjetivo: '2026-10-01' },
      ],
    });

    expect(searchTasks(many, 'tarea').map((task) => task.id)).toEqual([92, 91]);
  });

  it('no falla con índice inválido', () => {
    expect(searchTasks(null, 'flores')).toEqual([]);
  });
});

describe('toSearchResult', () => {
  it('expone lo que necesita el desplegable', () => {
    const index = buildSearchIndex(EVENTS, SUBTASKS);
    const result = toSearchResult(index[0]);

    expect(result).toEqual({
      id: 11,
      eventId: 1,
      title: 'Confirmar proveedor de flores',
      eventName: 'Boda de María',
      date: '2026-12-01',
      hours: 3,
      state: 'pendiente',
    });
  });
});