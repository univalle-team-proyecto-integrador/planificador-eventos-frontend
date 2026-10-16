import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { EventCard } from './EventCard';

/**
 * Tarjeta de evento de /progreso (US-10).
 *
 * Render y no lógica pura porque lo que se comprueba es el cableado del estado
 * vacío: que el aviso aparezca y que la acción vaya al detalle con el formulario
 * de alta ya abierto. Ningún test de `taskMetrics` detectaría un enlace roto.
 *
 * El `?nueva=1` es lo que `EventDetailView` lee para abrir el formulario de
 * gestión; sin él se aterriza en medio de la pantalla y hay que buscar el
 * botón "Añadir gestión".
 */

const eventoConGestiones = {
  id: 7,
  nombre: 'Boda de Prueba',
  cliente: 'Cliente',
  fechaEvento: '2030-05-10T18:00:00',
  lugar: 'Bogotá',
  total: 4,
  completed: 2,
  progress: 50,
};

const eventoSinGestiones = {
  id: 7,
  nombre: 'Boda de Prueba',
  cliente: 'Cliente',
  fechaEvento: '2030-05-10T18:00:00',
  lugar: 'Bogotá',
  total: 0,
  completed: 0,
  progress: 0,
};

describe('EventCard', () => {
  let container;
  let root;

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderTarjeta = async (evento) => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/progreso']}>
          <EventCard event={evento} />
        </MemoryRouter>
      );
    });
  };

  const enlacePorTexto = (texto) =>
    [...container.querySelectorAll('a')].find(
      (a) => (a.textContent ?? '').trim() === texto
    );

  it('invita a crear un plan inicial cuando el evento no tiene gestiones', async () => {
    await renderTarjeta(eventoSinGestiones);

    expect(container.textContent).toContain(
      'Aún no tienes gestiones. Crea un plan inicial.'
    );
  });

  it('ofrece añadir gestión y abre el detalle con el formulario listo', async () => {
    await renderTarjeta(eventoSinGestiones);

    const accion = enlacePorTexto('Añadir gestión');
    expect(accion).toBeTruthy();
    expect(accion.getAttribute('href')).toBe('/evento/7?nueva=1');
  });

  it('no ofrece la acción cuando el evento ya tiene gestiones', async () => {
    await renderTarjeta(eventoConGestiones);

    expect(enlacePorTexto('Añadir gestión')).toBeFalsy();
    expect(container.textContent).not.toContain('Aún no tienes gestiones');
  });

  it('muestra el recuento y el porcentaje cuando hay progreso', async () => {
    await renderTarjeta(eventoConGestiones);

    expect(container.textContent).toContain('2 de 4 tareas');
    expect(container.querySelector('[role="progressbar"]')).toBeTruthy();
    expect(
      container
        .querySelector('[role="progressbar"]')
        .getAttribute('aria-valuenow')
    ).toBe('50');
  });
});
