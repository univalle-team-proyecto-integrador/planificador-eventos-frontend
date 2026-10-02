const baseStyle =
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold';

const variants = {
  neutral: 'bg-gray-100 text-gray-700',
  info: 'bg-accent/10 text-accent',
  pending: 'bg-amber-50 text-amber-700',
  success: 'bg-accent/10 text-accent',
};

export function Badge({
  variant = 'neutral',
  className = '',
  children,
  ...props
}) {
  return (
    <span
      {...props}
      className={`${baseStyle} ${variants[variant] || variants.neutral} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
