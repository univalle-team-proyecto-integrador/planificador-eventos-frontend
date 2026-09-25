import { describe, expect, it } from 'vitest';
import { getPastDateMessage, isDateInPast } from './dateValidation';

describe('dateValidation', () => {
  it('detecta una fecha anterior al día local de referencia', () => {
    expect(isDateInPast('2026-09-24', '2026-09-25')).toBe(true);
    expect(isDateInPast('2026-09-25', '2026-09-25')).toBe(false);
    expect(isDateInPast('2026-09-26', '2026-09-25')).toBe(false);
  });

  it('no interpreta valores vacíos o inválidos como fechas pasadas', () => {
    expect(isDateInPast('', '2026-09-25')).toBe(false);
    expect(isDateInPast('no-es-fecha', '2026-09-25')).toBe(false);
  });

  it('explica qué ocurrió y cómo corregir una fecha pasada', () => {
    expect(getPastDateMessage('La fecha objetivo')).toBe(
      'La fecha objetivo ya pasó. Selecciona hoy o una fecha futura.'
    );
  });
});
