import { beforeEach, describe, expect, it } from 'vitest';
import {
  getProfile,
  reprogramarSubtask,
  resetMock,
  seedEstado,
  seedHoras,
  updateProfileLimit,
} from './reprogramacion';

describe('mock de reprogramación', () => {
  beforeEach(() => {
    resetMock();
  });

  it('parte de un límite de 6 horas', async () => {
    await expect(getProfile()).resolves.toMatchObject({
      limiteHorasDiarias: 6,
    });
  });

  it('valida el rango del límite (1..16)', async () => {
    await expect(
      updateProfileLimit({ limiteHorasDiarias: 0 })
    ).rejects.toThrow();
    await expect(
      updateProfileLimit({ limiteHorasDiarias: 17 })
    ).rejects.toThrow();

    const perfil = await updateProfileLimit({ limiteHorasDiarias: 8 });
    expect(perfil.limiteHorasDiarias).toBe(8);
  });

  it('responde la capacidad, no el perfil, al cambiar el límite', async () => {
    seedHoras('2026-11-15', 2);
    await updateProfileLimit({ limiteHorasDiarias: 8 });

    // PUT /api/users/capacity devuelve CapacidadDTO: sin email ni nombre.
    const capacidad = await updateProfileLimit({ limiteHorasDiarias: 8 });

    expect(capacidad.limiteHorasDiarias).toBe(8);
    expect(capacidad.usuarioId).toBe(99);
    expect(capacidad).not.toHaveProperty('email');
  });

  it('devuelve 200 con la SubtareaDTO plana cuando entra en el límite', async () => {
    seedHoras('2026-11-15', 2);

    const respuesta = await reprogramarSubtask(1, {
      nuevaFecha: '2026-11-15',
      nuevasHoras: 3,
    });

    // Sin envoltorio `subtarea` ni campos de conflicto: es la DTO pelada.
    expect(respuesta).toMatchObject({
      idSubtarea: 1,
      fechaObjetivo: '2026-11-15',
      horasEstimadas: 3,
    });
    expect(respuesta).not.toHaveProperty('subtarea');
    expect(respuesta).not.toHaveProperty('conflicto');
  });

  it('lanza un 409 con el detalle aplanado cuando supera el límite', async () => {
    seedHoras('2026-11-15', 5);

    // El conflicto es un throw, no un 200: es la rama que recorre producción.
    await expect(
      reprogramarSubtask(1, { nuevaFecha: '2026-11-15', nuevasHoras: 3 })
    ).rejects.toMatchObject({
      status: 409,
      details: {
        title: 'Límite diario excedido',
        limiteDiario: 6,
        horasAsignadasPreviamente: 5,
        horasSolicitadas: 3,
        horasPlanificadasTotales: 8,
        excedente: 2,
        idSubtarea: 1,
      },
    });
  });

  it('no guarda nada cuando el 409 bloquea la reprogramación', async () => {
    seedHoras('2026-11-15', 5);

    await expect(
      reprogramarSubtask(1, { nuevaFecha: '2026-11-15', nuevasHoras: 3 })
    ).rejects.toThrow();

    // Si se guardara, el reintento con menos horas partiría de la fecha movida.
    const despues = await reprogramarSubtask(1, {
      nuevaFecha: '2026-11-16',
      nuevasHoras: 1,
    });
    expect(despues.fechaObjetivo).toBe('2026-11-16');
  });

  it('fija la línea base la primera vez y no la recalcula después', async () => {
    const primera = await reprogramarSubtask(7, {
      nuevaFecha: '2026-11-20',
      nuevasHoras: 1,
    });
    // Primera movida: no hay fecha previa con la que compararla.
    expect(primera.fechaObjetivoOriginal).toBeNull();

    await reprogramarSubtask(7, { nuevaFecha: '2026-11-18', nuevasHoras: 1 });
    const segunda = await reprogramarSubtask(7, {
      nuevaFecha: '2026-11-22',
      nuevasHoras: 1,
    });

    expect(segunda.fechaObjetivo).toBe('2026-11-22');
    expect(segunda.fechaObjetivoOriginal).toBe('2026-11-20');
  });

  it('devuelve al plan una pospuesta reprogramada', async () => {
    // Es lo que hace `SubtareaService.reprogramar`: al reprogramar, una
    // pospuesta recupera su día y vuelve a `pendiente`. Sin esto el mock la
    // dejaba en `pospuesta` con una fecha nueva, un estado que el backend nunca
    // devuelve: en desarrollo se veía algo que en producción no pasa.
    seedEstado(1, 'pospuesta');

    const respuesta = await reprogramarSubtask(1, {
      nuevaFecha: '2026-11-16',
      nuevasHoras: 2,
    });

    expect(respuesta.estado).toBe('pendiente');
  });

  it('deja el estado como estaba al reprogramar lo que no era pospuesta', async () => {
    // La transición solo ocurre si el estado era `pospuesta`.
    seedEstado(1, 'pendiente');

    const pendiente = await reprogramarSubtask(1, {
      nuevaFecha: '2026-11-16',
      nuevasHoras: 2,
    });
    expect(pendiente.estado).toBe('pendiente');

    seedEstado(1, 'ejecutada');

    const ejecutada = await reprogramarSubtask(1, {
      nuevaFecha: '2026-11-17',
      nuevasHoras: 2,
    });
    // Reprogramar una ejecutada no la reabre: es otra acción ("Reabrir").
    expect(ejecutada.estado).toBe('ejecutada');
  });

  it('no inventa un estado si la gestión no lo tenía', async () => {
    const respuesta = await reprogramarSubtask(1, {
      nuevaFecha: '2026-11-16',
      nuevasHoras: 2,
    });

    expect(respuesta.estado).toBeUndefined();
  });

  it('rechaza horas inválidas', async () => {
    await expect(
      reprogramarSubtask(1, { nuevaFecha: '2026-11-15', nuevasHoras: 0 })
    ).rejects.toThrow();
    await expect(
      reprogramarSubtask(1, { nuevaFecha: '', nuevasHoras: 3 })
    ).rejects.toThrow();
  });
});
