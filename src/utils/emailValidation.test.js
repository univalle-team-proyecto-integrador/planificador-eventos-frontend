import { describe, expect, it } from 'vitest';
import {
  getEmailErrorMessage,
  isValidEmail,
  normalizeEmail,
} from './emailValidation';

describe('emailValidation', () => {
  it('acepta correos con formato válido', () => {
    expect(isValidEmail('ejemplo@correo.com')).toBe(true);
    expect(isValidEmail(' OLA.planificacion@correo.com ')).toBe(true);
    expect(isValidEmail('coordinador+dashboard@subdominio.co')).toBe(true);
  });

  it('rechaza correos vacíos o mal formados', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('   ')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail('ejemplo')).toBe(false);
    expect(isValidEmail('ejemplo@correo')).toBe(false);
    expect(isValidEmail('ejemplo@correo.')).toBe(false);
    expect(isValidEmail('@correo.com')).toBe(false);
    expect(isValidEmail('espacio interno@correo.com')).toBe(false);
  });

  it('normaliza recortando espacios externos', () => {
    expect(normalizeEmail('  ejemplo@correo.com ')).toBe('ejemplo@correo.com');
    expect(normalizeEmail(null)).toBe('');
  });

  it('explica qué ocurrió y cómo corregir un correo vacío', () => {
    expect(getEmailErrorMessage('')).toBe(
      'Dejaste el correo vacío. Escribe el correo con el que te registraste.'
    );
  });

  it('explica qué ocurrió y cómo corregir un correo inválido', () => {
    expect(getEmailErrorMessage('ejemplo@correo')).toBe(
      'Ingresa un correo válido, como ejemplo@correo.com.'
    );
  });
});
