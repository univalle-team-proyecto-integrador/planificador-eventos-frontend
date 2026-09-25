const ACCENTS = [
  { hex: '#4F46E5', soft: '#EEF2FF', glow: 'rgba(79, 70, 229, 0.45)' },
  { hex: '#0D9488', soft: '#F0FDFA', glow: 'rgba(13, 148, 136, 0.45)' },
  { hex: '#D97706', soft: '#FFFBEB', glow: 'rgba(217, 119, 6, 0.45)' },
  { hex: '#DB2777', soft: '#FDF2F8', glow: 'rgba(219, 39, 119, 0.45)' },
  { hex: '#7C3AED', soft: '#F5F3FF', glow: 'rgba(124, 58, 237, 0.45)' },
  { hex: '#0891B2', soft: '#ECFEFF', glow: 'rgba(8, 145, 178, 0.45)' },
];

export const getEventAccent = (eventId) => {
  const numericId = Number(eventId);

  if (!Number.isFinite(numericId) || numericId < 0) {
    return ACCENTS[0];
  }

  return ACCENTS[numericId % ACCENTS.length];
};
