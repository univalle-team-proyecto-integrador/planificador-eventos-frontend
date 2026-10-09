import { describe, expect, it } from 'vitest';
import { ApiError } from '../services/api';
import {
  esConflicto,
  getExceso,
  getHorasTotales,
  getLimiteDiario,
  getMensajeConflicto,
  getMensajeConflictoPersistente,
  normalizarConflicto409,
  validarReprogramacion,
} from './reprogramacion';

// Cuerpo real del 409, tal como lo arma GlobalExceptionHandler: las propiedades
// del ProblemDetail quedan aplanadas en la raíz, no bajo `properties`.
const detalleConflicto = {
  title: 'Límite diario excedido',
  status: 409,
  detail: 'La reprogramación supera el límite diario de 6 horas',
  limiteDiario: 6,
  horasAsignadasPreviamente: 5,
  horasSolicitadas: 4,
  horasPlanificadasTotales: 9,
  excedente: 3,
  fecha: '2026-11-15',
  idSubtarea: 1,
};

describe('reprogramacion', () => {
  // Es la forma en que la vista recibe el conflicto: el ApiError que lanza
  // `services/api.js`, con el cuerpo en `details`.
  const conflicto = new ApiError(
    detalleConflicto.detail,
    409,
    detalleConflicto
  );

  it('detecta el conflicto por el 409, no por un campo conflicto', () => {
    expect(esConflicto(conflicto)).toBe(true);
    expect(esConflicto(detalleConflicto)).toBe(true);
    expect(esConflicto({ status: 200, idSubtarea: 1 })).toBe(false);
    expect(esConflicto(null)).toBe(false);
    // También acepta la forma ya normalizada, que es la que ve el mock.
    expect(esConflicto({ conflicto: true })).toBe(true);
    expect(esConflicto({ conflicto: false })).toBe(false);
  });

  it('lee las cantidades de la raíz y no de properties', () => {
    expect(getLimiteDiario(conflicto)).toBe(6);
    expect(getHorasTotales(conflicto)).toBe(9);
    expect(getExceso(conflicto)).toBe(3);
  });

  it('usa el excedente que envía el servidor', () => {
    expect(getExceso(new ApiError('x', 409, { ...detalleConflicto, excedente: 7 }))).toBe(7);
  });

  it('recalcula el exceso solo si el servidor no lo mandó', () => {
    const sinExcedente = { limiteDiario: 6, horasPlanificadasTotales: 9 };
    expect(getExceso(sinExcedente)).toBe(3);
  });

  it('no reporta exceso cuando entra en el límite', () => {
    expect(getExceso({ limiteDiario: 6, horasPlanificadasTotales: 5 })).toBe(0);
  });

  it('redacta el conflicto con qué pasó y cómo corregirlo', () => {
    expect(getMensajeConflicto(conflicto)).toBe(
      'Ese día quedaría con 9 h y tu límite diario es 6 h. Reduce las horas o mueve la gestión a otro día.'
    );
  });

  it('normaliza el 409 real del backend, con sus nombres de campo', () => {
    // Cuerpo capturado del backend, no inventado: son las claves que devuelve
    // GlobalExceptionHandler con las propiedades aplanadas en la raíz.
    const resultado = normalizarConflicto409({
      detail: 'La reprogramación supera el límite diario de 6 horas',
      excedente: 3,
      fecha: '2026-11-15',
      horasAsignadasPreviamente: 5,
      horasPlanificadasTotales: 9,
      horasSolicitadas: 4,
      idSubtarea: 1,
      limiteDiario: 6,
      status: 409,
      title: 'Límite diario excedido',
    });

    expect(resultado).toEqual({
      conflicto: true,
      limiteDiario: 6,
      horasTotalesCalculadas: 9,
      mensaje: 'La reprogramación supera el límite diario de 6 horas',
    });
    expect(esConflicto(resultado)).toBe(true);
    expect(getExceso(resultado)).toBe(3);
  });

  it('deduce el total sumando el límite y el excedente del 409', () => {
    // Cuando el backend omite el total, la aritmética sigue siendo exacta.
    const resultado = normalizarConflicto409({ limiteDiario: 2, excedente: 14 });

    expect(resultado.horasTotalesCalculadas).toBe(16);
  });

  it('normaliza un 409 con aritmética a la forma de conflicto de la UI', () => {
    const resultado = normalizarConflicto409({
      detail: 'Supera el límite',
      limiteDiario: 6,
      horasTotalesCalculadas: 9,
    });

    expect(resultado).toEqual({
      conflicto: true,
      limiteDiario: 6,
      horasTotalesCalculadas: 9,
      mensaje: 'Supera el límite',
    });
    expect(esConflicto(resultado)).toBe(true);
    expect(getExceso(resultado)).toBe(3);
  });

  it('normaliza el 409 real del backend (ProblemDetail con excedente)', () => {
    const resultado = normalizarConflicto409({
      type: 'about:blank',
      title: 'Límite diario excedido',
      status: 409,
      detail: 'La reprogramación supera el límite diario de 6 horas',
      idSubtarea: 1,
      fecha: '2026-11-15',
      limiteDiario: 6,
      horasAsignadasPreviamente: 5,
      horasSolicitadas: 3,
      horasPlanificadasTotales: 9,
      excedente: 3,
    });

    expect(resultado).toEqual({
      conflicto: true,
      limiteDiario: 6,
      horasTotalesCalculadas: 9,
      mensaje: 'La reprogramación supera el límite diario de 6 horas',
    });
    expect(getExceso(resultado)).toBe(3);
  });

  it('normaliza un 409 en formato capacidad sumando las nuevas horas', () => {
    const resultado = normalizarConflicto409(
      { capacidad: { limiteHorasDiarias: 6 }, horasPlanificadas: 7 },
      3
    );

    expect(resultado.limiteDiario).toBe(6);
    expect(resultado.horasTotalesCalculadas).toBe(10);
    expect(getHorasTotales(resultado)).toBe(10);
  });

  it('normaliza un 409 con horas a liberar contra el límite', () => {
    const resultado = normalizarConflicto409({
      limiteDiario: 6,
      excedente: 3,
    });

    expect(resultado.limiteDiario).toBe(6);
    expect(resultado.horasTotalesCalculadas).toBe(9);
  });

  it('normaliza un 409 sin aritmética a mensaje genérico', () => {
    const resultado = normalizarConflicto409('El día está lleno');

    expect(resultado.conflicto).toBe(true);
    expect(resultado.limiteDiario).toBeUndefined();
    expect(resultado.horasTotalesCalculadas).toBeUndefined();
    expect(resultado.mensaje).toBe('El día está lleno');
  });

  it('usa un mensaje por defecto cuando el 409 no trae detalle', () => {
    expect(normalizarConflicto409({}).mensaje).toBe(
      'La reprogramación supera el límite diario de horas asignado.'
    );
  });

  it('redacta el conflicto genérico cuando no hay cantidades', () => {
    expect(getMensajeConflicto(normalizarConflicto409({}))).toBe(
      'La reprogramación supera el límite diario de horas asignado.'
    );
  });

  it('avisa que el conflicto persiste tras reducir sin alcanzar (US-08)', () => {
    // El guardado ocurrió pero `resuelto` vino en false: el día sigue pasándose
    // y el texto tiene que decirlo, sin fingir que se resolvió.
    expect(getMensajeConflictoPersistente()).toBe(
      'Horas actualizadas, pero ese día sigue por encima de tu límite. Reduce más o mueve la gestión a otro día.'
    );
  });

  it('acepta una reprogramación válida', () => {
    expect(
      validarReprogramacion({ fecha: '2026-11-15', horas: '3' }, '2026-11-10')
    ).toEqual({});
  });

  it('rechaza fecha vacía o pasada', () => {
    expect(
      validarReprogramacion({ fecha: '', horas: '3' }, '2026-11-10')
    ).toEqual({
      fecha: 'Falta la nueva fecha. Elige el día al que quieres moverla.',
    });

    expect(
      validarReprogramacion({ fecha: '2026-11-09', horas: '3' }, '2026-11-10')
    ).toEqual({
      fecha: 'La nueva fecha ya pasó. Selecciona hoy o una fecha futura.',
    });
  });

  it('rechaza horas vacías, inválidas, fraccionarias o cero', () => {
    expect(
      validarReprogramacion({ fecha: '2026-11-15', horas: '' }, '2026-11-10')
    ).toEqual({ horas: 'Faltan las horas. Ingresa un valor mayor a 0.' });

    expect(
      validarReprogramacion({ fecha: '2026-11-15', horas: 'dos' }, '2026-11-10')
    ).toEqual({
      horas:
        'Ingresaste un valor no válido. Asigna al menos 1 hora de esfuerzo.',
    });

    expect(
      validarReprogramacion({ fecha: '2026-11-15', horas: '2.5' }, '2026-11-10')
    ).toEqual({
      horas:
        'Ingresaste una fracción de hora. Ingresa un número entero de horas.',
    });

    expect(
      validarReprogramacion({ fecha: '2026-11-15', horas: 0 }, '2026-11-10')
    ).toEqual({
      horas: 'Ingresaste 0 o menos. Asigna al menos 1 hora de esfuerzo.',
    });
  });
});
