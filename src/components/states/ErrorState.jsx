import { TriangleAlert } from 'lucide-react';
import { useId } from 'react';
import { Button } from '../ui/Button';

export const ErrorState = ({
  id,
  title = 'No pudimos completar la operación',
  message = 'Revisa tu conexión e inténtalo de nuevo.',
  onRetry,
  isRetrying = false,
}) => {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <section
      id={id}
      role="alert"
      aria-live="assertive"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="flex flex-col items-center justify-center p-8 text-center bg-danger-soft border border-danger rounded-lg"
    >
      <TriangleAlert
        aria-hidden="true"
        className="mb-4 size-12 text-danger"
        strokeWidth={1.5}
      />

      <h2 id={titleId} className="text-lg font-bold text-danger-text mb-2">
        {title}
      </h2>
      <p id={descriptionId} className="text-sm text-danger-text mb-5 max-w-sm">
        {message}
      </p>
      {onRetry && (
        <Button
          type="button"
          variant="neutral"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? 'Reintentando...' : 'Reintentar'}
        </Button>
      )}
    </section>
  );
};
