import { describe, expect, it } from 'vitest';
import {
  ACCION_COMPLETAR,
  ACCION_POSPONER,
  ESTADO_EJECUTADA,
  ESTADO_PENDIENTE,
  ESTADO_POSPUEESTA,
  esNotaObligatoria,
  getDescripcionModal,
  getEtiquetaConfirmar,
  getHorasLiberadas,
  getMensajeConfirmacion,
  getTituloModal,
  siguienteEstado,
  validarNota,
} from './taskExecution';
import { formatProgressCount, formatProgressDescription } from './taskMetrics';
import { requireSubtaskResponse } from './subtaskResponse';

describe('siguienteEstado', () => {
  it('lleva a ejecutada al completar una gestión pendiente o pospuesta', () => {
    expect(siguienteEstado(ESTADO_PENDIENTE, ACCION_COMPLETAR)).toBe(
      ESTADO_EJECUTADA
    );
    expect(siguienteEstado(ESTADO_POSPUEESTA, ACCION_COMPLETAR)).toBe(
      ESTADO_EJECUTADA
    );
  });

  it('lleva a pospuesta al posponer una gestión pendiente o ejecutada', () => {
    expect(siguienteEstado(ESTADO_PENDIENTE, ACCION_POSPONER)).toBe(
      ESTADO_POSPUEESTA
    );
    expect(siguienteEstado(ESTADO_EJECUTADA, ACCION_POSPONER)).toBe(
      ESTADO_POSPUEESTA
    );
  });

  it('devuelve null si la gestión ya está en ese estado', () => {
    // La acción no cambiaría nada: es mejor deshabilitar el botón que gastar
    // un PATCH para obtener la misma fila.
    expect(siguienteEstado(ESTADO_EJECUTADA, ACCION_COMPLETAR)).toBeNull();
    expect(siguienteEstado(ESTADO_POSPUEESTA, ACCION_POSPONER)).toBeNull();
  });

  it('trata un estado ausente como pendiente', () => {
    expect(siguienteEstado(undefined, ACCION_COMPLETAR)).toBe(ESTADO_EJECUTADA);
    expect(siguienteEstado(null, ACCION_POSPONER)).toBe(ESTADO_POSPUEESTA);
  });

  it('devuelve null para una acción desconocida', () => {
    expect(siguienteEstado(ESTADO_PENDIENTE, 'borrar')).toBeNull();
  });
});

describe('esNotaObligatoria', () => {
  it('exige motivo al posponer y no al completar', () => {
    expect(esNotaObligatoria(ESTADO_POSPUEESTA)).toBe(true);
    expect(esNotaObligatoria(ESTADO_EJECUTADA)).toBe(false);
  });
});

describe('validarNota', () => {
  it('rechaza una nota vacía al posponer', () => {
    const error = validarNota('   ', ESTADO_POSPUEESTA);

    expect(error).toContain('por qué se pospone');
  });

  it('rechaza una nota larga al posponer', () => {
    expect(validarNota('a'.repeat(501), ESTADO_POSPUEESTA)).toContain('500');
  });

  it('acepta una nota con motivo al posponer', () => {
    expect(validarNota('Proveedor sin disponibilidad', ESTADO_POSPUEESTA)).toBe(
      ''
    );
  });

  it('deja pasar una nota vacía al completar', () => {
    // Completar es la acción más frecuente de la pantalla: obligar a escribir
    // convertiría la más común en la más lenta.
    expect(validarNota('', ESTADO_EJECUTADA)).toBe('');
  });
});

describe('textos del modal', () => {
  it('cambia título, descripción y etiqueta según el estado', () => {
    expect(getTituloModal(ESTADO_POSPUEESTA)).toContain('pospuesta');
    expect(getEtiquetaConfirmar(ESTADO_POSPUEESTA)).toBe('Poner en pospuesta');
    expect(getDescripcionModal(ESTADO_POSPUEESTA)).toContain('por qué');

    expect(getTituloModal(ESTADO_EJECUTADA)).toContain('completada');
    expect(getEtiquetaConfirmar(ESTADO_EJECUTADA)).toBe(
      'Marcar como completada'
    );
    expect(getDescripcionModal(ESTADO_EJECUTADA)).toContain('Opcionalmente');
  });
});

describe('getMensajeConfirmacion', () => {
  it('distingue completada, pospuesta y reabierta', () => {
    expect(getMensajeConfirmacion(ESTADO_EJECUTADA)).toBe(
      'Gestión marcada como completada.'
    );
    expect(getMensajeConfirmacion(ESTADO_POSPUEESTA)).toBe(
      'Gestión pospuesta.'
    );
    expect(getMensajeConfirmacion(ESTADO_PENDIENTE)).toBe('Gestión reabierta.');
  });
});

describe('getHorasLiberadas', () => {
  it('libera las horas solo al completar', () => {
    // Al posponer la gestión sigue sin hacer: sigue contando para el límite.
    expect(getHorasLiberadas({ hours: 4 }, ESTADO_EJECUTADA)).toBe(4);
    expect(getHorasLiberadas({ hours: 4 }, ESTADO_POSPUEESTA)).toBe(0);
  });

  it('lee el nombre del backend cuando no viene el normalizado', () => {
    expect(getHorasLiberadas({ horasEstimadas: 2.5 }, ESTADO_EJECUTADA)).toBe(
      2.5
    );
  });

  it('devuelve 0 si las horas no son un número', () => {
    expect(getHorasLiberadas({ hours: 'muchas' }, ESTADO_EJECUTADA)).toBe(0);
    expect(getHorasLiberadas({}, ESTADO_EJECUTADA)).toBe(0);
  });
});

describe('formatProgressCount', () => {
  it('cuenta en plural', () => {
    expect(formatProgressCount(6, 12)).toBe('6 de 12 gestiones');
  });

  it('usa el singular cuando el total es 1', () => {
    expect(formatProgressCount(1, 1)).toBe('1 de 1 gestión');
    expect(formatProgressCount(0, 1)).toBe('0 de 1 gestión');
  });

  it('acepta el sustantivo que le pase quien lo llama', () => {
    expect(formatProgressCount(3, 8, 'hora', 'horas')).toBe('3 de 8 horas');
    expect(formatProgressCount(2, 1, 'hora', 'horas')).toBe('1 de 1 hora');
  });

  it('no deja que las completadas superen el total', () => {
    expect(formatProgressCount(15, 12)).toBe('12 de 12 gestiones');
  });

  it('tolera valores ausentes o inválidos', () => {
    expect(formatProgressCount(undefined, undefined)).toBe('0 de 0 gestiones');
  });
});

describe('formatProgressDescription', () => {
  it('une el recuento con el porcentaje', () => {
    expect(formatProgressDescription(6, 12, 50)).toBe(
      '6 de 12 gestiones (50%)'
    );
  });

  it('redondea el porcentaje igual que la barra', () => {
    // getTaskMetrics redondea con Math.round: si el texto usara otro redondeo,
    // el número y el ancho de la barra dirían cosas distintas.
    expect(formatProgressDescription(1, 3, 33.333)).toBe(
      '1 de 3 gestiones (33%)'
    );
  });
});

describe('requireSubtaskResponse', () => {
  // El cliente llama `state` a lo que el servidor llama `estado`. Si el estado
  // antiguo del cliente sobrevive al merge, la gestión se queda en `pendiente`
  // con un 200 en la cara y nada avisa del error.
  const enPantalla = {
    id: 3,
    eventId: 9,
    title: 'Confirmar proveedor',
    hours: 2,
    date: '2030-05-12',
    state: 'pendiente',
    eventName: 'Boda de Prueba',
  };

  const delServidor = {
    idSubtarea: 3,
    idEvento: 9,
    nombreGestion: 'Confirmar proveedor',
    fechaObjetivo: '2030-05-12',
    horasEstimadas: 2,
    estado: 'ejecutada',
    notaExplicativa: 'Proveedor confirmó',
  };

  it('deja ganar al estado que devuelve el servidor', () => {
    expect(requireSubtaskResponse(delServidor, enPantalla).state).toBe(
      'ejecutada'
    );
  });

  it('conserva los campos que solo existen en el cliente', () => {
    // `eventName` lo añade el panel de hoy para pintar la tarjeta; si se pierde,
    // la gestión queda sin el nombre de su evento.
    expect(requireSubtaskResponse(delServidor, enPantalla).eventName).toBe(
      'Boda de Prueba'
    );
  });

  it('avanza también al posponer y al reabrir', () => {
    expect(
      requireSubtaskResponse(
        { ...delServidor, estado: 'pospuesta' },
        enPantalla
      ).state
    ).toBe('pospuesta');
    expect(
      requireSubtaskResponse(
        { ...delServidor, estado: 'pendiente' },
        { ...enPantalla, state: 'ejecutada' }
      ).state
    ).toBe('pendiente');
  });

  it('lanza si la respuesta no trae identificador', () => {
    // Sin id no se sabe a qué tarjeta aplicar el cambio.
    expect(() => requireSubtaskResponse({}, enPantalla)).toThrow(
      'no incluye la subtarea actualizada'
    );
  });
});
