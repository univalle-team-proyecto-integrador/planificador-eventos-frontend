import { useEffect, useState } from 'react';

export const SimulatedLoader = ({ children, delay = 600 }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          fontFamily: 'sans-serif',
        }}
      >
        <span
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '4px solid #e5e4e7',
            borderTopColor: '#aa3bff',
            animation: 'spin 1s linear infinite',
          }}
          role="status"
          aria-label="Cargando"
        />
      </div>
    );
  }

  return children;
};
