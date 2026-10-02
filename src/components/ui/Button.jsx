// Los colores salen de los tokens de src/index.css: `primary` es el morado de
// marca y `neutral` usa la superficie del tema, así que ambos funcionan
// igual en modo claro y oscuro. Si agregas un color nuevo, agrégalo como token
// allí, no como clase de Tailwind: una clase literal no cambia con el tema.
//
// La base lleva la "reacción de agarre": el cursor pasa a mano, el botón se
// eleva al pasar el mouse y se hunde al presionar. Ojo con la transición: hay
// que animar transform y box-shadow además del color, o el efecto no se ve.
//
// `motion-reduce` desactiva el desplazamiento para quien tenga el movimiento
// reducido activado en el sistema.
const baseStyle =
  'inline-flex h-10 cursor-pointer items-center justify-center gap-2 px-4 py-2 whitespace-nowrap rounded-md font-semibold text-sm transition-[color,background-color,border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] active:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  primary:
    'bg-primary text-primary-contrast hover:bg-primary-hover focus-visible:ring-brand-text border border-transparent',
  danger:
    'bg-danger text-danger-text hover:bg-danger-soft focus-visible:ring-danger border border-[#ab0100]',
  success:
    'bg-success text-primary-contrast hover:bg-success-text focus-visible:ring-success border border-transparent',
  neutral:
    'bg-surface-raised text-secondary-text hover:bg-surface-sunken focus-visible:ring-border-strong border border-border shadow-sm',

  // Contornos: en reposo el fondo es la superficie del tema (blanco en claro,
// oscuro invertido en oscuro) y el borde anticipa la acción. Al pasar el mouse
// el botón se llena con su tinte.
//
// El verde se llena del todo, y su texto necesita `--success-contrast` porque
// `#047857` admite blanco (5.48:1) y `#34d399` no (1.92:1): va blanco en claro
// y oscuro en oscuro.
//
// El rojo no se llena: `--danger` es blanco y el rojo vive en el borde y el
// texto, así que al pasar el mouse baja a `--danger-soft`. Con eso el texto
// puede ser rojo en los dos temas y el botón no grita. Por eso no lleva
// `-contrast` propio: no hay relleno de color que le haga falta.
//
// El borde neutro usa `muted-text` y no `border-strong`: `border-strong` se
// queda en 1.47:1 sobre la superficie, y un borde así es justo el caso que
// 1.4.11 marca (el borde es lo único que identifica el control).
  'success-outline':
    'border-success bg-surface-raised text-primary-text hover:bg-success hover:text-success-contrast focus-visible:ring-success',
  'danger-outline':
    'border-danger-text bg-surface-raised text-danger-text hover:bg-danger-soft focus-visible:ring-danger-text',
  'neutral-outline':
    'border-muted-text bg-surface-raised text-primary-text hover:bg-surface-sunken hover:text-primary-text focus-visible:ring-border-strong',
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
