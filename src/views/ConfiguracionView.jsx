import { useCallback, useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { FieldSuccess } from '../components/ui/FieldSuccess';
import { useNotifications } from '../providers/notifications-context';
import {
  LIMITE_MAX,
  LIMITE_MIN,
  validateLimiteHoras,
} from '../utils/limiteHorasValidation';
import {
  getProfile,
  updateProfileLimit,
  usingMocks,
} from '../services/reprogramacionService';

/**
 * Vista de Configuración.
 *
 * Incluye el límite de horas diarias del organizador (contrato en
 * docs/contrato-reprogramacion.md). Mientras el backend no exponga
 * PATCH /api/users/profile, con VITE_USE_MOCKS=true se edita contra el mock.
 */
export const ConfiguracionView = () => {
  const { notifySuccess, notifyError } = useNotifications();

  const [limite, setLimite] = useState('');
  const [limiteGuardado, setLimiteGuardado] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const cargarPerfil = useCallback(async () => {
    try {
      const perfil = await getProfile();
      const valor = perfil?.limiteHorasDiarias ?? '';
      setLimite(String(valor));
      setLimiteGuardado(Number(valor));
    } catch (error) {
      setLoadError(
        error?.message || 'No pudimos cargar tu perfil. Inténtalo de nuevo.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // La carga inicial sincroniza la vista con el perfil del backend.
    // oxlint-disable-next-line react/set-state-in-effect
    void cargarPerfil();
  }, [cargarPerfil]);

  const reintentar = () => {
    setIsLoading(true);
    setLoadError('');
    void cargarPerfil();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const error = validateLimiteHoras(limite);
    if (error) {
      setFieldError(error);
      setSaved(false);
      return;
    }

    setFieldError('');
    setIsSaving(true);

    try {
      const perfil = await updateProfileLimit({
        limiteHorasDiarias: Number(limite),
      });
      const valor = perfil?.limiteHorasDiarias ?? Number(limite);
      setLimite(String(valor));
      setLimiteGuardado(Number(valor));
      setSaved(true);
      notifySuccess({
        icon: 'check',
        message: 'Límite diario actualizado correctamente.',
      });
    } catch (saveError) {
      notifyError({
        title: 'No pudimos guardar el límite',
        message:
          saveError?.message ||
          'No pudimos conectar con el servidor. Inténtalo de nuevo.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sinCambios = Number(limite) === limiteGuardado;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-text">
          Preferencias
        </p>
        <h2 className="text-3xl font-bold text-primary-text">Configuración</h2>
        <p className="mt-2 max-w-2xl text-secondary-text">
          Aquí podrás ajustar las preferencias de tu cuenta y del planificador.
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-primary-text">
          Límite de horas diarias
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-secondary-text">
          Es la cantidad de horas que puedes asignar como máximo a un mismo día.
          Al reprogramar una gestión, el planificador avisa si la suma lo
          supera.
        </p>

        {isLoading ? (
          <p role="status" className="mt-4 text-sm text-secondary-text">
            Cargando tu límite diario...
          </p>
        ) : loadError ? (
          <div className="mt-4">
            <ErrorState
              title="No pudimos cargar tu límite"
              message={loadError}
              onRetry={reintentar}
            />
          </div>
        ) : usingMocks ? (
          <form className="mt-4 max-w-xs" onSubmit={handleSubmit} noValidate>
            <label
              htmlFor="limite-horas"
              className="block text-sm font-medium text-secondary-text"
            >
              Horas por día
            </label>
            <input
              id="limite-horas"
              name="limite-horas"
              type="number"
              inputMode="numeric"
              min={LIMITE_MIN}
              max={LIMITE_MAX}
              step={1}
              value={limite}
              onChange={(event) => {
                setLimite(event.target.value);
                setSaved(false);
                if (fieldError) {
                  setFieldError('');
                }
              }}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={
                fieldError ? 'limite-horas-error' : 'limite-horas-help'
              }
              className="mt-1 h-10 w-full rounded-md border border-border bg-surface-raised px-3 text-sm text-primary-text focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            />

            {fieldError ? (
              <p
                id="limite-horas-error"
                role="alert"
                className="mt-1 text-xs text-danger-text"
              >
                {fieldError}
              </p>
            ) : saved ? (
              <FieldSuccess id="limite-horas-success">
                ¡Listo! Límite diario guardado.
              </FieldSuccess>
            ) : (
              <p
                id="limite-horas-help"
                className="mt-1 text-xs text-muted-text"
              >
                Entre {LIMITE_MIN} y {LIMITE_MAX} horas.
              </p>
            )}

            <div className="mt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={isSaving || sinCambios}
                aria-busy={isSaving}
              >
                {isSaving ? 'Guardando...' : 'Guardar límite'}
              </Button>
            </div>

            <p className="mt-3 text-xs text-muted-text">
              Modo demo: el límite se guarda en memoria hasta que el backend
              exponga el endpoint.
            </p>
          </form>
        ) : (
          <div className="mt-4 max-w-xs">
            <p className="text-sm text-secondary-text">Tu límite actual</p>
            <p className="mt-1 text-2xl font-semibold text-primary-text">
              {limiteGuardado} h por día
            </p>
            <p className="mt-2 text-xs text-muted-text">
              La edición estará disponible cuando el backend exponga el endpoint
              para cambiar el límite.
            </p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-primary-text">
          Sistema de botones
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-secondary-text">
          Vista previa del sistema de botones con CSS puro
          (`src/styles/buttons.css`) y variables por tema. Cambia el tema para
          ver cómo se adaptan los colores.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary">Primario</Button>
          <Button variant="success">Éxito</Button>
          <Button variant="danger">Peligro</Button>
          <Button variant="neutral">Neutro</Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button variant="success-outline">Éxito contorno</Button>
          <Button variant="danger-outline">Peligro contorno</Button>
          <Button variant="neutral-outline">Neutro contorno</Button>
          <Button variant="primary" disabled>
            Deshabilitado
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <EmptyState
          title="Próximamente"
          description="Seguimos preparando más opciones de configuración. Mientras tanto, puedes cambiar el tema con el interruptor de la barra superior y cerrar sesión desde tu menú de perfil."
        />
      </Card>
    </div>
  );
};
