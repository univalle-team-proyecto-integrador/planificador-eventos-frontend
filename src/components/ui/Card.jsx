const baseStyle =
  'rounded-xl border border-border bg-surface-raised shadow-[0_4px_6px_rgba(0,0,0,0.05)]';

const variants = {
  default: baseStyle,
  flat: 'rounded-xl border border-border bg-surface-raised',
};

export function Card({
  as: Component = 'section',
  variant = 'default',
  className = '',
  children,
  ...props
}) {
  return (
    <Component
      {...props}
      className={`${variants[variant] || variants.default} ${className}`.trim()}
    >
      {children}
    </Component>
  );
}
