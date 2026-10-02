import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  UserRound,
} from 'lucide-react';
import logoUrlLight from '../img/Logo_h1.png';
import logoUrlDark from '../img/Logo_h2.png';
import { useTheme } from '../providers/theme-context';
import { useSession } from '../providers/session-context';
import { focusFirstInvalidField } from '../utils/formFocus';
import { getEmailErrorMessage, isValidEmail } from '../utils/emailValidation';
import {
  getPasswordErrorMessage,
  isValidPassword,
} from '../utils/passwordValidation';

const getSubmitErrorMessage = (error) =>
  error?.message ||
  'No pudimos crear la cuenta. Revisa tu conexión e inténtalo de nuevo.';

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

/**
 * Alta de cuenta. El registro devuelve token, así que la persona queda
 * conectada y entra directo a /hoy sin pasar por el login.
 */
export function RegisterView() {
  const navigate = useNavigate();
  const { register, isLoading } = useSession();
  const { isDark } = useTheme();
  const logoUrl = isDark ? logoUrlDark : logoUrlLight;
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const formRef = useRef(null);

  const isSubmitting = isLoading;

  const getNameError = (value) => {
    if (!String(value ?? '').trim()) {
      return 'Escribe tu nombre para completar el registro.';
    }

    if (String(value).trim().length > 100) {
      return 'El nombre no puede superar los 100 caracteres.';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nombreValidacion = getNameError(nombre);
    const emailValidacion = isValidEmail(email)
      ? ''
      : getEmailErrorMessage(email);
    const passwordValidacion = isValidPassword(password)
      ? ''
      : getPasswordErrorMessage(password);

    setNameError(nombreValidacion);
    setEmailError(emailValidacion);
    setPasswordError(passwordValidacion);

    if (nombreValidacion || emailValidacion || passwordValidacion) {
      setSubmitError('');
      focusFirstInvalidField(formRef, {
        nombre: nombreValidacion,
        email: emailValidacion,
        password: passwordValidacion,
      });
      return;
    }

    try {
      await register({ nombre, email, password });
      navigate('/hoy', { replace: true });
    } catch (requestError) {
      setSubmitError(getSubmitErrorMessage(requestError));
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-10 text-primary-text sm:px-6">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src={logoUrl}
            alt=""
            width={96}
            height={150}
            className="h-24 w-auto object-contain"
          />
          <p className="mt-4 text-2xl font-extrabold tracking-tight text-primary-text">
            BACO<span className="text-primary-text">.</span>
          </p>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-text">
            Organiza. Coordina. Celebra
          </p>
        </div>

        <div className="rounded-3xl bg-surface-raised p-7 shadow-[0_18px_40px_-20px_rgba(17,24,39,0.25)] sm:p-9">
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-primary-text">
            Crea tu cuenta
          </h1>
          <p className="mt-2 text-sm text-muted-text">
            Organiza tus eventos y tu carga diaria en un solo lugar
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
              htmlFor="register-nombre"
              className="mb-2 block text-sm font-semibold text-primary-text"
            >
              Nombre completo
            </label>
            <div className="relative">
              <UserRound
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-text"
                strokeWidth={1.8}
              />
              <input
                id="register-nombre"
                name="nombre"
                type="text"
                autoComplete="name"
                placeholder="Santiago Pérez"
                aria-invalid={Boolean(nameError)}
                aria-describedby={
                  nameError ? 'register-nombre-error' : undefined
                }
                className={inputClass(Boolean(nameError))}
                value={nombre}
                onChange={(changeEvent) => {
                  setNombre(changeEvent.target.value);
                  setNameError('');
                  setSubmitError('');
                }}
                disabled={isSubmitting}
                required
              />
            </div>
            <FieldError id="register-nombre-error">{nameError}</FieldError>

            <label
              htmlFor="register-email"
              className="mt-5 mb-2 block text-sm font-semibold text-primary-text"
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
                id="register-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="ejemplo@correo.com"
                aria-invalid={Boolean(emailError)}
                aria-describedby={
                  emailError ? 'register-email-error' : undefined
                }
                className={inputClass(Boolean(emailError))}
                value={email}
                onChange={(changeEvent) => {
                  setEmail(changeEvent.target.value);
                  setEmailError('');
                  setSubmitError('');
                }}
                disabled={isSubmitting}
                required
              />
            </div>
            <FieldError id="register-email-error">{emailError}</FieldError>

            <label
              htmlFor="register-password"
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
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                aria-invalid={Boolean(passwordError)}
                aria-describedby={
                  passwordError ? 'register-password-error' : undefined
                }
                className={`${inputClass(Boolean(passwordError))} pr-12`}
                value={password}
                onChange={(changeEvent) => {
                  setPassword(changeEvent.target.value);
                  setPasswordError('');
                  setSubmitError('');
                }}
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
            <FieldError id="register-password-error">
              {passwordError}
            </FieldError>

            <p className="mt-3 text-[12px] leading-relaxed text-muted-text">
              Usa al menos 8 caracteres, combinando letras y números.
            </p>

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
                  Creando cuenta…
                </>
              ) : (
                <>
                  Crear cuenta
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

        <p className="mt-7 text-center text-sm text-muted-text">
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary-text underline hover:no-underline"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
