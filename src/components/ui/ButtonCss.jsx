// El CSS vive en src/styles/buttons.css y se carga una sola vez en main.jsx.

// Variantes soportadas por el sistema CSS aislado. Cada clase `.btn--*` solo
// redefine `--btn-color` en src/styles/buttons.css; el color concreto por tema
// lo aportan los bloques :root[data-theme='light'] y :root[data-theme='dark'].
const VARIANTS = ['primary', 'success', 'danger'];

export function Button({
  as: Component = 'button',
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  disabled = false,
  ...props
}) {
  const variantClass = VARIANTS.includes(variant)
    ? `btn--${variant}`
    : 'btn--primary';
  const nativeProps = Component === 'button' ? { type, disabled } : {};

  return (
    <Component
      {...nativeProps}
      {...props}
      className={`btn ${variantClass} ${className}`.trim()}
    >
      {children}
    </Component>
  );
}
