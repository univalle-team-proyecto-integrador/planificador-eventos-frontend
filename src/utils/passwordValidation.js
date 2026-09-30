const MINIMA_LONGITUD = 8;
const MAXIMA_LONGITUD = 72;

export const MIN_PASSWORD_LENGTH = MINIMA_LONGITUD;
export const MAX_PASSWORD_LENGTH = MAXIMA_LONGITUD;

export const normalizePassword = (value) => String(value ?? '');

export const isValidPassword = (value) => {
  const password = normalizePassword(value);

  return (
    password.length >= MINIMA_LONGITUD &&
    password.length <= MAXIMA_LONGITUD &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
};

// Las reglas son las mismas que valida el backend (RegistroRequestDTO), pero
// repetirlas aquí evita un viaje de red por cada tecla mal escrita.
export const getPasswordErrorMessage = (value) => {
  const password = normalizePassword(value);

  if (!password) {
    return 'La contraseña no puede estar vacía.';
  }

  if (password.length < MINIMA_LONGITUD) {
    return `La contraseña debe tener al menos ${MINIMA_LONGITUD} caracteres.`;
  }

  if (password.length > MAXIMA_LONGITUD) {
    return `La contraseña no puede superar los ${MAXIMA_LONGITUD} caracteres.`;
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Combina al menos una letra y un número.';
  }

  return '';
};
