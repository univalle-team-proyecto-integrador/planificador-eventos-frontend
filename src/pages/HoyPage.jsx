import { Link } from 'react-router-dom';

export const HoyPage = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '40px 20px',
      minHeight: '60vh',
      fontFamily: 'sans-serif',
      textAlign: 'center',
    }}
  >
    <h1 style={{ marginBottom: '0' }}>Sin tareas por hoy</h1>
    <p style={{ maxWidth: '420px', margin: '0', color: '#555' }}>
      Aún no creaste eventos. Las tareas vencidas y pendientes que requieren
      atención aparecerán aquí para que no pierdas ninguna gestión.
    </p>
    <Link
      to="/crear"
      style={{
        display: 'inline-block',
        padding: '10px 20px',
        borderRadius: '8px',
        color: '#fff',
        background: '#aa3bff',
        textDecoration: 'none',
        fontWeight: '600',
      }}
    >
      Crear tu primer evento
    </Link>
  </div>
);
