import { describe, expect, it } from 'vitest';
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  getPasswordErrorMessage,
  isValidPassword,
  normalizePassword,
} from './passwordValidation';

describe('passwordValidation', () => {
  it('normalizePassword convierte a texto y tolera null', () => {
    expect(normalizePassword('  Eventos2026  ')).toBe('  Eventos2026  ');
    expect(normalizePassword(null)).toBe('');
    expect(normalizePassword(undefined)).toBe('');
  });

  it('isValidPassword acepta combinaciones de letras y números', () => {
    expect(isValidPassword('Eventos2026')).toBe(true);
    expect(isValidPassword('abc12345')).toBe(true);
  });

  it('isValidPassword rechaza contraseñas sin letras o sin números', () => {
    expect(isValidPassword('12345678')).toBe(false);
    expect(isValidPassword('abcdefgh')).toBe(false);
  });

  it('isValidPassword aplica los límites de longitud del backend', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(MAX_PASSWORD_LENGTH).toBe(72);
    expect(isValidPassword('corta1')).toBe(false);
    expect(isValidPassword('a'.repeat(70) + '1')).toBe(true);
    expect(isValidPassword('a'.repeat(73) + '1')).toBe(false);
  });

  it('getPasswordErrorMessage explica qué corregir', () => {
    expect(getPasswordErrorMessage('')).toBe('La contraseña no puede estar vacía.');
    expect(getPasswordErrorMessage('corta1')).toContain('al menos 8 caracteres');
    expect(getPasswordErrorMessage('a'.repeat(73) + '1')).toContain(
      'no puede superar los 72 caracteres'
    );
    expect(getPasswordErrorMessage('12345678')).toBe(
      'Combina al menos una letra y un número.'
    );
    expect(getPasswordErrorMessage('Eventos2026')).toBe('');
  });
});
