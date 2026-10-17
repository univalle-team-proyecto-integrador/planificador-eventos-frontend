---
tipo: mejora
---

# Las pospuestas salen de Vencidas y se plegan debajo

- **Fecha:** 2026-10-16
- **Área:** interfaz / integración
- **Estado:** hecha

## Descripción

La mejora 032 metió las pospuestas con fecha pasada en "Gestiones vencidas". Al poco
de llegar se vio que `/hoy` tenía **dos grupos con el mismo nombre**: "Gestiones
vencidas" y, en la llamada de las pospuestas, `title="Vencidas"`. Con las dos a la
vez, "vencidas" significaba dos cosas distintas según el estado de la tarjeta.

La decisión es que "Vencidas" vuelva a significar una sola cosa: lo que se pasó de
fecha sin que nadie lo apartara. Lo pospuesto se apartó **a propósito**, y eso tiene
su propio sitio. Por orden, además, lo que está atrasado va arriba porque es lo
urgente, y lo pospuesto debajo y plegado, que es lo secundario de la pantalla.

## Cambios

- `src/utils/taskMetrics.js` — `classifyTasksByDate`: `overdue` excluye también a
  las `pospuesta` y `deferred` vuelve a ser `isTaskDeferred(task)` sin el filtro de
  fecha. Toda pospuesta va a su grupo, tenga la fecha que conserve. El docstring de
  `esVencida` avisa de que esa función decide el aviso rojo, no el grupo.
- `src/views/HoyView.jsx` — el grupo se titula "Pospuestas" y su descripción dice
  "Sin día asignado", que sí vale para todas (una pospuesta conserva fecha, no día).
  `TaskSection` acepta `collapsible` y con él se pinta como `<details>` nativo.
- `src/utils/taskMetrics.test.js`, `src/views/HoyView.test.jsx` — las tres pruebas
  que fijaban la regla de la 032 se reescriben; se añaden cuatro.

## Decisiones

- **El aviso rojo sobrevive, el grupo no.** `esVencida` sigue siendo un predicado
  solo por fecha, así que una pospuesta con la fecha de ayer se sigue viendo en rojo
  dentro de "Pospuestas". Lo que cambia es dónde vive, no si se avisa: el aviso rojo
  informa, el grupo organiza.
- **El badge "Atrasada" se queda en Vencidas.** No hacía falta tocar nada para
  lograrlo: `isOverdue` es un booleano de sección y el grupo de pospuestas no lo
  pasa, así que ahí ya no salía. La tarjeta pospuesta lleva el badge de su estado y
  el texto "Última fecha: …".
- **`<details>` nativo en vez de un estado en React.** El teclado, el Enter/Espacio
  y el anuncio de lector de pantalla los da el elemento; no hay `aria-expanded` que
  mantener a mano ni que se desincronice del texto.
- **El contador va en el summary, la descripción en el cuerpo.** El nombre accesible
  del summary queda corto ("Pospuestas, 3") en vez de arrastrar el párrafo entero. El
  contador es lo que evita que lo plegado pase desapercibido.
- **Cerrado por defecto.** Refuerza que lo urgente manda. Aun así no se pierde nada:
  el grupo está fuera de la condición de estado vacío, así que con las pospuestas
  como único trabajo sigue viéndose (plegado, pero visible y con su contador).
- **`onReschedule` se queda en Vencidas**, pero por su propio motivo y no por el de la
  032: reprogramar mueve la fecha objetivo sin cambiar el estado, que es la vía para
  devolver al plan una vencida que no se va a hacer hoy. Posponer es lo contrario
  (sacar del plan sin día), así que no se pisan.

## Verificación

- `npm run lint` → 3 warnings, los tres preexistentes; `npm run test` → **19
  archivos, 211 pruebas**; `npm run build` ✅.
- Comprobado en el CSS compilado que `group-open:rotate-180` sale como
  `:is(:where(.group):is([open],…) *)`: el chevron gira al abrir el `<details>`.
- La prueba de render comprueba que el grupo sale plegado, que el contador está en el
  summary, que la descripción no, y que el contenido aparece al pulsarlo.

## Pendiente

- **La nota 032 queda contradicha** en sus dos decisiones centrales. Se le añadió una
  nota arriba; conviene no citarla sin leer esta.
- **La pospuesta sigue sin reprogramarse hacia atrás** en `/evento/:id`, donde el
  botón dice "Completar" y la pasa a `ejecutada`. Sin cambios aquí.