import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { HoyView } from './HoyView';
import { NotificationsProvider } from '../providers/NotificationsProvider';
import { SearchProvider } from '../providers/SearchProvider';
import { saveSession } from '../services/tokenStorage';
import { getToday } from '../utils/dateValidation';

/**
 * Registro de una gestión como ejecutada o pospuesta desde el panel de hoy
 * (US-09).
 *
 * Estas pruebas son de render y no de lógica pura porque lo que se verifica aquí
 * es justamente el cableado: que el botón abra el modal, que el PATCH salga con
 * el nombre del DTO y que la lista cambie sin recargar. `taskExecution.test.js`
 * cubre las reglas de estado y ninguna de ellas detecta un cableado roto.
 *
 * Dos cosas se comprueban a propósito porque fallarían en silencio: que la nota
 * viaje como `notaExplicativa` (el backend la descartaría en snake_case sin
 * avisar) y que la carga horaria baje al completar.
 */

const EVENTO = {
  idEvento: 9,
  idTipoEvento: 1,
  nombre: 'Boda de Prueba',
  cliente: 'Cliente',
  fechaEvento: '2030-05-10T18:00:00',
  lugar: 'Bogotá',
};

// La gestión va con la fecha de HOY a propósito: el panel solo muestra lo que
// cae en Vencidas, Para hoy o Próximas, y Próximas llega 30 días. Con una fecha
// fija en 2030 la gestión se quedaría fuera de los tres grupos y no habría nada
// que registrar.
const HOY = getToday();

const SUBTAREA = {
  idSubtarea: 3,
  idEvento: 9,
  nombreGestion: 'Confirmar proveedor',
  fechaObjetivo: HOY,
  horasEstimadas: 2,
  estado: 'pendiente',
};

const respuestaJson = (cuerpo, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: () => Promise.resolve(JSON.stringify(cuerpo)),
});

/**
 * @param {{ parche?: object, capacidad?: object }} opciones
 */
const stubApi = ({
  parche = respuestaJson({ ...SUBTAREA, estado: 'ejecutada' }),
  capacidad = respuestaJson({ limiteHorasDiarias: 8 }),
} = {}) => {
  const fetchMock = vi.fn(async (url, options = {}) => {
    const ruta = String(url);

    if (/\/api\/users\/capacity/.test(ruta)) {
      return capacidad;
    }
    if (/\/api\/eventos\/9\/subtareas/.test(ruta)) {
      return respuestaJson([SUBTAREA]);
    }
    if (/\/api\/eventos\/9$/.test(ruta)) {
      return respuestaJson(EVENTO);
    }
    if (/\/api\/eventos/.test(ruta)) {
      return respuestaJson([EVENTO]);
    }
    if (/\/api\/subtareas\/3\/estado/.test(ruta)) {
      return parche;
    }

    return respuestaJson([]);
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('panel de hoy: registrar una gestión', () => {
  let container;
  let root;

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
    // El aviso de la regla se muestra solo la primera vez; aquí estorba.
    window.localStorage.setItem('eventflow.reglaHoy', '1');
    saveSession({ token: 'abc', nombre: 'Santiago Perez' });

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const renderHoy = async () => {
    await act(async () => {
      root.render(
        <NotificationsProvider>
          <SearchProvider>
            <MemoryRouter initialEntries={['/hoy']}>
              <HoyView />
            </MemoryRouter>
          </SearchProvider>
        </NotificationsProvider>
      );
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Confirmar proveedor');
    });
  };

  const botonPorTexto = (texto) =>
    [...container.querySelectorAll('button')].find(
      (b) => (b.textContent ?? '').trim() === texto
    );

  const pulsar = async (elemento) => {
    expect(elemento).toBeTruthy();
    await act(async () => {
      elemento.click();
    });
  };

  it('ofrece las acciones rápidas de hecha y posponer en cada tarjeta', async () => {
    stubApi();
    await renderHoy();

    expect(botonPorTexto('Hecha')).toBeTruthy();
    expect(botonPorTexto('Posponer')).toBeTruthy();
  });

  it('abre el modal y envía el PATCH con la nota en el nombre del DTO', async () => {
    const fetchMock = stubApi();
    await renderHoy();

    await pulsar(botonPorTexto('Hecha'));

    await vi.waitFor(() => {
      expect(container.querySelector('[role="dialog"]')).toBeTruthy();
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toBeTruthy();

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      ).set;
      setter.call(textarea, 'Proveedor confirmó');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await pulsar(botonPorTexto('Marcar como completada'));

    await vi.waitFor(() => {
      const llamada = fetchMock.mock.calls.find(
        ([url, options]) =>
          /\/api\/subtareas\/3\/estado/.test(String(url)) &&
          options?.method === 'PATCH'
      );
      expect(llamada).toBeTruthy();

      // El nombre importa: el DTO del backend es `notaExplicativa`. En
      // snake_case el servidor la ignoraría sin devolver ningún error.
      expect(JSON.parse(llamada[1].body)).toEqual({
        estado: 'ejecutada',
        notaExplicativa: 'Proveedor confirmó',
      });
    });
  });

  it('actualiza la lista sin recargar ni volver a pedir los datos', async () => {
    const fetchMock = stubApi();
    await renderHoy();

    expect(container.textContent).toContain('Confirmar proveedor');
    expect(container.textContent).toContain('Tareas0 / 1');

    await pulsar(botonPorTexto('Hecha'));
    await pulsar(botonPorTexto('Marcar como completada'));

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Tareas1 / 1');
    });

    // La gestión completada sale de las tres secciones: ya no es una gestión
    // abierta, así que dejarla en "Para hoy" sería mentir sobre el día.
    expect(container.textContent).not.toContain('Confirmar proveedor');

    // "Sin F5" significa esto: la lista se actualizó con lo que ya estaba en
    // memoria y no se volvió a pedir al servidor.
    const lecturasDeLista = fetchMock.mock.calls.filter(
      ([url, options]) =>
        /\/api\/eventos\/9\/subtareas/.test(String(url)) && !options?.method
    );
    expect(lecturasDeLista).toHaveLength(1);
  });

  it('exige un motivo al posponer y no envía nada si falta', async () => {
    const fetchMock = stubApi();
    await renderHoy();

    await pulsar(botonPorTexto('Posponer'));
    await vi.waitFor(() => {
      expect(container.querySelector('textarea')).toBeTruthy();
    });

    await pulsar(botonPorTexto('Poner en pospuesta'));

    await vi.waitFor(() => {
      expect(container.textContent).toContain('por qué se pospone');
    });

    const envioEstado = fetchMock.mock.calls.find(
      ([url, options]) =>
        /\/api\/subtareas\/3\/estado/.test(String(url)) &&
        options?.method === 'PATCH'
    );
    expect(envioEstado).toBeUndefined();
  });

  it('libera las horas del día al completar una gestión', async () => {
    // Antes de completar, la carga del día incluye las 2 h de la gestión.
    stubApi({ capacidad: respuestaJson({ limiteHorasDiarias: 1 }) });
    await renderHoy();

    await vi.waitFor(() => {
      expect(container.textContent).toContain('2 h comprometidas');
    });
    // Con el límite en 1 y 2 h comprometidas, el aviso está presente.
    expect(container.textContent).toContain('tu límite es de 1 h');

    await pulsar(botonPorTexto('Hecha'));
    await pulsar(botonPorTexto('Marcar como completada'));

    await vi.waitFor(() => {
      expect(container.textContent).not.toContain('tu límite es de 1 h');
    });
    // Las 2 h pasaron a completadas y el día quedó en cero comprometidas. El
    // texto "0 h comprometidas" no aparece porque vive dentro del aviso, que ya
    // no está: por eso se comprueba el resumen.
    expect(container.textContent).toContain('Horas completadas2 h');
    expect(container.textContent).toContain('Horas restantes0 h');
  });

  it('avisa cuando el día supera el límite diario', async () => {
    stubApi({ capacidad: respuestaJson({ limiteHorasDiarias: 1 }) });
    await renderHoy();

    await vi.waitFor(() => {
      expect(container.textContent).toContain('tu límite es de 1 h');
    });
    expect(container.textContent).toContain('faltan 1 h por liberar');
  });
});
