import { useId } from 'react';
import { Button } from '../ui/Button';

export const ErrorState = ({
  title = 'No pudimos completar la operación',
  message = 'Revisa tu conexión e inténtalo de nuevo.',
  onRetry,
  isRetrying = false,
}) => {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <section
      role="alert"
      aria-live="assertive"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="flex flex-col items-center justify-center p-8 text-center bg-red-50 border border-red-100 rounded-lg"
    >
      <svg
        className="w-12 h-12 text-red-500 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>

      <h2 id={titleId} className="text-lg font-bold text-red-800 mb-2">
        {title}
      </h2>
      <p id={descriptionId} className="text-sm text-red-600 mb-5 max-w-sm">
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
