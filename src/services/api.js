const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://planificador-eventos-backend-1.onrender.com'
).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const buildUrl = (path) =>
  `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const getServerMessage = (payload, fallback) => {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    return payload.detail || payload.message || payload.error || fallback;
  }

  return fallback;
};

const REQUEST_TIMEOUT_MS = 15000;

const request = async (path, options = {}) => {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const method = (options.method || 'GET').toUpperCase();

  const fetchOnce = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      return await fetch(buildUrl(path), {
        ...options,
        headers,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  };

  const connectError = (timedOut) =>
    new ApiError(
      timedOut
        ? 'El servidor tardó demasiado en responder. Inténtalo de nuevo.'
        : 'No pudimos conectar con el servidor. Revisa tu red e inténtalo de nuevo.'
    );

  let response;

  try {
    response = await fetchOnce();
  } catch (error) {
    const wasTimeout = error?.name === 'AbortError';

    if (!wasTimeout && method === 'GET') {
      // Cold start de Render free: reintentar una vez antes de avisar.
      try {
        response = await fetchOnce();
      } catch (retryError) {
        throw connectError(retryError?.name === 'AbortError');
      }
    } else {
      throw connectError(wasTimeout);
    }
  }

  const rawBody = await response.text();
  let data = null;

  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = rawBody;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      getServerMessage(
        data,
        `La operación falló con el estado ${response.status}.`
      ),
      response.status,
      data
    );
  }

  return data;
};

export const unwrapData = (payload) => payload?.data ?? payload;

export const getDefaultUserId = () => {
  const configuredId = Number(import.meta.env.VITE_USER_ID || 1);
  return Number.isInteger(configuredId) && configuredId > 0 ? configuredId : 1;
};

export const toApiDateTime = (value) => {
  if (!value) {
    return '';
  }

  return value.length === 10 ? `${value}T00:00:00` : value;
};

export const api = {
  createEvent(payload) {
    return request('/api/eventos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  listEventTypes() {
    return request('/api/tipos-evento');
  },

  listEvents(usuarioId) {
    const query = usuarioId
      ? `?usuarioId=${encodeURIComponent(usuarioId)}`
      : '';
    return request(`/api/eventos${query}`);
  },

  getEvent(id) {
    return request(`/api/eventos/${encodeURIComponent(id)}`);
  },

  updateEvent(id, payload) {
    return request(`/api/eventos/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  getSubtasks(eventId) {
    return request(`/api/eventos/${encodeURIComponent(eventId)}/subtareas`);
  },

  createSubtask(eventId, payload) {
    return request(`/api/eventos/${encodeURIComponent(eventId)}/subtareas`, {
      method: 'POST',
      body: JSON.stringify({
        nombreGestion: payload.nombreGestion,
        horasEstimadas: Number(payload.horasEstimadas),
        fechaObjetivo: payload.fechaObjetivo,
        notaExplicativa: payload.notaExplicativa ?? null,
      }),
    });
  },

  updateSubtaskDetails(id, payload) {
    return request(`/api/subtareas/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        nombreGestion: payload.nombreGestion,
        horasEstimadas: Number(payload.horasEstimadas),
        fechaObjetivo: payload.fechaObjetivo,
      }),
    });
  },

  updateSubtask(id, payload) {
    return request(`/api/subtareas/${encodeURIComponent(id)}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({
        estado: payload.estado,
        notaExplicativa: payload.notaExplicativa ?? null,
      }),
    });
  },

  deleteSubtask(id) {
    return request(`/api/subtareas/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
