import { describe, expect, it } from 'vitest';
import {
  esConflicto,
  getExceso,
  getHorasTotales,
  getLimiteDiario,
  getMensajeConflicto,
  normalizarConflicto409,
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

  it('normaliza un 409 con aritmética a la forma de conflicto de la UI', () => {
    const resultado = normalizarConflicto409({
      detail: 'Supera el límite',
      limiteDiario: 6,
      horasTotalesCalculadas: 9,
    });

    expect(resultado).toEqual({
      conflicto: true,
      limiteDiario: 6,
      horasTotalesCalculadas: 9,
      mensaje: 'Supera el límite',
    });
    expect(esConflicto(resultado)).toBe(true);
    expect(getExceso(resultado)).toBe(3);
  });

  it('normaliza un 409 en formato capacidad sumando las nuevas horas', () => {
    const resultado = normalizarConflicto409(
      { capacidad: { limiteHorasDiarias: 6 }, horasPlanificadas: 7 },
      3
    );

    expect(resultado.limiteDiario).toBe(6);
    expect(resultado.horasTotalesCalculadas).toBe(10);
    expect(getHorasTotales(resultado)).toBe(10);
  });

  it('normaliza un 409 con horas a liberar contra el límite', () => {
    const resultado = normalizarConflicto409({
      limiteDiario: 6,
      horasALiberar: 3,
    });

    expect(resultado.limiteDiario).toBe(6);
    expect(resultado.horasTotalesCalculadas).toBe(9);
  });

  it('normaliza un 409 sin aritmética a mensaje genérico', () => {
    const resultado = normalizarConflicto409('El día está lleno');

    expect(resultado.conflicto).toBe(true);
    expect(resultado.limiteDiario).toBeUndefined();
    expect(resultado.horasTotalesCalculadas).toBeUndefined();
    expect(resultado.mensaje).toBe('El día está lleno');
  });

  it('usa un mensaje por defecto cuando el 409 no trae detalle', () => {
    expect(normalizarConflicto409({}).mensaje).toBe(
      'La reprogramación supera el límite diario de horas asignado.'
    );
  });

  it('redacta el conflicto genérico cuando no hay cantidades', () => {
    expect(getMensajeConflicto(normalizarConflicto409({}))).toBe(
      'La reprogramación supera el límite diario de horas asignado.'
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
