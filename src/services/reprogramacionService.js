import { api, unwrapData } from './api';
import * as mock from './mocks/reprogramacion';

// Puerta única del frontend hacia el contrato de reprogramación
// (docs/contrato-reprogramacion.md). Con VITE_USE_MOCKS=true responde el mock
// en memoria; en cualquier otro caso habla con el backend real. Las vistas
// consumen este servicio, nunca `api` ni el mock directamente.
const USE_MOCKS =
  String(import.meta.env.VITE_USE_MOCKS ?? '').toLowerCase() === 'true';

/** Expuesto para que la UI pueda avisar (o no) que los datos no son reales. */
export const usingMocks = USE_MOCKS;

export const getProfile = async () => {
  if (USE_MOCKS) {
    return mock.getProfile();
  }

  return unwrapData(await api.getProfile());
};

export const updateProfileLimit = async (payload) => {
  if (USE_MOCKS) {
    return mock.updateProfileLimit(payload);
  }

  return unwrapData(await api.updateProfileLimit(payload));
};

export const reprogramarSubtask = async (id, payload) => {
  if (USE_MOCKS) {
    return mock.reprogramarSubtask(id, payload);
  }

  // Sin `unwrapData` y sin traducir el 409: la respuesta va cruda para que la
  // vista distinga el 200 con la SubtareaDTO plana del ApiError 409, y lo lea con
  // los nombres de campo que el backend manda de verdad.
  return api.reprogramarSubtask(id, payload);
};
