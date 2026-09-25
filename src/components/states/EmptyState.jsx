import { Inbox } from 'lucide-react';
import { useId } from 'react';
import { Button } from '../ui/Button';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'Aún no hay información para mostrar',
  description = 'Cuando tengas datos, aparecerán aquí para que puedas continuar.',
  actionLabel = 'Agregar',
  actionIcon: ActionIcon,
  onAction,
}) => {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col items-center justify-center p-10 text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg"
    >
      <Icon
        aria-hidden="true"
        className="mb-4 size-12 text-gray-400"
        strokeWidth={1.5}
      />

      <h2 id={titleId} className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h2>
      {description && (
        <p id={descriptionId} className="mb-5 max-w-md text-sm text-gray-600">
          {description}
        </p>
      )}
      {onAction && (
        <Button type="button" variant="primary" onClick={onAction}>
          {ActionIcon && (
            <ActionIcon
              aria-hidden="true"
              className="mr-1 inline size-4"
              strokeWidth={2}
            />
          )}
          {actionLabel}
        </Button>
      )}
    </section>
  );
};
