import { ApiError } from '../api';

// Mock en memoria del contrato de reprogramación. Solo se usa cuando
// VITE_USE_MOCKS=true (ver docs/contrato-reprogramacion.md); nunca toca la red
// ni localStorage. Reproduce la forma del backend real para que las vistas no
// cambien al pasar a producción: el conflicto es un 200 con `conflicto: true`.

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

export const updateProfileLimit = async ({ limiteHorasDiarias }) => {
  const valor = Number(limiteHorasDiarias);

  if (!esEntero(valor) || valor < LIMITE_MIN || valor > LIMITE_MAX) {
    throw new ApiError(
      `El límite diario debe ser un número entero entre ${LIMITE_MIN} y ${LIMITE_MAX}.`,
      400
    );
  }

  estado.perfil.limiteHorasDiarias = valor;
  return clonar(estado.perfil);
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
  const horasTotalesCalculadas = horasOtras + horas;

  if (horasTotalesCalculadas > limiteDiario) {
    return {
      conflicto: true,
      limiteDiario,
      horasTotalesCalculadas,
      mensaje: 'La reprogramación supera el límite diario de horas asignado',
    };
  }

  estado.subtareas[id] = { nuevaFecha, nuevasHoras: horas };

  return {
    conflicto: false,
    limiteDiario,
    horasTotalesCalculadas,
    subtarea: {
      idSubtarea: Number(id),
      fechaObjetivo: nuevaFecha,
      horasEstimadas: horas,
    },
  };
};
