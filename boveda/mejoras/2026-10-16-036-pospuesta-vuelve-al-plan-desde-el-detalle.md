---
tipo: mejora
---

# Una pospuesta vuelve al plan desde el detalle del evento

- **Fecha:** 2026-10-16
- **Área:** interfaz / integración
- **Estado:** hecha

## Descripción

El 2026-10-16 "Reprogramar" salió de la fila de acciones de `/evento/:id` con el
argumento de que para cambiar una fecha estaba el formulario de edición. Al
retirarlo se descubrió que el formulario **no cambia el estado**: solo texto,
horas y fecha. Así que una gestión pospuesta se quedaba sin ninguna forma de
volver al plan desde la única pantalla donde se edita.

La fila era `Completar/Reabrir`, `Editar` y `Eliminar`, con un toggle que solo
conoce dos estados (`subtask.state === 'ejecutada' ? 'pendiente' : 'ejecutada'`).
Para una pospuesta caía siempre en la rama de "Completar": marcarla como hecha no
es devolverla al plan. Y "Reabrir" solo aparecía si ya estaba ejecutada, así que
volver atrás exigía completarla primero y reabrirla después, con dos PATCH.

## Cambios

- `src/views/EventDetailView.jsx` — `PRIMERA_ACCION` convierte el primer botón en
  una tabla por estado: `pendiente` → Completar (verde), `pospuesta` →
  **Reprogramar** (ámbar, abre el `ReprogramarModal`), `ejecutada` → Reabrir
  (neutro). El `aria-label` sale de la tabla y no de un ternario.
- `src/services/mocks/reprogramacion.js` — `reprogramarSubtask` devuelve la
  pospuesta a `pendiente`, y añade `seedEstado` para poder sembrar el estado en
  los tests.
- `src/views/EventDetailView.test.jsx`, `src/services/mocks/reprogramacion.test.js`
  — cuatro pruebas nuevas.

## Decisiones

- **Reprogramar ya era la salida de la posposición y el backend lo dice.**
  `SubtareaService.reprogramar`: *"Reprogramar es la salida de la posposición: la
  gestión recupera su día y vuelve a la planificación activa. Sin esto seguiría en
  `pospuesta`, invisible en los grupos de /hoy y sin contar para la carga, con una
  fecha nueva que no significaría nada."* No hacía falta inventar ninguna acción
  nueva: la retirada había dejado sin botón a la única que servía.
- **Seis botones no cabían, y cuatro no hacen falta.** La fila comparte
  `TASK_ACTION_CLASS` (`w-28`), así que un cuarto botón descoloca los tres. Con la
  tabla, la fila sigue teniendo tres botones y el mismo ancho.
- **En `/evento/:id` se pide "Reprogramar", no "Completar".** Se pierde el "la
  acabé" de un clic, pero reprogramar da día, valida el límite diario contra el
  409 y va al `ConflictoModal` que ya estaba montado. "La acabé" de un clic sigue
  disponible en `/hoy`.
- **El mock devuelto a la realidad.** No tocaba `estado`, así que con
  `VITE_USE_MOCKS=true` reprogramar una pospuesta la dejaba en `pospuesta` con una
  fecha nueva: un estado que el backend nunca devuelve. En desarrollo se veía algo
  que en producción no pasa.
- **Nada de esto pierde datos.** Cabe dejar escrito un aviso: se sospechaba que `api.js` manda
  `notaExplicativa: null` en cada toggle y que eso borraba el motivo: **no lo hace**.
  `SubtareaService.actualizarNota` solo escribe si la nota llega distinta de `null`,
  con el comentario *"Un `null` significa 'no me cuentes nada', no 'borra lo que
  había'"*. El backend lo tenía cubierto.

## Verificación

- `npm run lint` → 3 warnings, los tres preexistentes; `npm run test` → **19
  archivos, 218 pruebas**; `npm run build` ✅.
- Las cuatro pruebas de render comprueban que pendiente y ejecutada no cambian de
  botón, que la pospuesta ofrece Reprogramar y no Completar, y que al pulsarlo se
  abre el modal **sin** mandar ningún PATCH todavía.
- Del mock: que una pospuesta vuelve a `pendiente`, que una pendiente y una
  ejecutada se quedan como estaban, y que si no había estado no se inventa la
  clave.

## Pendiente

- **El motivo de la pospuesta sigue sin verse en ninguna parte.**
  `SubtareaDTO` sí devuelve `notaExplicativa`, pero `normalizeSubtask` la tira y
  ningún componente la pinta: `esNotaObligatoria` obliga a escribirla y luego nadie
  la lee. Es un agujero independiente de este.
- **Desde `/evento/:id` no se puede completar una pospuesta en un clic.** Se
  reprograma y luego se completa. Aceptado a conciencia, no por olvido.