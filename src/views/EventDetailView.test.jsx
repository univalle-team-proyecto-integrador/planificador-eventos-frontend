import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EventDetailView } from './EventDetailView';
import { NotificationsProvider } from '../providers/NotificationsProvider';
import { SearchProvider } from '../providers/SearchProvider';
import { saveSession } from '../services/tokenStorage';

/**
 * Cableado del guardado de una gestión editada (US-08).
 *
 * Estas pruebas existen por un bug real: `currentSubtask` estaba declarado con
 * `const` dentro del `try` y el `catch` lo usaba para abrir el ConflictoModal.
 * Un 409 salteaba la declaración, el `catch` lanzaba `ReferenceError` y el
 * conflicto se perdía en silencio: editar no disparaba ni el aviso ni el error.
 * Los tests de lógica pura y del mock no lo detectaron porque ninguno ejercita
 * el `catch` de la vista.
 */

const EVENTO = {
  idEvento: 9,
  idUsuario: 1,
  idTipoEvento: 1,
  nombre: 'Boda de Prueba',
  cliente: 'Cliente',
  fechaEvento: '2030-05-10T18:00:00',
  horasEstimadas: 8,
  lugar: 'Bogotá',
};

const SUBTAREA = {
  idSubtarea: 3,
  idEvento: 9,
  nombreGestion: 'Confirmar proveedor',
  fechaObjetivo: '2030-05-12',
  horasEstimadas: 2,
  estado: 'pendiente',
};

// Cuerpo real del 409: ProblemDetail con las propiedades aplanadas en la raíz.
const CONFLICTO = {
  type: 'about:blank',
  title: 'Límite diario excedido',
  status: 409,
  detail: 'La reprogramación supera el límite diario de 6 horas',
  limiteDiario: 6,
  horasAsignadasPreviamente: 5,
  horasSolicitadas: 4,
  horasPlanificadasTotales: 9,
  excedente: 3,
  fecha: '2030-05-12',
  idSubtarea: 3,
};

const respuestaJson = (cuerpo, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: () => Promise.resolve(JSON.stringify(cuerpo)),
});

/**
 * @param {{ put?: object }} opciones respuesta del PUT /api/subtareas/{id}
 */
const stubApi = ({ put = respuestaJson(SUBTAREA) } = {}) => {
  const fetchMock = vi.fn(async (url, options = {}) => {
    const ruta = String(url);

    if (/\/api\/eventos\/9\/subtareas$/.test(ruta)) {
      return respuestaJson([SUBTAREA]);
    }
    if (/\/api\/eventos\/9$/.test(ruta)) {
      return respuestaJson({ ...EVENTO, subtareas: [SUBTAREA] });
    }
    if (/\/api\/tipos-evento/.test(ruta)) {
      return respuestaJson([{ idTipoEvento: 1, nombre: 'Boda' }]);
    }
    if (/\/api\/subtareas\/3$/.test(ruta) && options.method === 'PUT') {
      return put;
    }

    return respuestaJson([]);
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('guardado de una gestión editada', () => {
  let container;
  let root;

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
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

  const renderDetalle = async () => {
    await act(async () => {
      root.render(
        <NotificationsProvider>
          <SearchProvider>
            <MemoryRouter initialEntries={['/evento/9']}>
              {/* La vista lee el id de la ruta, así que hace falta declararla:
                  sin el Route, useParams() devuelve {} y no hay evento. */}
              <Routes>
                <Route path="/evento/:id" element={<EventDetailView />} />
              </Routes>
            </MemoryRouter>
          </SearchProvider>
        </NotificationsProvider>
      );
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Confirmar proveedor');
    });
  };

  /**
   * Abre el formulario de edición.
   *
   * Se busca por el `aria-label` y no por el texto: la tarjeta del evento tiene
   * un "Editar evento" que también matchea /editar/i, y pulsarlo abriría otro
   * formulario distinto al de la subtarea.
   */
  const pulsarEditar = async () => {
    const boton = [...container.querySelectorAll('button')].find((b) =>
      /^Editar Confirmar proveedor$/.test(b.getAttribute('aria-label') ?? '')
    );
    expect(boton).toBeTruthy();

    await act(async () => {
      boton.click();
    });

    await vi.waitFor(() => {
      expect(container.querySelector('#edit-subtask-title')).toBeTruthy();
    });
  };

  /**
   * Envía el formulario de edición.
   *
   * Se localiza por el input `edit-subtask-title`: la vista tiene dos formularios
   * con un `input[name="title"]` (el de alta y el de edición) y buscar solo por
   * el nombre agarra el equivocado.
   */
  const guardar = async () => {
    const form = container.querySelector('#edit-subtask-title')?.closest('form');
    expect(form).toBeTruthy();

    await act(async () => {
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
    });
  };

  it('abre el ConflictoModal cuando el PUT responde 409', async () => {
    stubApi({ put: respuestaJson(CONFLICTO, 409) });

    await renderDetalle();
    await pulsarEditar();
    await guardar();

    // El modal declara role="alertdialog", no "dialog".
    //
    // Antes esto no abría nada: el ReferenceError del catch se tragaba el 409.
    const dialogo = container.querySelector('[role="alertdialog"]');
    expect(dialogo).toBeTruthy();
    expect(dialogo.textContent).toContain('quedaría con 9 h');
    expect(dialogo.textContent).toContain('límite diario es 6 h');
  });

  it('nunca dice "0 h" en el aviso de conflicto', async () => {
    stubApi({ put: respuestaJson(CONFLICTO, 409) });

    await renderDetalle();
    await pulsarEditar();
    await guardar();

    const dialogo = container.querySelector('[role="alertdialog"]');
    expect(dialogo.textContent).not.toContain('0 h');
  });

  it('avisa como error, no como éxito, cuando resuelto es false', async () => {
    // Guardó, pero el día sigue por encima del límite: un check verde
    // contradiría el texto y el usuario creería que se resolvió.
    stubApi({
      put: respuestaJson({ ...SUBTAREA, horasEstimadas: 4, resuelto: false }),
    });

    await renderDetalle();
    await pulsarEditar();
    await guardar();

    await vi.waitFor(() => {
      expect(container.textContent).toContain(
        'ese día sigue por encima de tu límite'
      );
    });
  });

  it('confirma con éxito cuando resuelto es true', async () => {
    stubApi({ put: respuestaJson({ ...SUBTAREA, horasEstimadas: 1, resuelto: true }) });

    await renderDetalle();
    await pulsarEditar();
    await guardar();

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Gestión actualizada');
    });
    expect(container.textContent).not.toContain('sigue por encima');
  });
});
