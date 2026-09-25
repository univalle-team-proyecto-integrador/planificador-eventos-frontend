export const EVENT_TYPE_ICONS = Object.freeze({
  corporativo: '💼',
  boda: '💍',
  cumpleaños: '🎂',
  social: '🥂',
  otros: '📌',
});

const normalizeTypeKey = (value) =>
  String(value ?? '')
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const getEventTypeIcon = (value) =>
  EVENT_TYPE_ICONS[normalizeTypeKey(value)] || EVENT_TYPE_ICONS.otros;
