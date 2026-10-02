import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/states/EmptyState';

/**
 * Marcador de posición de Configuración.
 *
 * La ruta existe para que el ítem de la barra lateral tenga destino real y no
 * un enlace muerto. Cuando se implemente, esta vista se reemplaza; el ítem de
 * la barra lateral no cambia.
 */
export const ConfiguracionView = () => (
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
      <EmptyState
        title="Próximamente"
        description="Estamos preparando las opciones de configuración. Mientras tanto, puedes cambiar el tema con el interruptor de la barra superior y cerrar sesión desde tu menú de perfil."
      />
    </Card>
  </div>
);