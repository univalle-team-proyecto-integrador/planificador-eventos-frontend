const baseStyle =
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold';

const variants = {
  neutral: 'bg-gray-100 text-gray-700',
  info: 'bg-blue-50 text-blue-700',
  pending: 'bg-amber-50 text-amber-700',
  success: 'bg-emerald-50 text-emerald-700',
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
