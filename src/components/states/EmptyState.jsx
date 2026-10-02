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
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col items-center justify-center p-10 text-center bg-surface-sunken border border-dashed border-border rounded-lg"
    >
      <Icon
        aria-hidden="true"
        className="mb-4 size-12 text-muted-text"
        strokeWidth={1.5}
      />

      <h2 id={titleId} className="text-lg font-semibold text-primary-text mb-2">
        {title}
      </h2>
      {description && (
        <p id={descriptionId} className="mb-5 max-w-md text-sm text-secondary-text">
          {description}
        </p>
      )}
      {onAction && (
        <div className="flex flex-wrap items-center justify-center gap-2">
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
          {secondaryActionLabel && onSecondaryAction && (
            <Button type="button" variant="neutral" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </section>
  );
};
