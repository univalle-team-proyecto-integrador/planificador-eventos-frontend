import { createContext, useContext } from 'react';

export const SessionContext = createContext(null);

export const useSession = () => {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession debe usarse dentro de SessionProvider.');
  }

  return context;
};
