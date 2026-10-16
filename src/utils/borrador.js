// Borrador automático de formularios de evento en localStorage.
//
// Evita perder datos si hay un error, recarga o cierre accidental.
// Sigue el mismo patrón que rangoPreximas.js y theme.js: clave `eventflow.*`,
// manejo de almacenamiento bloqueado y funciones puras sin dependencias de React.

const BORRADOR_KEY = 'eventflow.borradorEvento';

const getStorage = () => {
  try {
    return window.localStorage;
  } catch {
    // Modo privado o almacenamiento bloqueado: no se persiste el borrador.
    return null;
  }
};

/** Guarda el borrador del formulario de evento. */
export const saveBorrador = (data) => {
  const storage = getStorage();
  if (!storage) return;

  try {
    // Solo guardar si hay algún dato válido.
    const hasData = Object.values(data).some(
      (value) => String(value ?? '').trim() !== ''
    );
    if (hasData) {
      storage.setItem(BORRADOR_KEY, JSON.stringify(data));
    } else {
      storage.removeItem(BORRADOR_KEY);
    }
  } catch {
    // Cuota agotada o almacenamiento bloqueado: el borrador sigue en memoria.
  }
};

/** Lee el borrador guardado, o null si no existe o está corrupto. */
export const readBorrador = () => {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(BORRADOR_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;

    return parsed;
  } catch {
    // JSON corrupto: limpiar y devolver null.
    try {
      storage.removeItem(BORRADOR_KEY);
    } catch {
      // Ignorar errores de limpieza.
    }
    return null;
  }
};

/** Limpia el borrador (llamar al guardar exitosamente o al cancelar). */
export const clearBorrador = () => {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(BORRADOR_KEY);
  } catch {
    // Ignorar errores de limpieza.
  }
};
