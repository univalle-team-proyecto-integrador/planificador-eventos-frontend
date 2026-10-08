import { beforeEach, describe, expect, it } from 'vitest';
import { persistRange, readStoredRange, RANGO_KEY } from './rangoPreximas';
import { DEFAULT_UPCOMING_RANGE, rangoDeDias } from './taskMetrics';

describe('preferencia del rango de días del panel Hoy', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('sin preferencia guardada usa la opción predeterminada', () => {
    expect(readStoredRange()).toEqual(DEFAULT_UPCOMING_RANGE);
    expect(readStoredRange().days).toBe(7);
  });

  it('recupera el rango que se guardó', () => {
    persistRange(30);

    expect(window.localStorage.getItem(RANGO_KEY)).toBe('30');
    expect(readStoredRange().days).toBe(30);
    expect(readStoredRange().limit).toBe(15);
  });

  it('persistir devuelve la opción normalizada, no el valor crudo', () => {
    // El valor llega como string desde el onChange del select.
    expect(persistRange('14')).toEqual({ days: 14, limit: 8 });
  });

  it('descarta un rango guardado que ya no existe', () => {
    // Puede ocurrir si UPCOMING_RANGES cambia entre despliegues.
    window.localStorage.setItem(RANGO_KEY, '60');

    expect(readStoredRange()).toEqual(rangoDeDias(60));
    expect(readStoredRange().days).toBe(7);
  });

  it('descarta un valor guardado corrupto', () => {
    window.localStorage.setItem(RANGO_KEY, 'no-es-un-número');

    expect(readStoredRange().days).toBe(7);
  });
});
