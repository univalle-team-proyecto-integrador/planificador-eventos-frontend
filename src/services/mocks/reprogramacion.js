import { ApiError } from '../api';

// Mock en memoria del contrato de reprogramación. Solo se usa cuando
// VITE_USE_MOCKS=true (ver docs/contrato-reprogramacion.md); nunca toca la red
// ni localStorage.
//
// Reproduce la forma REAL del backend, no la que le conviene al frontend: el
// conflicto es un 409 con un ProblemDetail de campos aplanados en la raíz, y el
// éxito un 200 con la SubtareaDTO plana. Si el mock se aparta de esa forma, los
// tests pasan mientras la aplicación está rota, que es justo lo que pasó antes.

// El límite se ajusta en /api/users/capacity y responde CapacidadDTO, no el
// perfil. Mismo nombre de campo porque ConfiguracionView lee `limiteHorasDiarias`
// en las dos formas, pero la forma de la respuesta sí es la de capacidad.
const LIMITE_DEFAULT = 6;
const LIMITE_MIN = 1;
const LIMITE_MAX = 16;

const crearEstadoInicial = () => ({
  perfil: {
    idUsuario: 99,
    email: 'demo@eventflow.local',
    nombre: 'Cuenta demo',
    limiteHorasDiarias: LIMITE_DEFAULT,
  },
  // Horas de otras tareas no ejecutadas ya asignadas a cada fecha (yyyy-mm-dd).
  horasPorFecha: {},
  subtareas: {},
});

let estado = crearEstadoInicial();

const clonar = (valor) => JSON.parse(JSON.stringify(valor));

const esEntero = (valor) => Number.isInteger(valor);

/**
 * Reinicia el estado del mock. Pensado para tests y para volver a una demo
 * limpia sin recargar la app.
 */
export const resetMock = () => {
  estado = crearEstadoInicial();
};

/** Siembra horas ya asignadas a una fecha para forzar (o evitar) el conflicto. */
export const seedHoras = (fecha, horas) => {
  estado.horasPorFecha[fecha] = Number(horas) || 0;
};

export const getProfile = async () => clonar(estado.perfil);

/** Forma de CapacidadDTO: la que devuelve PUT /api/users/capacity. */
const construirCapacidad = (fecha) => {
  const horasPlanificadas = estado.horasPorFecha[fecha] ?? 0;
  const limite = estado.perfil.limiteHorasDiarias;

  return {
    usuarioId: estado.perfil.idUsuario,
    limiteHorasDiarias: limite,
    fecha,
    horasPlanificadas,
    horasDisponibles: Math.max(0, limite - horasPlanificadas),
  };
};

export const updateProfileLimit = async ({ limiteHorasDiarias }) => {
  const valor = Number(limiteHorasDiarias);

  if (!esEntero(valor) || valor < LIMITE_MIN || valor > LIMITE_MAX) {
    throw new ApiError(
      `El límite diario debe ser un número entero entre ${LIMITE_MIN} y ${LIMITE_MAX}.`,
      400
    );
  }

  estado.perfil.limiteHorasDiarias = valor;
  return clonar(construirCapacidad(estado.fechaEvaluada ?? null));
};

export const reprogramarSubtask = async (id, { nuevaFecha, nuevasHoras }) => {
  if (!nuevaFecha) {
    throw new ApiError('La nueva fecha es obligatoria.', 400);
  }

  const horas = Number(nuevasHoras);

  if (!esEntero(horas) || horas <= 0) {
    throw new ApiError(
      'Las nuevas horas deben ser un entero mayor que cero.',
      400
    );
  }

  const limiteDiario = estado.perfil.limiteHorasDiarias;
  const horasOtras = estado.horasPorFecha[nuevaFecha] ?? 0;
  const horasPlanificadasTotales = horasOtras + horas;

  // El backend lanza la excepción y el manejador la traduce a un 409 con estas
  // propiedades aplanadas en la raíz. Se reproduce el throw, no un 200 con
  // `conflicto: true`, para que los tests recorran la misma rama que producción.
  if (horasPlanificadasTotales > limiteDiario) {
    throw new ApiError(
      `La reprogramación supera el límite diario de ${limiteDiario} horas`,
      409,
      {
        title: 'Límite diario excedido',
        status: 409,
        detail: `La reprogramación supera el límite diario de ${limiteDiario} horas`,
        limiteDiario,
        horasAsignadasPreviamente: horasOtras,
        horasSolicitadas: horas,
        horasPlanificadasTotales,
        excedente: horasPlanificadasTotales - limiteDiario,
        fecha: nuevaFecha,
        idSubtarea: Number(id),
      }
    );
  }

  const previa = estado.subtareas[id] ?? {};
  // La línea base se fija la primera vez que la fecha cambia y luego no se
  // recalcula, igual que en SubtareaService.fijarLineaBaseSiFalta.
  const fechaOriginal =
    previa.fechaObjetivoOriginal ??
    (previa.fechaObjetivo && previa.fechaObjetivo !== nuevaFecha
      ? previa.fechaObjetivo
      : null);

  estado.subtareas[id] = {
    idSubtarea: Number(id),
    fechaObjetivo: nuevaFecha,
    fechaObjetivoOriginal: fechaOriginal,
    horasEstimadas: horas,
  };

  // 200 con la SubtareaDTO plana: sin envoltorio y sin campos de conflicto.
  return clonar(estado.subtareas[id]);
};
