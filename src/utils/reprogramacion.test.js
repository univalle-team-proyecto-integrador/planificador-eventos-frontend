import { describe, expect, it } from 'vitest';
import {
  esConflicto,
  getExceso,
  getHorasTotales,
  getLimiteDiario,
  getMensajeConflicto,
  validarReprogramacion,
} from './reprogramacion';

describe('reprogramacion', () => {
  const conflicto = {
    conflicto: true,
    limiteDiario: 6,
    horasTotalesCalculadas: 9,
    mensaje: 'La reprogramación supera el límite diario de horas asignado',
  };

  it('detecta el conflicto y lee sus cantidades', () => {
    expect(esConflicto(conflicto)).toBe(true);
    expect(esConflicto({ conflicto: false })).toBe(false);
    expect(getLimiteDiario(conflicto)).toBe(6);
    expect(getHorasTotales(conflicto)).toBe(9);
    expect(getExceso(conflicto)).toBe(3);
  });

  it('no reporta exceso cuando entra en el límite', () => {
    expect(getExceso({ limiteDiario: 6, horasTotalesCalculadas: 5 })).toBe(0);
  });

  it('redacta el conflicto con qué pasó y cómo corregirlo', () => {
    expect(getMensajeConflicto(conflicto)).toBe(
      'Ese día quedaría con 9 h y tu límite diario es 6 h. Reduce las horas o mueve la gestión a otro día.'
    );
  });

  it('acepta una reprogramación válida', () => {
    expect(
      validarReprogramacion({ fecha: '2026-11-15', horas: '3' }, '2026-11-10')
    ).toEqual({});
  });

  it('rechaza fecha vacía o pasada', () => {
    expect(
      validarReprogramacion({ fecha: '', horas: '3' }, '2026-11-10')
    ).toEqual({
      fecha: 'Falta la nueva fecha. Elige el día al que quieres moverla.',
    });

    expect(
      validarReprogramacion({ fecha: '2026-11-09', horas: '3' }, '2026-11-10')
    ).toEqual({
      fecha: 'La nueva fecha ya pasó. Selecciona hoy o una fecha futura.',
    });
  });

  it('rechaza horas vacías, inválidas, fraccionarias o cero', () => {
    expect(
      validarReprogramacion({ fecha: '2026-11-15', horas: '' }, '2026-11-10')
    ).toEqual({ horas: 'Faltan las horas. Ingresa un valor mayor a 0.' });

    expect(
      validarReprogramacion({ fecha: '2026-11-15', horas: 'dos' }, '2026-11-10')
    ).toEqual({
      horas:
        'Ingresaste un valor no válido. Asigna al menos 1 hora de esfuerzo.',
    });

    expect(
      validarReprogramacion({ fecha: '2026-11-15', horas: '2.5' }, '2026-11-10')
    ).toEqual({
      horas:
        'Ingresaste una fracción de hora. Ingresa un número entero de horas.',
    });

    expect(
      validarReprogramacion({ fecha: '2026-11-15', horas: 0 }, '2026-11-10')
    ).toEqual({
      horas: 'Ingresaste 0 o menos. Asigna al menos 1 hora de esfuerzo.',
    });
  });
});
