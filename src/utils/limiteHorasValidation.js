export const LIMITE_MIN = 1;
export const LIMITE_MAX = 16;

/**
 * Valida el límite de horas diarias. Debe ser un entero entre LIMITE_MIN y
 * LIMITE_MAX, que es el rango que acepta el backend (`UsuarioDTO`).
 *
 * @param {string|number} value
 * @returns {string} mensaje de error, o cadena vacía si es válido
 */
export const validateLimiteHoras = (value) => {
  const texto = String(value ?? '').trim();

  if (!texto) {
    return `Dejaste el límite vacío. Ingresa un número entero entre ${LIMITE_MIN} y ${LIMITE_MAX}.`;
  }

  const numero = Number(texto);

  if (!Number.isFinite(numero)) {
    return 'Ingresaste un valor no válido. Usa un número entero de horas.';
  }

  if (!Number.isInteger(numero)) {
    return 'Ingresaste una fracción. Usa un número entero de horas.';
  }

  if (numero < LIMITE_MIN || numero > LIMITE_MAX) {
    return `El límite debe estar entre ${LIMITE_MIN} y ${LIMITE_MAX} horas diarias.`;
  }

  return '';
};
