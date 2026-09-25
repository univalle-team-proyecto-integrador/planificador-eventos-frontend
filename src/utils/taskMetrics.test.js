import { describe, expect, it } from 'vitest';
import {
  addDays,
  classifyTasksByDate,
  formatHours,
  formatOverdueLabel,
  formatRelativeDate,
  getTaskMetrics,
  isEventToday,
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
});
