export const getToday = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

export const isDateInPast = (value, today = getToday()) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return value < today;
};

export const getPastDateMessage = (label = 'La fecha') =>
  `${label} ya pasó. Selecciona hoy o una fecha futura.`;
