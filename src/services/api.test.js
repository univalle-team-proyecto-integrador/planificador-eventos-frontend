import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, getDefaultUserId, toApiDateTime, unwrapData } from './api';

const BASE = 'https://planificador-eventos-backend-1.onrender.com';

const jsonResponse = (status, body) => {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(raw),
  };
};

describe('helpers', () => {
  it('toApiDateTime convierte una fecha de alta en LocalDateTime', () => {
    expect(toApiDateTime('2026-12-01')).toBe('2026-12-01T00:00:00');
    expect(toApiDateTime('2026-12-01T15:00:00')).toBe('2026-12-01T15:00:00');
    expect(toApiDateTime('')).toBe('');
    expect(toApiDateTime(null)).toBe('');
    expect(toApiDateTime(undefined)).toBe('');
  });

  it('unwrapData extrae el payload real cuando viene envuelto', () => {
    expect(unwrapData({ data: { id: 1 } })).toEqual({ id: 1 });
    expect(unwrapData({ id: 1 })).toEqual({ id: 1 });
    expect(unwrapData(null)).toBeNull();
  });

  it('getDefaultUserId cae al organizador por defecto cuando no está configurado', () => {
    expect(getDefaultUserId()).toBe(1);
  });

  it('ApiError expone estado y detalle del fallo', () => {
    const error = new ApiError('No encontrado', 404, { title: 'Recurso no encontrado' });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(404);
    expect(error.details.title).toBe('Recurso no encontrado');
  });
});

describe('request', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('listEvents hace GET a /api/eventos y parsea el JSON', async () => {
    const eventos = [{ idEvento: 1, nombre: 'Boda' }];
    fetch.mockResolvedValue(jsonResponse(200, eventos));

    const resultado = await api.listEvents(null);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe(`${BASE}/api/eventos`);
    expect(options.method || 'GET').toBe('GET');
    expect(resultado).toEqual(eventos);
  });

  it('listEvents agrega el filtro de usuario a la consulta', async () => {
    fetch.mockResolvedValue(jsonResponse(200, []));

    await api.listEvents(7);

    const [url] = fetch.mock.calls[0];
    expect(url).toBe(`${BASE}/api/eventos?usuarioId=7`);
  });

  it('createEvent publica POST con Content-Type JSON y cuerpo serializado', async () => {
    const payload = { nombre: 'Boda', cliente: 'María' };
    fetch.mockResolvedValue(jsonResponse(201, { ...payload, idEvento: 9 }));

    const resultado = await api.createEvent(payload);

    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe(`${BASE}/api/eventos`);
    expect(options.method).toBe('POST');
    expect(options.headers.get('Content-Type')).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual(payload);
    expect(resultado.idEvento).toBe(9);
  });

  it('responde null en respuestas sin cuerpo (204)', async () => {
    fetch.mockResolvedValue(jsonResponse(204, ''));

    await expect(api.deleteSubtask(3)).resolves.toBeNull();
    expect(fetch.mock.calls[0][0]).toBe(`${BASE}/api/subtareas/3`);
    expect(fetch.mock.calls[0][1].method).toBe('DELETE');
  });

  it('mapea errores ProblemDetail a ApiError con mensaje del detalle', async () => {
    fetch.mockResolvedValue(
      jsonResponse(400, { title: 'Datos inválidos', detail: 'El nombre es obligatorio', errors: { nombre: 'No vacío' } })
    );

    const error = await api.createSubtask(4, {
      nombreGestion: 'Tarea',
      horasEstimadas: 2,
      fechaObjetivo: '2026-11-10',
    }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe('El nombre es obligatorio');
    expect(error.details.errors.nombre).toBe('No vacío');
  });

  it('usa un mensaje de respaldo cuando no hay detalle en la respuesta', async () => {
    fetch.mockResolvedValue(jsonResponse(500, {}));

    const error = await api.listEvents(null).catch((e) => e);

    expect(error.status).toBe(500);
    expect(error.message).toBe('La operación falló con el estado 500.');
  });

  it('acompaña el texto crudo cuando la respuesta no es JSON', async () => {
    fetch.mockResolvedValue(jsonResponse(500, 'boom'));

    const error = await api.listEvents(null).catch((e) => e);

    expect(error.status).toBe(500);
    expect(error.message).toBe('boom');
  });

  it('reintenta una sola vez en GET cuando la conexión cae (cold start)', async () => {
    fetch
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse(200, []));

    await expect(api.listEvents(null)).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('reporta error de conexión si GET falla dos veces', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await api.listEvents(null).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe(
      'No pudimos conectar con el servidor. Revisa tu red e inténtalo de nuevo.'
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('no reintenta en POST y avisa del error de conexión', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await api.createEvent({ nombre: 'Sin red' }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('traduce el tiempo de espera agotado en GET a un mensaje propio', async () => {
    const abort = new DOMException('The operation was aborted.', 'AbortError');
    fetch.mockRejectedValue(abort);

    const error = await api.listEvents(null).catch((e) => e);

    expect(error.message).toBe(
      'El servidor tardó demasiado en responder. Inténtalo de nuevo.'
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});