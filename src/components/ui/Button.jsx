// El CSS vive en src/styles/buttons.css y se carga una sola vez en main.jsx.
// Aquí solo se traduce `variant` a la clase `.btn--*` correspondiente.
//
// Los colores salen de los tokens de src/index.css (vía buttons.css), así que
// funcionan igual en modo claro y oscuro y no hay que tocar clases por tema. Si
// agregas una variante, define su `.btn--*` en buttons.css y mapeala aquí.
const VARIANTS = {
  primary: 'btn--primary',
  success: 'btn--success',
  warning: 'btn--warning',
  danger: 'btn--danger',
  neutral: 'btn--neutral',
  'success-outline': 'btn--success-outline',
  'warning-outline': 'btn--warning-outline',
  'danger-outline': 'btn--danger-outline',
  'primary-outline': 'btn--primary-outline',
  'neutral-outline': 'btn--neutral-outline',
  'danger-dark-text': 'btn--danger-dark-text',
};

const getButtonClassName = ({ variant = 'neutral', className = '' } = {}) =>
  `btn ${VARIANTS[variant] || VARIANTS.neutral} ${className}`.trim();

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
