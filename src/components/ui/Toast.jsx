const iconPaths = {
  check: <polyline points="20 6 9 17 4 12" />,
  edit: <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />,
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </>
  ),
  undo: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5h0a5.5 5.5 0 0 1-5.5 5.5H11" />
    </>
  ),
};

const badgeStyles = {
  check: 'bg-emerald-50 text-emerald-600',
  edit: 'bg-blue-50 text-blue-600',
  trash: 'bg-gray-100 text-gray-500',
  undo: 'bg-amber-50 text-amber-600',
};

export function Toast({ toast, onDismiss }) {
  const style = badgeStyles[toast.icon] || badgeStyles.check;

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-lg ${
        toast.leaving ? 'toast-leave' : 'toast-enter'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style}`}
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {iconPaths[toast.icon] || iconPaths.check}
        </svg>
      </span>

      <p className="flex-1 pt-1.5 text-sm text-gray-700">{toast.message}</p>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar notificación"
        className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}
