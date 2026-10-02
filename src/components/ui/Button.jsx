// Los colores salen de los tokens de src/index.css: `primary` es el morado de
// marca y `neutral` usa la superficie del tema, así que ambos funcionan igual en
// modo claro y oscuro. Si agregas un color nuevo, agrégalo como token allí, no
// como clase de Tailwind: una clase literal no cambia con el tema.
const baseStyle =
  'inline-flex h-10 items-center justify-center gap-2 px-4 py-2 whitespace-nowrap rounded-md font-semibold text-sm transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  primary:
    'bg-primary text-primary-contrast hover:bg-primary-hover focus-visible:ring-brand-text border border-transparent',
  danger:
    'bg-danger text-primary-contrast hover:bg-danger-text focus-visible:ring-danger border border-transparent',
  success:
    'bg-success text-primary-contrast hover:bg-success-text focus-visible:ring-success border border-transparent',
  neutral:
    'bg-surface-raised text-secondary-text hover:bg-surface-sunken focus-visible:ring-border-strong border border-border shadow-sm',
};

const getButtonClassName = ({ variant = 'neutral', className = '' } = {}) =>
  `${baseStyle} ${variants[variant] || variants.neutral} ${className}`.trim();

export function Button({
  as: Component = 'button',
  variant = 'neutral',
  children,
  type = 'button',
  disabled = false,
  className = '',
  ...props
}) {
  const nativeButtonProps = Component === 'button' ? { type, disabled } : {};

  return (
    <Component
      {...nativeButtonProps}
      {...props}
      className={getButtonClassName({ variant, className })}
    >
      {children}
    </Component>
  );
}
