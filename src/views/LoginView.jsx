import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  Info,
  LifeBuoy,
  LoaderCircle,
  Lock,
  Mail,
} from 'lucide-react';
import { requestLogin } from '../services/authService';
import { focusFirstInvalidField } from '../utils/formFocus';
import { getEmailErrorMessage, isValidEmail } from '../utils/emailValidation';

const DEMO_AVATARS = [
  { initials: 'JD', bg: '#EEF0FF', fg: '#3323CC' },
  { initials: 'MS', bg: '#FDF2F8', fg: '#BE185D' },
  { initials: 'LR', bg: '#ECFDF5', fg: '#047857' },
];

const getSubmitErrorMessage = (error) =>
  error?.message ||
  'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.';

// El `focus:outline-none!` de los campos enfoca en índigo según el diseño.
// El `!` es necesario: index.css define un `:focus-visible` global azul fuera
// de cualquier capa y, en CSS, lo no estratificado gana a @layer utilities.

export function LoginView() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);

  const updateEmail = (value) => {
    setEmail(value);

    if (error) {
      setError(isValidEmail(value) ? '' : getEmailErrorMessage(value));
    }

    setSubmitError('');
  };

  const handleBlur = () => {
    setError(isValidEmail(email) ? '' : getEmailErrorMessage(email));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationError = isValidEmail(email)
      ? ''
      : getEmailErrorMessage(email);
    setError(validationError);

    if (validationError) {
      setSubmitError('');
      focusFirstInvalidField(formRef, { email: validationError });
      return;
    }

    setIsSubmitting(true);

    try {
      await requestLogin(email);
      navigate('/hoy', { replace: true });
    } catch (requestError) {
      setSubmitError(getSubmitErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldProps = {
    id: 'login-email',
    name: 'email',
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? 'login-email-error' : undefined,
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFF] px-4 py-10 text-[#111827] sm:px-6">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-[#3323CC] shadow-[0_10px_24px_-8px_rgba(51,35,204,0.55)]">
            <CalendarCheck
              aria-hidden="true"
              className="size-7 text-white"
              strokeWidth={2.2}
            />
          </span>
          <p className="mt-4 text-2xl font-extrabold tracking-tight text-[#111827]">
            EventFlow<span className="text-[#3323CC]">.</span>
          </p>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6B7280]">
            Workspace Orchestration
          </p>
        </div>

        <div className="rounded-3xl bg-white p-7 shadow-[0_18px_40px_-20px_rgba(17,24,39,0.25)] sm:p-9">
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#111827]">
            Bienvenido de nuevo
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Ingresa tus datos para conectarte a tu cuenta
          </p>

          {submitError && (
            <p
              role="alert"
              className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
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
              className="mb-2 block text-sm font-semibold text-[#111827]"
            >
              Correo electrónico
            </label>
            <div className="relative">
              <Mail
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#9CA3AF]"
                strokeWidth={1.8}
              />
              <input
                {...fieldProps}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="ejemplo@correo.com"
                className={`w-full rounded-2xl border bg-[#EEF0FF] py-3.5 pl-12 pr-4 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none! focus-visible:ring-2 focus-visible:ring-[#3323CC] focus-visible:ring-offset-2 ${
                  error
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : 'border-transparent focus-visible:border-[#3323CC]'
                }`}
                value={email}
                onChange={(changeEvent) =>
                  updateEmail(changeEvent.target.value)
                }
                onBlur={handleBlur}
                disabled={isSubmitting}
                required
              />
            </div>
            {error && (
              <p
                id="login-email-error"
                role="alert"
                className="mt-2 text-sm text-red-600"
              >
                {error}
              </p>
            )}

            <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-[#EEF0FF] p-4">
              <Info
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-[#3323CC]"
                strokeWidth={2}
              />
              <p className="text-[13px] leading-relaxed text-[#4B5563]">
                Te recomendamos usar el correo con el que te registraste para
                acceder más rápido.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#3323CC] px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_20px_-10px_rgba(51,35,204,0.7)] transition-colors hover:bg-[#26189E] focus:outline-none! focus-visible:ring-2 focus-visible:ring-[#3323CC] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
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
                  Continuar
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
                className="flex size-8 items-center justify-center rounded-full text-[11px] font-bold ring-2 ring-[#FAFAFF]"
                style={{ backgroundColor: avatar.bg, color: avatar.fg }}
              >
                {avatar.initials}
              </span>
            ))}
          </div>
          <span className="text-[13px] text-[#6B7280]">
            +3.2k coordinadores activos hoy
          </span>
        </div>

        <div className="mt-7 text-center">
          <a
            href="mailto:soporte@eventflow.co?subject=Ayuda%20para%20iniciar%20sesi%C3%B3n"
            className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-[#3323CC] hover:underline focus:outline-none! focus-visible:ring-2 focus-visible:ring-[#3323CC] focus-visible:ring-offset-2"
          >
            <LifeBuoy aria-hidden="true" className="size-4" strokeWidth={2} />
            ¿Necesitas ayuda para iniciar sesión?
          </a>
        </div>

        <div className="mt-9 flex flex-col items-center gap-2.5 text-center">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
            <Lock aria-hidden="true" className="size-3" strokeWidth={2.2} />
            Cifrado de extremo a extremo
          </p>
          <p className="max-w-sm text-[11px] leading-relaxed text-[#9CA3AF]">
            Al continuar, aceptas la protección de datos y condiciones de
            servicio corporativo de EventFlow.
          </p>
        </div>
      </div>
    </div>
  );
}
