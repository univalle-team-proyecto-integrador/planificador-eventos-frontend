import { describe, expect, it } from 'vitest';
import {
  addDays,
  classifyTasksByDate,
  formatHours,
  formatOverdueLabel,
  formatRelativeDate,
  getDesfase,
  getHoursByDate,
  getTaskMetrics,
  isEventToday,
  normalizeEvent,
  normalizeSubtask,
  notaLegible,
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
  it('normaliza los datos básicos del evento', () => {
    expect(
      normalizeEvent({
        idEvento: 7,
        nombre: 'Boda',
        fechaEvento: '2026-12-01T15:00:00',
      })
    ).toMatchObject({ id: 7, name: 'Boda' });
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

  // Una pospuesta conserva la última fecha que tuvo y esa no compromete ningún
  // día: sale de Para hoy y Próximas. Y aunque esa fecha YA PASÓ, tampoco entra
  // en Vencidas: lo pospuesto se revisa aparte, para que "vencidas" siga
  // significando solo lo que se forgotó por su cuenta.
  it('saca todas las pospuestas de la planificación, tengan la fecha que tengan', () => {
    const groups = classifyTasksByDate(
      [
        task({ id: 1, date: '2026-09-25' }),
        task({ id: 2, date: '2026-09-23', state: 'pospuesta' }),
        task({ id: 3, date: '2026-09-25', state: 'pospuesta' }),
        task({ id: 4, date: '2026-09-26' }),
      ],
      '2026-09-25'
    );

    expect(groups.todayTasks.map((item) => item.id)).toEqual([1]);
    expect(groups.upcomingTasks.map((item) => item.id)).toEqual([4]);

    // Ni la 2 (fecha de anteayer) ni la 3 (fecha de hoy) van a Vencidas.
    expect(groups.overdueTasks).toHaveLength(0);
    expect(groups.deferredTasks.map((item) => item.id)).toEqual([2, 3]);
  });

  it('no manda a Vencidas una gestión ya ejecutada aunque su fecha sea antigua', () => {
    // Hecha no es lo mismo que atrasada: no va a ningún grupo abierto. Y una
    // pospuesta tampoco, que es lo que se comprueba aquí: dos gestiones con
    // fecha antigua que NO son un caso de Vencidas, cada una por su motivo.
    const groups = classifyTasksByDate(
      [
        task({ id: 1, date: '2026-09-20', state: 'ejecutada' }),
        task({ id: 2, date: '2026-09-23', state: 'pospuesta' }),
      ],
      '2026-09-25'
    );

    expect(groups.overdueTasks).toHaveLength(0);
    expect(groups.deferredTasks.map((item) => item.id)).toEqual([2]);
  });

  // La que no tiene fecha es la que el grupo describe de verdad: conserva
  // "última fecha" solo si hubo alguna, y si nunca se movió no hay nada que
  // repintar. Antes de este caso no lo cubría nadie.
  it('deja en su grupo una pospuesta que nunca tuvo fecha asignada', () => {
    const groups = classifyTasksByDate(
      [task({ id: 7, date: '', state: 'pospuesta' })],
      '2026-09-25'
    );

    expect(groups.deferredTasks.map((item) => item.id)).toEqual([7]);
    expect(groups.overdueTasks).toHaveLength(0);
  });

  it('lista las pospuestas en su propio grupo y sin recortarlas', () => {
    const pospuestas = Array.from({ length: 9 }, (_, index) =>
      task({ id: index + 1, date: '2026-09-25', state: 'pospuesta' })
    );
    const groups = classifyTasksByDate(pospuestas, '2026-09-25', {
      limit: 3,
    });

    expect(groups.deferredTasks).toHaveLength(9);
    expect(groups.deferredTotal).toBe(9);
  });

  // La pospuesta no ocupa día, así que no puede empujar al día por encima del
  // límite. Es lo que hace el backend al calcular el 409.
  it('las pospuestas no cuentan para la carga del día', () => {
    const horas = getHoursByDate(
      [
        task({ id: 1, hours: 2, date: '2026-09-25' }),
        task({ id: 2, hours: 5, date: '2026-09-25', state: 'pospuesta' }),
        task({ id: 3, hours: 4, date: '2026-09-25', state: 'ejecutada' }),
        task({ id: 4, hours: 3, date: '2026-09-26', state: 'pospuesta' }),
      ],
      '2026-09-25'
    );

    expect(horas).toBe(2);
  });

  it('reprogramar devuelve una gestión a la planificación activa', () => {
    const reprogramada = task({
      id: 2,
      date: '2026-09-30',
      state: 'pendiente',
    });
    const groups = classifyTasksByDate([reprogramada], '2026-09-25');

    expect(groups.deferredTasks).toHaveLength(0);
    expect(groups.upcomingTasks.map((item) => item.id)).toEqual([2]);
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
      expect(
        getDesfase({ date: '2026-11-10', originalDate: '2026-11-10' })
      ).toBeNull();
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

  // La nota es el motivo del último cambio de estado. `esNotaObligatoria` obliga
  // a escribirla al posponer, y hasta ahora el normalizador la tiraba: nadie la
  // mostraba nunca.
  describe('nota del último cambio de estado', () => {
    it('normaliza la nota que envía el backend', () => {
      expect(
        normalizeSubtask({
          idSubtarea: 1,
          notaExplicativa: 'Proveedor sin disponibilidad',
        }).note
      ).toBe('Proveedor sin disponibilidad');
    });

    it('deja la nota en null si no la hay', () => {
      expect(normalizeSubtask({ idSubtarea: 1 }).note).toBeNull();
      expect(normalizeSubtask({}).note).toBeNull();
    });

    it('acepta la nota ya normalizada', () => {
      expect(normalizeSubtask({ note: 'Ya normalizada' }).note).toBe(
        'Ya normalizada'
      );
    });

    it('entrecomilla la nota para pintarla', () => {
      expect(notaLegible({ note: 'Proveedor sin disponibilidad' })).toBe(
        '“Proveedor sin disponibilidad”'
      );
    });

    it('devuelve vacío cuando no hay nota, para que no se pinte nada', () => {
      expect(notaLegible({})).toBe('');
      expect(notaLegible({ note: null })).toBe('');
      expect(notaLegible({ note: '   ' })).toBe('');
      expect(notaLegible(null)).toBe('');
    });

    // El backend no limita la longitud de `notaExplicativa`, así que puede
    // llegar un párrafo. Se recorta para que la fila no se descuadre; el texto
    // entero sigue en el `title` del elemento.
    it('recorta una nota larga y colapsa los espacios', () => {
      const larga = 'a'.repeat(200);
      const nota = notaLegible({ note: `  ${larga}\n con   saltos  ` });

      expect(nota.startsWith('“aaa')).toBe(true);
      expect(nota.endsWith('…”')).toBe(true);
      // 90 de nota + los puntos suspensivos + las dos comillas.
      expect(nota).toHaveLength(93);
      expect(nota).not.toContain('\n');
    });

    it('no recorta una nota que ya cabe', () => {
      expect(notaLegible({ note: 'Corta' })).toBe('“Corta”');
    });
  });
});
