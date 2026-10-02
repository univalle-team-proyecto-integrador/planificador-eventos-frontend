const baseStyle =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold';

// Cada estado tiene su trio *-soft (fondo), *-text (texto) y el color fuerte.
// Los tres vienen de tokens, así que el contraste se mantiene en ambos temas.
const variants = {
  neutral: 'bg-surface-sunken text-secondary-text',
  info: 'bg-info-soft text-info-text',
  pending: 'bg-warning-soft text-warning-text',
  success: 'bg-success-soft text-success-text',
};

export function Badge({ variant = 'neutral', className = '', children, ...props }) {
  return (
    <span
      {...props}
      className={`${baseStyle} ${variants[variant] || variants.neutral} ${className}`.trim()}
    >
      {children}
    </span>
  );
}