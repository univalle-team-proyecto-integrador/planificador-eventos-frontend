import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  LifeBuoy,
  LoaderCircle,
  Lock,
  Mail,
} from 'lucide-react';
import logoUrlLight from '../img/Logo_h1.png';
import logoUrlDark from '../img/Logo_h2.png';
import { useTheme } from '../providers/theme-context';
import { useSession } from '../providers/session-context';
import { getEmailErrorMessage, isValidEmail } from '../utils/emailValidation';
import {
  getPasswordErrorMessage,
  isValidPassword,
} from '../utils/passwordValidation';
import { focusFirstInvalidField } from '../utils/formFocus';

const DEMO_AVATARS = [
  { initials: 'JD', bg: '#DFF0F5', fg: '#17697F' },
  { initials: 'MS', bg: '#FDF2F8', fg: '#BE185D' },
  { initials: 'LR', bg: '#ECFDF5', fg: '#047857' },
];

const getSubmitErrorMessage = (error) =>
  error?.message ||
  'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.';

// El `focus:outline-none!` de los campos enfoca en índigo según el diseño.
// El `!` es necesario: index.css define un `:focus-visible` global azul fuera
// de cualquier capa y, en CSS, lo no estratificado gana a @layer utilities.

const inputClass = (hasError) =>
  `w-full rounded-2xl border bg-primary-soft py-3.5 pl-12 pr-4 text-[15px] text-primary-text placeholder:text-muted-text focus:outline-none! focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 ${
    hasError
      ? 'border-danger focus-visible:ring-red-500'
      : 'border-transparent focus-visible:border-primary'
  }`;

const FieldError = ({ id, children }) =>
  children ? (
    <p id={id} role="alert" className="mt-2 text-sm text-danger-text">
      {children}
    </p>
  ) : null;

export function LoginView() {
  const navigate = useNavigate();
  const { login, isLoading } = useSession();
  // Sigue al tema aplicado, no a la preferencia del sistema: quien fuerza el
  // tema con el interruptor tiene que ver el logo de ese mismo tema.
  const { isDark } = useTheme();
  const logoUrl = isDark ? logoUrlDark : logoUrlLight;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const formRef = useRef(null);

  const isSubmitting = isLoading;

  const updateEmail = (value) => {
    setEmail(value);

    if (error) {
      setError(isValidEmail(value) ? '' : getEmailErrorMessage(value));
    }

    setSubmitError('');
  };

  const updatePassword = (value) => {
    setPassword(value);

    if (passwordError) {
      setPasswordError(
        isValidPassword(value) ? '' : getPasswordErrorMessage(value)
      );
    }

    setSubmitError('');
  };

  const handleBlur = () => {
    setError(isValidEmail(email) ? '' : getEmailErrorMessage(email));
  };

  const handlePasswordBlur = () => {
    setPasswordError(
      password
        ? isValidPassword(password)
          ? ''
          : getPasswordErrorMessage(password)
        : ''
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const emailError = isValidEmail(email) ? '' : getEmailErrorMessage(email);
    const passError = isValidPassword(password)
      ? ''
      : getPasswordErrorMessage(password);
    setError(emailError);
    setPasswordError(passError);

    if (emailError || passError) {
      setSubmitError('');
      focusFirstInvalidField(formRef, {
        email: emailError,
        password: passError,
      });
      return;
    }

    try {
      await login({ email, password });
      navigate('/hoy', { replace: true });
    } catch (requestError) {
      setSubmitError(getSubmitErrorMessage(requestError));
    }
  };

  const emailFieldProps = {
    id: 'login-email',
    name: 'email',
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? 'login-email-error' : undefined,
  };

  const passwordFieldProps = {
    id: 'login-password',
    name: 'password',
    'aria-invalid': Boolean(passwordError),
    'aria-describedby': passwordError ? 'login-password-error' : undefined,
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-10 text-primary-text sm:px-6">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          {/* El logo lleva el nombre, así que es el único sitio donde se dice
              cómo se llama la app: de ahí el `alt` con texto. La versión por
              tema se lee de `useTheme()` y no de la preferencia del sistema,
              para que quien fuerce el tema vea el logo de ese mismo tema. */}
          <img
            src={logoUrl}
            alt="BACO"
            width={62}
            height={96}
            className="h-24 w-auto object-contain"
          />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-text">
            Organiza. Coordina. Celebra
          </p>
        </div>

        <div className="rounded-3xl bg-surface-raised p-7 shadow-[0_18px_40px_-20px_rgba(17,24,39,0.25)] sm:p-9">
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-primary-text">
            Bienvenido de nuevo
          </h1>
          <p className="mt-2 text-sm text-muted-text">
            Ingresa tus datos para conectarte a tu cuenta
          </p>

          {submitError && (
            <p
              role="alert"
              className="mt-5 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger-text"
            >
              {submitError}
            </p>
          )}

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            noValidate
            aria-busy={isSubmitting}
            className="mt-6"
          >
            <label
              htmlFor="login-email"
              className="mb-2 block text-sm font-semibold text-primary-text"
            >
              Correo electrónico
            </label>
            <div className="relative">
              <Mail
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-text"
                strokeWidth={1.8}
              />
              <input
                {...emailFieldProps}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="ejemplo@correo.com"
                className={inputClass(Boolean(error))}
                value={email}
                onChange={(changeEvent) =>
                  updateEmail(changeEvent.target.value)
                }
                onBlur={handleBlur}
                disabled={isSubmitting}
                required
              />
            </div>
            <FieldError id="login-email-error">{error}</FieldError>

            <label
              htmlFor="login-password"
              className="mt-5 mb-2 block text-sm font-semibold text-primary-text"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-text"
                strokeWidth={1.8}
              />
              <input
                {...passwordFieldProps}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                className={`${inputClass(Boolean(passwordError))} pr-12`}
                value={password}
                onChange={(changeEvent) =>
                  updatePassword(changeEvent.target.value)
                }
                onBlur={handlePasswordBlur}
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                disabled={isSubmitting}
                aria-label={
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-text transition-colors hover:text-primary-text focus:outline-none! focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                {showPassword ? (
                  <EyeOff
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={1.8}
                  />
                ) : (
                  <Eye
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={1.8}
                  />
                )}
              </button>
            </div>
            <FieldError id="login-password-error">{passwordError}</FieldError>

            <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-primary-soft p-4">
              <Info
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-primary-text"
                strokeWidth={2}
              />
              <p className="text-[13px] leading-relaxed text-secondary-text">
                Si aún no tienes cuenta,{' '}
                <Link
                  to="/registro"
                  className="font-semibold text-primary-text underline hover:no-underline"
                >
                  regístrate aquí
                </Link>{' '}
                y podrás organizar tus eventos desde el primer día.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-[15px] font-semibold text-primary-contrast shadow-[0_10px_20px_-10px_rgba(78,176,209,0.55)] transition-colors hover:bg-primary-hover focus:outline-none! focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                  Verificando…
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={2.2}
                  />
                </>
              )}
            </button>
          </form>
        </div>

        <div
          aria-hidden="true"
          className="mt-7 flex items-center justify-center gap-3"
        >
          <div className="flex -space-x-2">
            {DEMO_AVATARS.map((avatar) => (
              <span
                key={avatar.initials}
                className="flex size-8 items-center justify-center rounded-full text-[11px] font-bold ring-2 ring-[var(--surface)]"
                style={{ backgroundColor: avatar.bg, color: avatar.fg }}
              >
                {avatar.initials}
              </span>
            ))}
          </div>
          <span className="text-[13px] text-muted-text">
            +3.2k coordinadores activos hoy
          </span>
        </div>

        <div className="mt-7 text-center">
          <a
            href="mailto:soporte@eventflow.co?subject=Ayuda%20para%20iniciar%20sesi%C3%B3n"
            className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-primary-text hover:underline focus:outline-none! focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
          >
            <LifeBuoy aria-hidden="true" className="size-4" strokeWidth={2} />
            ¿Necesitas ayuda para iniciar sesión?
          </a>
        </div>

        <div className="mt-9 flex flex-col items-center gap-2.5 text-center">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-text">
            <Lock aria-hidden="true" className="size-3" strokeWidth={2.2} />
            Cifrado de extremo a extremo
          </p>
          <p className="max-w-sm text-[11px] leading-relaxed text-muted-text">
            Al continuar, aceptas la protección de datos y condiciones de
            servicio corporativo de BACO.
          </p>
        </div>
      </div>
    </div>
  );
}
