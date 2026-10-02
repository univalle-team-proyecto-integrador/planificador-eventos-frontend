import { createContext, useContext } from 'react';

export const NotificationsContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error(
      'useNotifications debe usarse dentro de NotificationsProvider.'
    );
  }

  return context;
};
