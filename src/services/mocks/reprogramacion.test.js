import { beforeEach, describe, expect, it } from 'vitest';
import {
  getProfile,
  reprogramarSubtask,
  resetMock,
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

  it('reprograma sin conflicto cuando entra en el límite', async () => {
    seedHoras('2026-11-15', 2);

    const respuesta = await reprogramarSubtask(1, {
      nuevaFecha: '2026-11-15',
      nuevasHoras: 3,
    });

    expect(respuesta.conflicto).toBe(false);
    expect(respuesta.horasTotalesCalculadas).toBe(5);
    expect(respuesta.subtarea).toMatchObject({ horasEstimadas: 3 });
  });

  it('devuelve conflicto cuando supera el límite', async () => {
    seedHoras('2026-11-15', 5);

    const respuesta = await reprogramarSubtask(1, {
      nuevaFecha: '2026-11-15',
      nuevasHoras: 3,
    });

    expect(respuesta.conflicto).toBe(true);
    expect(respuesta.limiteDiario).toBe(6);
    expect(respuesta.horasTotalesCalculadas).toBe(8);
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
