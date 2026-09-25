import { Check, Pencil, Trash2, Undo2, X } from 'lucide-react';

const iconComponents = {
  check: Check,
  edit: Pencil,
  trash: Trash2,
  undo: Undo2,
};

const badgeStyles = {
  check: 'bg-emerald-50 text-emerald-600',
  edit: 'bg-blue-50 text-blue-600',
  trash: 'bg-gray-100 text-gray-500',
  undo: 'bg-amber-50 text-amber-600',
};

export function Toast({ toast, onDismiss }) {
  const Icon = iconComponents[toast.icon] || Check;
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
        <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
      </span>

      <p className="flex-1 pt-1.5 text-sm text-gray-700">{toast.message}</p>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar notificación"
        className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <X aria-hidden="true" className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}
