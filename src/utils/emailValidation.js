const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const normalizeEmail = (value) => String(value ?? '').trim();

export const isValidEmail = (value) =>
  EMAIL_PATTERN.test(normalizeEmail(value));

export const getEmailErrorMessage = (value) => {
  if (!normalizeEmail(value)) {
    return 'Dejaste el correo vacío. Escribe el correo con el que te registraste.';
  }

  return 'Ingresa un correo válido, como ejemplo@correo.com.';
};
