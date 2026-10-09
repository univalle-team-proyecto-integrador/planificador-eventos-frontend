import { describe, expect, it } from 'vitest';
import {
  addDays,
  classifyTasksByDate,
  formatHours,
  formatOverdueLabel,
  formatRelativeDate,
  getDesfase,
  getTaskMetrics,
  isEventToday,
  normalizeEvent,
  normalizeSubtask,
  rangoDeDias,
  UPCOMING_RANGES,
} from './taskMetrics';

const task = (overrides = {}) => ({
  id: 1,
  title: 'Gestión',
  hours: 2,
  date: '2026-09-25',
  state: 'pendiente',
  ...overrides,
});

describe('taskMetrics', () => {
  it('normaliza las horas estimadas del evento', () => {
    expect(
      normalizeEvent({
        idEvento: 7,
        nombre: 'Boda',
        fechaEvento: '2026-12-01T15:00:00',
        horasEstimadas: 24,
      })
    ).toMatchObject({ id: 7, name: 'Boda', estimatedHours: 24 });
  });

  it('deja las horas estimadas en 0 cuando el evento no las trae', () => {
    // Evento anterior a la columna: la pantalla debe seguir funcionando.
    expect(normalizeEvent({ idEvento: 7, nombre: 'Boda' }).estimatedHours).toBe(
      0
    );
  });

  it('las horas estimadas del evento no alteran el total real', () => {
    // El total por horas sale de las subtareas. El estimado es informativo.
    const metrics = getTaskMetrics([
      task({ hours: 3 }),
      task({ id: 2, hours: 2 }),
    ]);

    expect(metrics.hoursTotal).toBe(5);
  });

  it('calcula el progreso principal usando horas estimadas', () => {
    const metrics = getTaskMetrics([
      task({ hours: 1, state: 'ejecutada' }),
      task({ id: 2, hours: 1, state: 'ejecutada' }),
      task({ id: 3, hours: 8, state: 'pendiente' }),
    ]);

    expect(metrics).toMatchObject({
      total: 3,
      completed: 2,
      remaining: 1,
      hoursTotal: 10,
      hoursCompleted: 2,
      hoursRemaining: 8,
      progressHours: 20,
      progressTasks: 67,
    });
  });

  it('separa tareas de hoy, atrasadas y próximas', () => {
    const groups = classifyTasksByDate(
      [
        task({ id: 1, date: '2026-09-23' }),
        task({ id: 2, date: '2026-09-25' }),
        task({ id: 3, date: '2026-09-26' }),
        task({ id: 4, date: '2026-10-05' }),
        task({ id: 5, date: '2026-09-25', state: 'ejecutada' }),
      ],
      '2026-09-25'
    );

    expect(groups.todayTasks.map((item) => item.id)).toEqual([2]);
    expect(groups.overdueTasks.map((item) => item.id)).toEqual([1]);
    expect(groups.upcomingTasks.map((item) => item.id)).toEqual([3]);
    expect(groups.overdueTotal).toBe(1);
    expect(groups.upcomingTotal).toBe(1);
  });

  it('limita las listas próximas y conserva el total', () => {
    const tasks = Array.from({ length: 7 }, (_, index) =>
      task({ id: index + 1, date: addDays('2026-09-25', index + 1) })
    );
    const groups = classifyTasksByDate(tasks, '2026-09-25', { limit: 3 });

    expect(groups.upcomingTasks).toHaveLength(3);
    expect(groups.upcomingTotal).toBe(7);
  });

  it('ampliar el rango trae más gestiones próximas', () => {
    const tasks = [
      task({ id: 1, date: '2026-09-28' }), // +3 días
      task({ id: 2, date: '2026-10-05' }), // +10 días
      task({ id: 3, date: '2026-10-20' }), // +25 días
    ];

    const corto = classifyTasksByDate(tasks, '2026-09-25', rangoDeDias(7));
    const largo = classifyTasksByDate(tasks, '2026-09-25', rangoDeDias(30));

    expect(corto.upcomingTasks.map((item) => item.id)).toEqual([1]);
    expect(largo.upcomingTasks.map((item) => item.id)).toEqual([1, 2, 3]);
    expect(largo.upcomingTotal).toBe(3);
  });

  it('el rango ampliado no altera los grupos de hoy ni vencidas', () => {
    const tasks = [
      task({ id: 1, date: '2026-09-20' }), // vencida
      task({ id: 2, date: '2026-09-25' }), // hoy
      task({ id: 3, date: '2026-10-20' }), // próxima lejana
    ];

    const corto = classifyTasksByDate(tasks, '2026-09-25', rangoDeDias(7));
    const largo = classifyTasksByDate(tasks, '2026-09-25', rangoDeDias(30));

    expect(largo.overdueTasks.map((item) => item.id)).toEqual(
      corto.overdueTasks.map((item) => item.id)
    );
    expect(largo.todayTasks.map((item) => item.id)).toEqual([2]);
  });

  it('cada rango trae su propio tope y el total sigue siendo el real', () => {
    const tasks = Array.from({ length: 30 }, (_, index) =>
      task({ id: index + 1, date: addDays('2026-09-25', index + 1) })
    );

    const siete = rangoDeDias(7);
    const treinta = rangoDeDias(30);

    const corto = classifyTasksByDate(tasks, '2026-09-25', siete);
    const largo = classifyTasksByDate(tasks, '2026-09-25', treinta);

    // El rango decide cuántas fechas entran; el tope, cuántas se pintan.
    const dentroDe7 = tasks.filter(
      ({ date }) => date <= addDays('2026-09-25', 7)
    );
    expect(corto.upcomingTotal).toBe(dentroDe7.length);
    expect(largo.upcomingTotal).toBe(30);
    expect(corto.upcomingTasks).toHaveLength(
      Math.min(siete.limit, dentroDe7.length)
    );
    expect(largo.upcomingTasks).toHaveLength(Math.min(treinta.limit, 30));
    // Truncar la lista nunca cambia el total que se muestra en pantalla.
    expect(largo.upcomingTasks.length).toBeLessThan(largo.upcomingTotal);
    expect(largo.upcomingTotal).toBeGreaterThan(largo.upcomingTasks.length);
  });

  it('un rango desconocido cae en la opción predeterminada', () => {
    // Así se comporta un valor guardado en localStorage que ya no existe.
    expect(rangoDeDias(60)).toEqual(UPCOMING_RANGES[0]);
    expect(rangoDeDias(null)).toEqual(UPCOMING_RANGES[0]);
    expect(rangoDeDias('siete')).toEqual(UPCOMING_RANGES[0]);
  });

  it('los rangos ofrecidos crecen de rango en rango', () => {
    const [primero, ...resto] = UPCOMING_RANGES;

    expect(primero.days).toBe(7);
    expect(resto.every(({ days }) => days > primero.days)).toBe(true);
    // Cada rango debe traer su propio tope: ampliar nunca reduce lo que se ve.
    expect(
      resto.every(({ limit }, indice) => {
        const anterior = indice === 0 ? primero.limit : resto[indice - 1].limit;
        return limit > anterior;
      })
    ).toBe(true);
  });

  it('formatea fechas relativas y atrasadas', () => {
    expect(formatRelativeDate('2026-09-26', '2026-09-25')).toBe('Mañana');
    expect(formatOverdueLabel('2026-09-23', '2026-09-25')).toBe(
      'Vencida hace 2 días'
    );
  });

  it('identifica eventos programados para hoy', () => {
    expect(
      isEventToday({ fechaEvento: '2026-09-25T15:00:00' }, '2026-09-25')
    ).toBe(true);
    expect(
      isEventToday({ fechaEvento: '2026-09-26T15:00:00' }, '2026-09-25')
    ).toBe(false);
  });

  it('formatea horas decimales sin perder precisión', () => {
    expect(formatHours(1.5)).toBe('1.5 h');
    expect(formatHours(4)).toBe('4 h');
  });

  describe('desfase de la reprogramación', () => {
    it('normaliza la línea base que envía el backend', () => {
      expect(
        normalizeSubtask({
          idSubtarea: 1,
          nombreGestion: 'Gestión',
          fechaObjetivo: '2026-11-20',
          fechaObjetivoOriginal: '2026-11-10',
          horasEstimadas: 2,
        }).originalDate
      ).toBe('2026-11-10');
    });

    it('deja la línea base en null si nunca se movió', () => {
      expect(normalizeSubtask({ idSubtarea: 1 }).originalDate).toBeNull();
    });

    it('marca como postergada cuando la fecha se movió más adelante', () => {
      expect(
        getDesfase({ date: '2026-11-20', originalDate: '2026-11-10' })
      ).toEqual({ tipo: 'postergada', dias: 10 });
    });

    it('marca como adelantada cuando la fecha se movió antes', () => {
      expect(
        getDesfase({ date: '2026-11-08', originalDate: '2026-11-10' })
      ).toEqual({ tipo: 'adelantada', dias: 2 });
    });

    it('no marca nada si la fecha no cambió', () => {
      expect(getDesfase({ date: '2026-11-10', originalDate: '2026-11-10' })).toBeNull();
    });

    it('no marca nada sin línea base con la que comparar', () => {
      expect(getDesfase({ date: '2026-11-20' })).toBeNull();
      expect(getDesfase({ originalDate: '2026-11-10' })).toBeNull();
      expect(getDesfase(null)).toBeNull();
    });

    it('cuenta el desfase entre meses y años', () => {
      expect(
        getDesfase({ date: '2026-12-31', originalDate: '2026-12-30' })
      ).toEqual({ tipo: 'postergada', dias: 1 });
      expect(
        getDesfase({ date: '2027-01-05', originalDate: '2026-12-20' })
      ).toEqual({ tipo: 'postergada', dias: 16 });
    });
  });
});
