import {
  ArrowUpRight,
  CalendarClock,
  CircleCheck,
  TriangleAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DESFASE_ADELANTADA,
  formatHours,
  getDesfase,
  getStateLabel,
  getStateVariant,
  getTaskDate,
  getTaskHours,
} from '../../utils/taskMetrics';
import {
  ESTADO_EJECUTADA,
  ESTADO_POSPUEESTA,
  siguienteEstado,
} from '../../utils/taskExecution';
import { getEventAccent } from '../../utils/eventAccent';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';

// El desfase se deriva de la fecha de planificación contra la actual, así que
// no hace falta guardar el estado: postergar dos veces no acumula marcas.
const DESFASE = {
  [DESFASE_ADELANTADA]: { variant: 'success', etiqueta: 'Adelantada' },
  postergada: { variant: 'pending', etiqueta: 'Postergada' },
};

// Las acciones de una gestión comparten ancho para que la fila no se vea
// desigual. El ancho va aquí y no repetido en cada botón.
const TASK_ACTION_CLASS = 'w-28 rounded-full text-xs';

/**
 * Tarjeta de una gestión.
 *
 * `onComplete` y `onDefer` son opcionales a propósito: /progreso y el calendario
 * muestran la misma tarjeta sin acciones y no deben cambiar de aspecto. Cuando
 * llegan, aparecen los botones rápidos de US-09.
 *
 * Cada botón se autodeshabilita si la gestión ya está en ese estado: `null` de
 * `siguienteEstado` significa que la acción no cambiaría nada, y mandar el PATCH
 * igual solo gastaría una petición.
 *
 * `onReschedule` es la acción de salida de una gestión pospuesta. No la
 * comparten `onComplete`/`onDefer` porque solo tiene sentido cuando no hay día
 * asignado: una gestión pospuesta no se puede volver a posponer ni a marcar como
 * hecha desde aquí, solo reprogramarla.
 *
 * `note` es el motivo del último cambio de estado, ya recortado por
 * `notaLegible`. La pasa SOLO el grupo de pospuestas de `/hoy`, que es donde
 * responde a una pregunta real ("¿por qué esto está aquí?"). Viene como prop y
 * no se lee del `task` a propósito: si se leyera aquí, saldría en cualquier
 * tarjeta que traiga nota, y en "Para hoy" o "Próximas" no aporta nada.
 */
export function TaskCard({
  task,
  dateLabel,
  note = '',
  isOverdue = false,
  esVencida = false,
  showState = true,
  onComplete,
  onDefer,
  onReschedule,
  isUpdating = false,
}) {
  const eventId = task.eventId;
  // Sin nombre de evento no se inventa un "Evento #12": ese numeral solo
  // ocupaba sitio y no decía nada. La línea se omite y queda el título de la
  // tarea, que es lo que importa.
  const eventName = task.eventName;
  const taskDate = getTaskDate(task);
  // Mismo acento por evento que la tarjeta de /progreso, para que una gestión y
  // su evento se lean como el mismo objeto aunque estén en pantallas distintas.
  const accent = getEventAccent(eventId);
  const desfase = getDesfase(task);
  const marcaDesfase = desfase ? DESFASE[desfase.tipo] : null;

  const acciones = onComplete || onDefer || onReschedule;
  const puedeCompletar =
    Boolean(onComplete) && siguienteEstado(task.state, 'completar') !== null;
  const puedePosponer =
    Boolean(onDefer) && siguienteEstado(task.state, 'posponer') !== null;

  return (
    <Card
      as="li"
      // `event-card` aporta la sombra y el realce del hover. No se declaran aquí
      // `transition-shadow` ni `hover:shadow-md`: `.event-card` va sin capa y
      // manda sobre ellas, así que quedarían como clases muertas.
      //
      // El aviso sale de `esVencida` (la FECHA ya pasó) y no de `isOverdue`
      // (estar en el grupo de vencidas): son dos cosas distintas y con un solo
      // booleano no se pueden expresar. Una gestión pospuesta con fecha de ayer
      // está vencida aunque viva en su propio grupo, y antes no se le veía
      // nada por eso.
      //
      // `esVencida` trae el anillo Y el fondo rojo (`--alerta-fondo` al 30%,
      // medido para que el texto siga pasando AA en los dos temas). El tinte
      // ámbar desaparece cuando hay rojo: dos fondos de aviso a la vez no
      // significan nada, y el rojo es el que se pidió.
      //
      // NO lleva `border-warning`: el anillo queda 3px fuera del borde y un
      // ámbar de 1px pegado al rojo se vería como dos contornos.
      className={`event-card p-4 ${
        esVencida ? 'event-card--vencida bg-alerta-fondo/30' : ''
      }`}
      // Con la gestión vencida NO se pasa el color del evento: el estilo inline
      // gana a `.event-card--vencida`, y si siguiera aquí el halo del hover
      // volvería a ser el del evento en vez de rojo.
      style={isOverdue ? undefined : { '--accent-glow': accent.glow }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {eventName && (
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-text">
              {eventName}
            </p>
          )}
          <h3 className="mt-1 text-base font-semibold text-primary-text">
            {task.title}
          </h3>
          {(dateLabel || isOverdue) && (
            <p
              className={`mt-2 flex items-center gap-1 text-sm ${
                // Sobre el fondo rojo, `--text-muted` cae a 3.9:1 y no pasa AA.
                esVencida ? 'text-secondary-text' : 'text-muted-text'
              }`}
            >
              {isOverdue && (
                <TriangleAlert
                  aria-hidden="true"
                  className="size-4 text-warning-text"
                />
              )}
              {dateLabel && <time dateTime={taskDate}>{dateLabel}</time>}
            </p>
          )}
          {note && (
            // Se pinta recortado, pero la nota ENTERA va en el `title`: quien la
            // necesite la tiene al pasar el ratón y los lectores de pantalla
            // leen el atributo aunque no se vea.
            <p
              className="mt-2 text-sm italic text-muted-text"
              title={String(task.note ?? '')}
            >
              {note}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{formatHours(getTaskHours(task))}</Badge>
          {marcaDesfase && (
            <Badge variant={marcaDesfase.variant}>
              <CalendarClock aria-hidden="true" className="size-3.5" />
              {marcaDesfase.etiqueta} · {desfase.dias}{' '}
              {desfase.dias === 1 ? 'día' : 'días'}
            </Badge>
          )}
          {isOverdue && <Badge variant="pending">Atrasada</Badge>}
          {showState && (
            <Badge variant={getStateVariant(task.state)}>
              {getStateLabel(task.state)}
            </Badge>
          )}
          {acciones && (
            <>
              {onComplete && (
                <Button
                  type="button"
                  variant={
                    task.state === ESTADO_EJECUTADA
                      ? 'neutral'
                      : 'success-outline'
                  }
                  className={TASK_ACTION_CLASS}
                  onClick={() => onComplete(task)}
                  disabled={!puedeCompletar || isUpdating}
                  aria-busy={isUpdating}
                >
                  {/* "Completada" no lleva icono y "Hecha" sí. El ancho de la
                      fila es fijo (`w-28`) y el texto con icono no cabía: el
                      grupo se salía del botón y el texto quedaba pegado al
                      borde en vez de centrado. Los dos textos se leen igual de
                      bien sin icono, y el badge de estado que hay al lado ya
                      dice que está completada. */}
                  {task.state === ESTADO_EJECUTADA ? (
                    'Completada'
                  ) : (
                    <>
                      <CircleCheck
                        aria-hidden="true"
                        className="mr-1 inline size-4"
                      />
                      Hecha
                    </>
                  )}
                </Button>
              )}
              {/* Un botón que no puede hacer nada no se pinta. Una gestión ya
                  pospuesta llega a su tope: `siguienteEstado` devuelve `null`, y el
                  botón solo repetiría el badge "Pospuesta" que ya está al lado. */}
              {onDefer && puedePosponer && (
                <Button
                  type="button"
                  variant="warning-outline"
                  className={TASK_ACTION_CLASS}
                  onClick={() => onDefer(task)}
                  disabled={isUpdating}
                  aria-busy={isUpdating}
                >
                  <CalendarClock
                    aria-hidden="true"
                    className="mr-1 inline size-4"
                  />
                  Posponer
                </Button>
              )}
              {onReschedule && (
                <Button
                  type="button"
                  variant="primary-outline"
                  className={TASK_ACTION_CLASS}
                  onClick={() => onReschedule(task)}
                  disabled={isUpdating}
                  aria-busy={isUpdating}
                >
                  {/* Sin icono a propósito. Es la etiqueta más larga de la fila
                      (~71px) y con el icono no cabía en el ancho fijo de `w-28`:
                      el texto se salía del botón y quedaba pegado al borde en
                      vez de centrado. */}
                  Reprogramar
                </Button>
              )}
            </>
          )}
          {eventId && (
            <Button
              as={Link}
              to={`/evento/${eventId}`}
              variant="neutral"
              aria-label={eventName ? `Ver evento ${eventName}` : 'Ver evento'}
            >
              <ArrowUpRight aria-hidden="true" className="mr-1 inline size-4" />
              Ver evento
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
