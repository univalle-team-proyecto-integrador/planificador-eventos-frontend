---
tipo: mejora
---

# Una pospuesta con la fecha pasada sale en "Gestiones vencidas"

- **Fecha:** 2026-10-16
- **Área:** interfaz / integración
- **Estado:** hecha

## Descripción

La mejora 030 enseñó la tarjeta vencida en todas partes donde hubiera una, pero su
tarjeta no aparecía en ninguna: una gestión pospuesta no entraba en los grupos de
planificación, así que lo que estaba visible no cambiaba. Con la única gestión pospuesta
del usuario, `/hoy` no tenía grupo de vencidas y no había nada donde ver el aviso.

La regla era "la pospuesta no va a Vencidas porque no ocupa día". Eso es cierto para la
**carga**, pero no para la **urgencia**: una pospuesta cuya fecha ya pasó está atrasada
igual que cualquier otra, y lo que está atrasado se revisa en Vencidas.

## Cambios

- `src/utils/taskMetrics.js` — `classifyTasksByDate`: `overdue` pasa a incluir las
  pospuestas con fecha pasada, excluyendo solo las `ejecutada`. `deferred` se queda con
  las pospuestas que conservan una fecha de hoy o futura.
- `src/views/HoyView.jsx` — el grupo de vencidas recibe `onReschedule`.
- `src/components/ui/TaskCard.jsx` — no se pinta un botón "Posponer" que no puede hacer
  nada en una gestión ya pospuesta.
- `src/utils/taskMetrics.test.js`, `src/views/HoyView.test.jsx` — pruebas actualizadas y
  una nueva.

## Decisiones

- **Se reutiliza `esVencida` como criterio único.** El aviso rojo de la tarjeta y el grupo
  en el que aparece usan la misma función, así que no pueden contradecirse: si algo se ve
  rojo, está en Vencidas, y al revés.
- **Las `ejecutada` se quedan fuera de Vencidas aunque su fecha sea antigua.** Una gestión
  hecha no está atrasada, está terminada. Sin esta exclusión, todo el histórico de un
  evento aparecería como vencidas.
- **`onReschedule` también en vencidas.** Una pospuesta que cae en ese grupo solo tiene
  una acción que le sirva: reprogramarla. Sin este prop las pospuestas vencidas
  llegarían ahí sin ninguna forma de arreglar nada, que es peor que donde estaban.
- **El botón "Posponer" desaparece cuando no puede hacer nada.** `siguienteEstado` ya
  devolvía `null` y el botón salía deshabilitado con el texto "Pospuesta", que solo
  repetía el badge que está al lado. Es ruido en una fila que ya tiene bastante.
- **El tope de 5 se acepta.** Las pospuestas estaban deliberadamente sin recortar, para que
  nadie perdiera una. Al entrar en Vencidas se recortan como el resto. Es un cambio de
  comportamiento respecto a la decisión anterior del grupo y queda anotado abajo como
  pendiente por si molesta.

## Verificación

- `npm run lint` → exit 0; `npm run test` → **19 archivos, 201 pruebas**; `npm run build` ✅.
- Dos pruebas fallaron al aplicar el cambio y **eso es lo que se quería**: una fijaba que
  las pospuestas no entraban en Vencidas y la otra que no ganase el badge.
  Se reescribieron para fijar la regla nueva, incluida una que comprueba que una
  `ejecutada` con fecha antigua **no** entra.
- La prueba de render comprueba además que la gestión no aparece duplicada en los dos
  grupos.

## Pendiente

- **El tope de 5 puede esconder pospuestas.** Si hay más de cinco vencidas, alguna
  pospuesta queda tras "Ver más". Es el precio de que viva en el grupo de vencidas; se
  puede revertir dejando las pospuestas sin recortar.
- **Volver a abrir una pospuesta hacia atrás sigue roto** en `/evento/:id`: el botón dice
  "Completar" y la pasa a `ejecutada`. Ahora que las pospuestas vencidas aparecen en
  Vencidas, el botón "Reprogramar" es la salida y queda más a mano, pero el hueco sigue.
- **La UI sigue sin permitir crear una gestión con fecha pasada** (`min={getToday()}`), así
  que este caso solo se produce con datos creados antes.