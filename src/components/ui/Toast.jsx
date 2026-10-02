import { Check, Pencil, Trash2, Undo2, X } from 'lucide-react';

const iconComponents = {
  check: Check,
  edit: Pencil,
  trash: Trash2,
  undo: Undo2,
};

const badgeStyles = {
  check: 'bg-success-soft text-success-text',
  edit: 'bg-info-soft text-brand-text',
  trash: 'bg-surface-sunken text-muted-text',
  undo: 'bg-warning-soft text-warning-text',
};

export function Toast({ toast, onDismiss }) {
  const Icon = iconComponents[toast.icon] || Check;
  const style = badgeStyles[toast.icon] || badgeStyles.check;

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-surface-raised p-4 shadow-lg ${
        toast.leaving ? 'toast-leave' : 'toast-enter'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style}`}
      >
        <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
      </span>

      <p className="flex-1 pt-1.5 text-sm text-secondary-text">{toast.message}</p>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar notificación"
        className="cursor-pointer rounded-md p-1 text-muted-text transition-colors hover:bg-surface-sunken hover:text-secondary-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-text"
      >
        <X aria-hidden="true" className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}
