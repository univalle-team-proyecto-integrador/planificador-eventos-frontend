import { describe, expect, it } from 'vitest';
import {
  LIMITE_MAX,
  LIMITE_MIN,
  validateLimiteHoras,
} from './limiteHorasValidation';

describe('limiteHorasValidation', () => {
  it('acepta el rango válido del backend', () => {
    expect(validateLimiteHoras(LIMITE_MIN)).toBe('');
    expect(validateLimiteHoras('6')).toBe('');
    expect(validateLimiteHoras(LIMITE_MAX)).toBe('');
  });

  it('rechaza vacío y pide el rango', () => {
    expect(validateLimiteHoras('')).toBe(
      `Dejaste el límite vacío. Ingresa un número entero entre ${LIMITE_MIN} y ${LIMITE_MAX}.`
    );
    expect(validateLimiteHoras(null)).not.toBe('');
  });

  it('rechaza valores no numéricos y fracciones', () => {
    expect(validateLimiteHoras('muchas')).toBe(
      'Ingresaste un valor no válido. Usa un número entero de horas.'
    );
    expect(validateLimiteHoras('2.5')).toBe(
      'Ingresaste una fracción. Usa un número entero de horas.'
    );
  });

  it('rechaza valores fuera del rango', () => {
    expect(validateLimiteHoras(0)).toBe(
      `El límite debe estar entre ${LIMITE_MIN} y ${LIMITE_MAX} horas diarias.`
    );
    expect(validateLimiteHoras(LIMITE_MAX + 1)).toBe(
      `El límite debe estar entre ${LIMITE_MIN} y ${LIMITE_MAX} horas diarias.`
    );
  });
});
