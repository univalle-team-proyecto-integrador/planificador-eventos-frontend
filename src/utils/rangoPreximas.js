// Preferencia del rango de días del panel Hoy ("Mostrar próximos").
//
// Vive aparte de la vista por la misma razón que utils/theme.js y
// services/tokenStorage.js: HoyPage lo necesita sin que la lógica de
// almacenamiento quede mezclada con el JSX, y así el módulo se puede probar
// sin montar React.
//
// Se guarda en localStorage para que recargar la pantalla no devuelva al
// usuario a 7 días si estaba consultando 30. Un valor guardado que ya no
// exista en UPCOMING_RANGES se descarta: las opciones pueden cambiar entre
// despliegues y un `60` viejo no debe romper la vista.

import { DEFAULT_UPCOMING_RANGE, rangoDeDias } from './taskMetrics';

export const RANGO_KEY = 'eventflow.rango-proximas';

const getStorage = () => {
  try {
    return window.localStorage;
  } catch {
    // Modo privado o almacenamiento bloqueado: la preferencia no se persiste.
    return null;
  }
};

/** Rango guardado, o el predeterminado si no hay ninguno válido. */
export const readStoredRange = () => {
  try {
    return rangoDeDias(getStorage()?.getItem(RANGO_KEY));
  } catch {
    return DEFAULT_UPCOMING_RANGE;
  }
};

/** Guarda el rango y devuelve la opción normalizada que se terminó aplicando. */
export const persistRange = (days) => {
  const rango = rangoDeDias(days);

  try {
    getStorage()?.setItem(RANGO_KEY, String(rango.days));
  } catch {
    // Cuota agotada o almacenamiento bloqueado: el rango sigue activo en esta
    // pestaña, solo que no se recuerda al recargar.
  }

  return rango;
};
