import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRoutes } from '../../routes/AppRoutes';
import { ThemeProvider } from '../../providers/ThemeProvider';
import { SearchProvider } from '../../providers/SearchProvider';
import { SessionProvider } from '../../providers/SessionProvider';
import { NotificationsProvider } from '../../providers/NotificationsProvider';
import { saveSession } from '../../services/tokenStorage';

/**
 * Smoke del shell (barra superior + barra lateral + perfil + tema).
 *
 * Estas vistas no tienen lógica pura que extraer a `utils/`, pero si se rompe el
 * cableado de providers o la composición del shell la aplicación se queda en
 * blanco sin que ningún test de lógica lo note. Por eso se renderiza el árbol
 * real y se comprueban los acuerdos visibles: rutas, elemento activo, nombre de
 * usuario y persistencia del tema.
 */

const emptyResponse = () => ({
  ok: true,
  status: 200,
  text: () => Promise.resolve('[]'),
});

const stubApi = () => {
  const fetchMock = vi.fn(async () => emptyResponse());
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

/**
 * Abre el menú de perfil y devuelve su `<div role="menu">`.
 *
 * El interruptor de tema vive dentro de este menú, así que cualquier prueba
 * que lo necesite tiene que abrirlo primero: si no, `[role="switch"]` da `null`
 * y el fallo parece de tema cuando en realidad es de orden de renderizado.
 */
const abrirMenuPerfil = async (container) => {
  const trigger = container.querySelector('[aria-haspopup="menu"]');

  await act(async () => {
    trigger.click();
  });

  return container.querySelector('[role="menu"]');
};

/**
 * Devuelve un evento con fecha futura en el listado. Con un evento en el futuro
 * la lista de "hoy" queda vacía, que es la rama donde aparece el botón de abrir
 * el calendario.
 */
const stubApiWithFutureEvent = () => {
  const evento = {
    id: 9,
    nombre: 'Boda de Prueba',
    cliente: 'Cliente',
    fechaEvento: '2030-05-10T18:00:00',
    lugar: 'Bogotá',
    idTipoEvento: 1,
  };

  const fetchMock = vi.fn(async (url) => {
    const esListado = /\/api\/eventos(\?|$)/.test(String(url));

    return {
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(esListado ? [evento] : [])),
    };
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('shell de la aplicación', () => {
  let container;
  let root;

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');

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

  const renderAt = async (path) => {
    // `AppRoutes` monta su propio `BrowserRouter`, así que la ruta se fija en
    // la URL real en lugar de envolver con un `MemoryRouter`.
    window.history.pushState({}, '', path);

    await act(async () => {
      root.render(
        <NotificationsProvider>
          <ThemeProvider>
            <SessionProvider>
              <SearchProvider>
                <AppRoutes />
              </SearchProvider>
            </SessionProvider>
          </ThemeProvider>
        </NotificationsProvider>
      );
    });

    // Las pantallas se cargan con `React.lazy`. `waitFor` deja que resuelvan las
    // importaciones dinámicas sin depender de un tiempo fijo.
    await vi.waitFor(() => {
      expect(container.textContent).not.toBe('Cargando contenido');
    });
  };

  const activeLink = () =>
    container.querySelector('aside a[aria-current="page"]');

  it('muestra topbar, buscador y barra lateral en /hoy', async () => {
    stubApi();
    saveSession({ token: 'abc', nombre: 'Santiago Perez' });

    await renderAt('/hoy');

    expect(container.textContent).toContain('Crear evento');
    expect(container.querySelector('input[role="combobox"]').placeholder).toBe(
      'Buscar tareas...'
    );
    expect(container.textContent).toContain('Santiago Perez');

    const labels = [...container.querySelectorAll('aside a')].map((link) =>
      link.textContent.trim()
    );
    expect(labels).toEqual(['Hoy', 'Eventos / Progreso', 'Configuración']);
  });

  it('deja la sesión fuera de la barra lateral', async () => {
    stubApi();
    saveSession({ token: 'abc', nombre: 'Santiago Perez' });

    await renderAt('/hoy');

    expect(container.querySelector('aside').textContent).not.toContain(
      'Cerrar sesión'
    );
  });

  it('marca "Hoy" como sección activa con el morado de primary', async () => {
    stubApi();
    saveSession({ token: 'abc', nombre: 'Santiago Perez' });

    await renderAt('/hoy');

    const active = activeLink();
    expect(active.textContent.trim()).toBe('Hoy');
    expect(active.className).toContain('bg-primary');
  });

  it('mantiene "Eventos / Progreso" activa dentro del detalle de un evento', async () => {
    stubApi();
    saveSession({ token: 'abc', nombre: 'Santiago Perez' });

    await renderAt('/evento/7');

    // El detalle de un evento es un evento: el ítem que lo cubre debe seguir
    // marcado como la sección actual. Por eso la lateral usa `Link` y no
    // `NavLink`, que se apropia de `aria-current` según su propio `to`.
    const active = activeLink();
    expect(active.textContent.trim()).toBe('Eventos / Progreso');
  });

  it('abre /configuracion con el aviso de que está en camino', async () => {
    stubApi();
    saveSession({ token: 'abc', nombre: 'Santiago Perez' });

    await renderAt('/configuracion');

    expect(container.textContent).toContain('Próximamente');
  });

  it('el interruptor de tema vive en el menú de perfil y persiste el cambio', async () => {
    stubApi();
    saveSession({ token: 'abc', nombre: 'Santiago Perez' });

    await renderAt('/hoy');

    // Cerrado no existe todavía: el interruptor no anda suelto en la barra superior.
    expect(container.querySelector('[role="switch"]')).toBeNull();

    const menu = await abrirMenuPerfil(container);

    const toggle = menu.querySelector('[role="switch"]');
    expect(toggle).not.toBeNull();
    expect(toggle.getAttribute('aria-checked')).toBe('false');

    await act(async () => {
      toggle.click();
    });

    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('eventflow.tema')).toBe('dark');
  });

  it('el menú de perfil abre con el nombre real y la acción de salir', async () => {
    stubApi();
    saveSession({ token: 'abc', nombre: 'Santiago Perez' });

    await renderAt('/hoy');

    const trigger = container.querySelector('[aria-haspopup="menu"]');
    expect(trigger.textContent).toContain('Santiago Perez');

    const menu = await abrirMenuPerfil(container);

    expect(menu).not.toBeNull();
    expect(menu.textContent).toContain('Cerrar sesión');
    expect(menu.querySelector('[role="menuitem"]')).not.toBeNull();
  });

  // El calendario de gestiones viene del PR #4 y se fusionó con este shell, así
  // que este caso vigila que la combinación siga montando y cerrando.
  it('el calendario de /hoy abre como diálogo y cierra con Escape', async () => {
    stubApiWithFutureEvent();
    saveSession({ token: 'abc', nombre: 'Santiago Perez' });

    await renderAt('/hoy');

    const trigger = [...container.querySelectorAll('button')].find((button) =>
      button.textContent.includes('Ver calendario')
    );
    expect(trigger).toBeTruthy();

    await act(async () => {
      trigger.click();
    });

    const dialog = container.querySelector(
      '[role="dialog"][aria-modal="true"]'
    );
    expect(dialog).not.toBeNull();

    await act(async () => {
      dialog.dispatchEvent(
        new window.KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        })
      );
    });

    expect(
      container.querySelector('[role="dialog"][aria-modal="true"]')
    ).toBeNull();
  });
});
