import { describe, expect, it } from 'vitest';
import {
  getPastDateMessage,
  isDateInPast,
  maxGestionDate,
} from './dateValidation';

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

  describe('maxGestionDate', () => {
    const HOY = '2026-10-16';

    it('acota al día del evento cuando el evento todavía no pasó', () => {
      expect(maxGestionDate('2026-11-20', HOY)).toBe('2026-11-20');
    });

    it('deja el día del evento disponible como última opción', () => {
      expect(maxGestionDate(HOY, HOY)).toBe(HOY);
    });

    // Regresión: el `min` del input es hoy, así que un `max` con la fecha de un
    // evento vencido quedaba por detrás del `min` y el calendario nativo se
    // quedaba sin un solo día seleccionable. Es el caso más habitual en /hoy,
    // donde casi todas las gestionadas son de días anteriores.
    it('no acota cuando el evento ya pasó, para no dejar el calendario vacío', () => {
      expect(maxGestionDate('2026-10-10', HOY)).toBeNull();
      expect(maxGestionDate('2026-01-01', HOY)).toBeNull();
    });

    it('devuelve null si el evento no tiene fecha', () => {
      expect(maxGestionDate('', HOY)).toBeNull();
      expect(maxGestionDate(undefined, HOY)).toBeNull();
      expect(maxGestionDate(null, HOY)).toBeNull();
    });

    it('el rango resultante siempre tiene al menos un día seleccionable', () => {
      // La propiedad que importa: para cualquier fecha de evento, existe al
      // menos un día entre `hoy` y el tope.
      for (const fechaEvento of [
        '2026-01-01',
        '2026-10-15',
        HOY,
        '2026-10-17',
        '2027-05-05',
      ]) {
        const max = maxGestionDate(fechaEvento, HOY);
        expect(max === null || max >= HOY).toBe(true);
      }
    });
  });
});
