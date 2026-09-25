const baseStyle =
  'px-3.5 py-1.5 rounded-md font-semibold text-sm transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  primary:
    'bg-blue-700 text-white hover:bg-blue-800 focus-visible:ring-blue-500 border border-transparent',
  danger:
    'bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-500 border border-transparent',
  success:
    'bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:ring-emerald-500 border border-transparent',
  neutral:
    'bg-white text-gray-800 hover:bg-gray-100 focus-visible:ring-gray-400 border border-gray-300 shadow-sm',
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
