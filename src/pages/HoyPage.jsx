import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/states/EmptyState';

export const HoyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
          Panel del día
        </p>
        <h2 className="text-3xl font-bold text-gray-900">Gestiones de hoy</h2>
        <p className="mt-2 max-w-2xl text-gray-600">
          Organiza tus tareas pendientes y mantén cada evento bajo control.
        </p>
      </div>

      <EmptyState
        title="Aún no hay gestiones para hoy"
        description="Cuando crees un evento, sus tareas pendientes aparecerán aquí para que no pierdas ninguna gestión."
        actionLabel="Crear tu primer evento"
        onAction={() => navigate('/crear')}
      />
    </div>
  );
};
