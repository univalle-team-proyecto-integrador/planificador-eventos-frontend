import { Check } from 'lucide-react';

export function FieldSuccess({ id, children }) {
  return (
    <p
      id={id}
      role="status"
      className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600"
    >
      <Check aria-hidden="true" className="inline size-3.5" />
      {children}
    </p>
  );
}
