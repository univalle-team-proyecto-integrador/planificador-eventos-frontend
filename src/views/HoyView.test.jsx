import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { HoyView } from './HoyView';
import { NotificationsProvider } from '../providers/NotificationsProvider';
import { SearchProvider } from '../providers/SearchProvider';
import { saveSession } from '../services/tokenStorage';
import { getToday } from '../utils/dateValidation';
import { addDays } from '../utils/taskMetrics';

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

// Una segunda gestión con fecha pasada: es la que cae en "Gestiones vencidas" y
// la única que lleva el aviso de demora. Va a un día antes porque la sección
// clasifica por `fechaObjetivo < hoy`.
const SUBTAREA_VENCIDA = {
  idSubtarea: 4,
  idEvento: 9,
  nombreGestion: 'Cerrar el venue',
  fechaObjetivo: addDays(HOY, -2),
  horasEstimadas: 1,
  estado: 'pendiente',
};

const respuestaJson = (cuerpo, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: () => Promise.resolve(JSON.stringify(cuerpo)),
});

/**
 * @param {{ parche?: object, capacidad?: object, conVencida?: boolean }} opciones
 */
const stubApi = ({
  parche = respuestaJson({ ...SUBTAREA, estado: 'ejecutada' }),
  capacidad = respuestaJson({ limiteHorasDiarias: 8 }),
  conVencida = false,
} = {}) => {
  const fetchMock = vi.fn(async (url, options = {}) => {
    const ruta = String(url);

    if (/\/api\/users\/capacity/.test(ruta)) {
      return capacidad;
    }
    if (/\/api\/eventos\/9\/subtareas/.test(ruta)) {
      return respuestaJson(
        conVencida ? [SUBTAREA, SUBTAREA_VENCIDA] : [SUBTAREA]
      );
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

// Una gestión POSPUESTA con la última fecha ya pasada. Conserva el aviso rojo
// (la fecha pasó) pero no se mezcla con Vencidas: se revisa en "Pospuestas".
const POSPUESTA_VENCIDA = {
  ...SUBTAREA_VENCIDA,
  estado: 'pospuesta',
  notaExplicativa: 'Proveedor sin disponibilidad',
};

const stubApiPospuestaVencida = () => {
  const fetchMock = vi.fn(async (url) => {
    const ruta = String(url);

    if (/\/api\/users\/capacity/.test(ruta)) {
      return respuestaJson({ limiteHorasDiarias: 8 });
    }
    if (/\/api\/eventos\/9\/subtareas/.test(ruta)) {
      return respuestaJson([POSPUESTA_VENCIDA]);
    }
    if (/\/api\/eventos\/9$/.test(ruta)) {
      return respuestaJson(EVENTO);
    }
    if (/\/api\/eventos/.test(ruta)) {
      return respuestaJson([EVENTO]);
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

  // `espera` es el texto que cada prueba quiere ver montado: el panel agrupa
  // por fecha y estado, asi que un stub con una sola gestion pospuesta nunca
  // pinta la de hoy.
  const renderHoy = async (espera = 'Confirmar proveedor') => {
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
      expect(container.textContent).toContain(espera);
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

  it('invita solo a completar, porque posponer ya no baja la carga', async () => {
    stubApi({ capacidad: respuestaJson({ limiteHorasDiarias: 1 }) });
    await renderHoy();

    await vi.waitFor(() => {
      expect(container.textContent).toContain('tu límite es de 1 h');
    });
    // Con la regla nueva, posponer saca la gestión de la cuenta por sí solo, así
    // que ofrecerlo aquí prometería una bajada que el número no muestra.
    expect(container.textContent).toContain('como hecha para bajarla');
    expect(container.textContent).not.toContain('pospuesta para bajarla');
  });

  it('marca como vencida solo la gestión con fecha pasada', async () => {
    stubApi({ conVencida: true });
    await renderHoy();

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Cerrar el venue');
    });

    const liVencida = [...container.querySelectorAll('li')].find((li) =>
      (li.textContent ?? '').includes('Cerrar el venue')
    );
    const liDeHoy = [...container.querySelectorAll('li')].find((li) =>
      (li.textContent ?? '').includes('Confirmar proveedor')
    );

    // La clase es lo único que se puede comprobar aquí: el anillo lo pinta el CSS
    // a partir de `--ring-alerta` y vitest no renderiza estilos.
    expect(liVencida.className).toContain('event-card--vencida');
    expect(liDeHoy.className).not.toContain('event-card--vencida');

    // El aviso es rojo: anillo + fondo. Sin borde ámbar, porque el anillo queda
    // 3px fuera del borde y un ámbar de 1px pegado se vería como dos contornos.
    expect(liVencida.className).not.toContain('border-warning');
    expect(liVencida.className).toContain('bg-alerta-fondo/30');

    // Y el aviso en texto sigue estando, para quien no distingue el color: el
    // anillo no puede ser la única señal de que algo está atrasado (WCAG 1.4.1).
    expect(liVencida.textContent).toContain('Atrasada');
    expect(liVencida.textContent).toContain('Vencida');
  });

  it('ofrece reprogramar en una vencida corriente', async () => {
    // Reprogramar mueve la fecha objetivo sin cambiar el estado, así que es la
    // vía para devolver al plan una vencida que no se va a hacer hoy. No es lo
    // mismo que posponer, que saca la gestión del plan sin día.
    stubApi({ conVencida: true });
    await renderHoy();

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Cerrar el venue');
    });

    const liVencida = [...container.querySelectorAll('li')].find((li) =>
      (li.textContent ?? '').includes('Cerrar el venue')
    );

    expect(liVencida.textContent).toContain('Reprogramar');
  });

  it('no fija el halo del evento en la tarjeta vencida', async () => {
    // Si el estilo inline trajera `--accent-glow`, ganaría a la clase y el hover
    // volvería a brillar con el color del evento en vez de en rojo.
    stubApi({ conVencida: true });
    await renderHoy();

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Cerrar el venue');
    });

    const liVencida = [...container.querySelectorAll('li')].find((li) =>
      (li.textContent ?? '').includes('Cerrar el venue')
    );
    const liDeHoy = [...container.querySelectorAll('li')].find((li) =>
      (li.textContent ?? '').includes('Confirmar proveedor')
    );

    expect(liVencida.style.getPropertyValue('--accent-glow')).toBe('');
    expect(liDeHoy.style.getPropertyValue('--accent-glow')).not.toBe('');
  });

  it('deja la pospuesta vencida en su grupo y fuera de Vencidas', async () => {
    // La fecha sigue siendo de ayer, así que la tarjeta se avisa en rojo. Pero
    // el grupo lo decide el estado, no la fecha: lo que alguien pospuso a
    // propósito se revisa en "Pospuestas" y no mezclado con lo que se olvidó.
    stubApiPospuestaVencida();
    await renderHoy('Cerrar el venue');

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Cerrar el venue');
    });

    const liPospuesta = [...container.querySelectorAll('li')].find((li) =>
      (li.textContent ?? '').includes('Cerrar el venue')
    );

    expect(liPospuesta.className).toContain('event-card--vencida');
    expect(liPospuesta.className).toContain('bg-alerta-fondo/30');

    // Sin el badge "Atrasada": ese es de Gestiones vencidas, y aquí la gestión
    // ya está marcada como pospuesta. El rojo y el texto de la fecha bastan.
    expect(liPospuesta.textContent).not.toContain('Atrasada');

    // Vive en su propio grupo, conservando la fecha de la que salió, y no se
    // cuela en Vencidas por muy antigua que sea esa fecha.
    expect(container.textContent).toContain('Pospuestas');
    expect(liPospuesta.textContent).toContain('Última fecha:');
    expect(container.textContent).not.toContain('Gestiones vencidas');

    // Y sigue siendo recuperable: ofrece la acción que la devuelve al plan.
    expect(liPospuesta.textContent).toContain('Reprogramar');
  });
});

/**
 * Reprogramar una gestión pospuesta desde el grupo "Pospuestas" (US-09/US-06).
 *
 * Va en su propio bloque porque necesita otro estado inicial: la gestión llega
 * pospuesta, no pendiente. El stub responde con lo que el backend devolvería
 * realmente, que es la gestión ya en `pendiente` con la fecha nueva.
 */
describe('panel de hoy: reprogramar una gestión pospuesta', () => {
  let container;
  let root;

  const POSPUESTA = {
    ...SUBTAREA,
    estado: 'pospuesta',
    notaExplicativa: 'Proveedor sin disponibilidad',
  };

  const REPROGRAMADA = {
    ...SUBTAREA,
    estado: 'pendiente',
    fechaObjetivo: '2030-05-20',
    notaExplicativa: 'Proveedor sin disponibilidad',
  };

  const stubApiPospuesta = () => {
    const fetchMock = vi.fn(async (url) => {
      const ruta = String(url);

      if (/\/api\/users\/capacity/.test(ruta)) {
        return respuestaJson({ limiteHorasDiarias: 8 });
      }
      if (/\/api\/eventos\/9\/subtareas/.test(ruta)) {
        return respuestaJson([POSPUESTA]);
      }
      if (/\/api\/eventos\/9$/.test(ruta)) {
        return respuestaJson(EVENTO);
      }
      if (/\/api\/eventos/.test(ruta)) {
        return respuestaJson([EVENTO]);
      }
      if (/\/api\/subtareas\/3\/reprogramar/.test(ruta)) {
        return respuestaJson(REPROGRAMADA);
      }

      return respuestaJson([]);
    });

    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  };

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
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

  // Compara por.includes y no por igualdad: los botones llevan un icono de Lucide
  // delante, así que su textContent trae espacios que un === no limpiaba.
  const botonPorTexto = (texto) =>
    [...container.querySelectorAll('button')].find((b) =>
      (b.textContent ?? '').includes(texto)
    );

  const pulsar = async (elemento) => {
    expect(elemento).toBeTruthy();
    await act(async () => {
      elemento.click();
    });
  };

  it('la muestra en su propio grupo y fuera de la planificación', async () => {
    stubApiPospuesta();
    await renderHoy();

    expect(container.textContent).toContain('Pospuestas');
    expect(container.textContent).toContain('Sin día asignado');
    // No aparece en los grupos de planificación, que es lo que significa no
    // tener día asignado.
    expect(container.textContent).not.toContain('Para hoyGestiones con fecha');
    // Conserva la última fecha que tenía, para que se vea de dónde salió, y
    // ofrece la acción que la devuelve al plan.
    expect(container.textContent).toContain('Última fecha:');
    expect(botonPorTexto('Reprogramar')).toBeTruthy();
  });

  it('no compromete la carga del día', async () => {
    stubApiPospuesta();
    await renderHoy();

    // Las 2 h de la gestión pospuesta no entran en la carga: sin día asignado no
    // hay nada que contar.
    await vi.waitFor(() => {
      expect(container.textContent).toContain('Carga de hoy0 de 2 horas (0%)');
    });
  });

  // El desplegable es un <details> nativo: cerrado por defecto, con el contador
  // a la vista para que se sepa que hay algo dentro sin abrirlo.
  it('deja el grupo de pospuestas plegado, con su contador a la vista', async () => {
    stubApiPospuesta();
    await renderHoy();

    const details = container.querySelector('details');

    expect(details).toBeTruthy();
    expect(details.hasAttribute('open')).toBe(false);

    // El contador va en el summary, no en el cuerpo: es lo que se lee sin abrir.
    const summary = details.querySelector('summary');
    expect(summary.textContent).toContain('Pospuestas');
    expect(summary.textContent).toContain('1 gestión');

    // El cuerpo está ahí pero plegado, y el texto largo queda fuera del summary
    // para que su nombre accesible no arrastre la descripción.
    expect(summary.textContent).not.toContain('Sin día asignado');
    expect(details.textContent).toContain('Confirmar proveedor');
  });

  it('abre el grupo de pospuestas al pulsar su título', async () => {
    stubApiPospuesta();
    await renderHoy();

    const details = container.querySelector('details');
    expect(details.hasAttribute('open')).toBe(false);

    await pulsar(details.querySelector('summary'));

    expect(details.hasAttribute('open')).toBe(true);
  });

  it('no pliega los grupos de planificación', async () => {
    // Solo el de pospuestas es desplegable: lo que hay que hacer hoy o esta
    // semana no puede quedar escondido detrás de un clic. Este stub solo
    // devuelve la gestión pospuesta, así que el único grupo que se pinta es ese.
    stubApiPospuesta();
    await renderHoy();

    expect(container.querySelectorAll('details')).toHaveLength(1);
    // Su encabezado vive dentro del <details>, no en una sección hermana: no es
    // uno de los grupos de planificación, es el plegable de las pospuestas.
    expect(
      container.querySelector('section[aria-labelledby="deferred-tasks-title"]')
    ).toBeNull();
    expect(
      container.querySelector('details #deferred-tasks-title')
    ).toBeTruthy();
  });

  it('reprogramarla la devuelve al plan sin recargar', async () => {
    const fetchMock = stubApiPospuesta();
    await renderHoy();

    await pulsar(botonPorTexto('Reprogramar'));

    await vi.waitFor(() => {
      expect(container.querySelector('[role="dialog"]')).toBeTruthy();
    });

    const campoFecha = container.querySelector('input[type="date"]');
    expect(campoFecha).toBeTruthy();

    // React ignora el evento 'input' directo sobre un input controlado: hay que
    // pasar por el setter del prototipo para que su propio tracker de valor vea
    // el cambio.
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      ).set;
      setter.call(campoFecha, '2030-05-20');
      campoFecha.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Se toma el submit del formulario y no un botón por texto: el de la tarjeta
    // se llama "Reprogramar" también y se colaría en el match.
    await pulsar(
      container.querySelector('[role="dialog"] button[type="submit"]')
    );

    await vi.waitFor(() => {
      const llamada = fetchMock.mock.calls.find(
        ([url, options]) =>
          /\/api\/subtareas\/3\/reprogramar/.test(String(url)) &&
          options?.method === 'PATCH'
      );
      expect(llamada).toBeTruthy();
      expect(JSON.parse(llamada[1].body).nuevaFecha).toBe('2030-05-20');
    });

    // Sale de "Pospuestas" y entra en la planificación por su fecha nueva. La
    // fecha viene en 2030, fuera del rango de próximas, así que no se espera ver
    // un grupo concreto: lo que se comprueba es que ya no está pospuesta.
    await vi.waitFor(() => {
      expect(botonPorTexto('Reprogramar')).toBeFalsy();
    });

    // Y todo sin volver a pedir la lista.
    const lecturasDeLista = fetchMock.mock.calls.filter(
      ([url, options]) =>
        /\/api\/eventos\/9\/subtareas/.test(String(url)) && !options?.method
    );
    expect(lecturasDeLista).toHaveLength(1);
  });
});
