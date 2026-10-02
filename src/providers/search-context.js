import { createContext, useContext } from 'react';

export const SearchContext = createContext(null);

export const useTaskSearch = () => {
  const context = useContext(SearchContext);

  if (!context) {
    throw new Error('useTaskSearch debe usarse dentro de SearchProvider.');
  }

  return context;
};