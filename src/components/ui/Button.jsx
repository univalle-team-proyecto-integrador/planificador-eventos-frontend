const baseStyle =
  'inline-flex h-10 items-center justify-center px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

const variants = {
  primary:
    'bg-brand text-white hover:bg-accent focus-visible:ring-accent border border-transparent',
  danger:
    'bg-red-50 text-red-800 hover:bg-red-100 focus-visible:ring-red-300 border border-red-300 shadow-sm',
  success:
    'bg-accent text-white hover:bg-brand focus-visible:ring-accent border border-transparent',
  neutral:
    'bg-white text-gray-800 hover:bg-gray-100 focus-visible:ring-accent border border-gray-300 shadow-sm',
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
