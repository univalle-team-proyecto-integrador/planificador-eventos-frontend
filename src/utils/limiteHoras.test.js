import { describe, expect, it } from 'vitest';
import { fechasSobreLimite, sumarHorasPorFecha } from './limiteHoras';

const tarea = (date, hours, state = 'pendiente') => ({
  date,
  hours,
  state,
});

describe('limiteHoras', () => {
  it('suma las horas por fecha e ignora las ejecutadas', () => {
    const subtareas = [
      tarea('2026-11-10', 2),
      tarea('2026-11-10', 3),
      tarea('2026-11-11', 4),
      tarea('2026-11-10', 5, 'ejecutada'),
    ];

    expect(sumarHorasPorFecha(subtareas)).toEqual({
      '2026-11-10': 5,
      '2026-11-11': 4,
    });
  });

  it('puede incluir las ejecutadas si se pide', () => {
    const subtareas = [tarea('2026-11-10', 5, 'ejecutada')];

    expect(sumarHorasPorFecha(subtareas, { incluirEjecutadas: true })).toEqual({
      '2026-11-10': 5,
    });
  });

  it('ignora fechas y horas inválidas', () => {
    const subtareas = [
      tarea('', 3),
      tarea('2026-11-10', 0),
      tarea('2026-11-10', 'ocho'),
      tarea('2026-11-10', 2),
    ];

    expect(sumarHorasPorFecha(subtareas)).toEqual({ '2026-11-10': 2 });
  });

  it('detecta las fechas que superan el límite y calcula el exceso', () => {
    const subtareas = [
      tarea('2026-11-10', 7),
      tarea('2026-11-11', 6),
      tarea('2026-11-12', 4),
    ];

    expect(fechasSobreLimite(subtareas, 6)).toEqual([
      { fecha: '2026-11-10', total: 7, exceso: 1 },
    ]);
  });

  it('no genera avisos con un límite inválido', () => {
    expect(fechasSobreLimite([tarea('2026-11-10', 9)], 0)).toEqual([]);
    expect(fechasSobreLimite([tarea('2026-11-10', 9)], null)).toEqual([]);
  });
});
