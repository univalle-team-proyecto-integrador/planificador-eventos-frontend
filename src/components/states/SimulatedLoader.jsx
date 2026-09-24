import { useEffect, useState } from 'react';

export const SimulatedLoader = ({
  children,
  delay = 600,
  label = 'Cargando contenido',
}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[50vh] font-sans"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span
          className="w-9 h-9 rounded-full border-4 border-[#e5e4e7] animate-spin"
          style={{ borderTopColor: '#2563eb' }}
          aria-hidden="true"
        />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return children ?? null;
};
