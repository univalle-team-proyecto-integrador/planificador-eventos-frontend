import { useId } from 'react';
import { Button } from '../ui/Button';

export const EmptyState = ({
  icon,
  title = 'Aún no hay información para mostrar',
  description = 'Cuando tengas datos, aparecerán aquí para que puedas continuar.',
  actionLabel = 'Agregar',
  onAction,
}) => {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col items-center justify-center p-10 text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg"
    >
      {icon ? (
        <span className="mb-4 text-5xl" aria-hidden="true">
          {icon}
        </span>
      ) : (
        <svg
          className="mb-4 h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      )}

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
          {actionLabel}
        </Button>
      )}
    </section>
  );
};
