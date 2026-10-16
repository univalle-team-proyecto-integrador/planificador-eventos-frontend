---
tipo: mejora
---

# La barra dice cuántas y qué día llevas (US-10)

- **Fecha:** 2026-10-16
- **Área:** interfaz / accesibilidad / integración
- **Estado:** hecha

## Commits relacionados

- Trabajo del Sprint 4 sobre el estado actual del repositorio.

## Descripción

Dos cosas le faltaban al panel de hoy, y las dos están en la misma pregunta que se hace
quien abre la pantalla a primera hora: **¿cuánto llevo hecho y voy a poder?**

**El porcentaje no basta.** `ProgressBar` ya existía y ya era accesible
(`role="progressbar"` con `aria-valuenow/min/max`), pero pintaba solo "50%". Un
porcentaje no dice cuántas cosas faltan: 50% de 2 y de 200 se leen igual, y quien
organiza un evento necesita el número absoluto para decidir si falta una gestión o cien.
La barra ahora escribe "6 de 12 gestiones (50%)", y el texto llega también al lector de
pantalla por `aria-valuetext`.

**El día no decía nada de su carga.** `getHoursByDate` ya excluía las `ejecutada` —
la función existía y no la usaba nadie en `/hoy`. El panel no mostraba horas
comprometidas, ni límite, ni aviso de sobrecarga: la única señal era la cuenta atrás de
las secciones.

## Cambios

- `src/utils/taskMetrics.js` — `formatProgressCount` y `formatProgressDescription`. El
  singular y el plural llegan como parámetros en vez de derivarse recortando una letra:
  en español `gestiones` no es `gestione`, y adivinar la terminación habría puesto
  "1 de 1 gestione" en pantalla. El propio test lo detectó antes de llegar aquí.
- `src/components/ui/ProgressBar.jsx` — prop `description`. El `aria-label` se compone
  (`label: descripción`) para no perder el contexto que le pasa quien la usa
  ("Carga por horas", "Carga total"): una barra que solo dice "50%" no le dice a un
  lector de pantalla qué se está midiendo. Se añade `motion-reduce:transition-none`.
- `src/components/ui/WorkloadSummary.jsx` — pasa la descripción. Su barra mide **horas**,
  así que cuenta horas completadas sobre el total; contar tareas ahí daría dos cifras
  que no miden lo mismo.
- `src/views/HoyView.jsx` — resumen `WorkloadSummary` con la carga del día y aviso de
  sobrecarga contra el límite real del backend.
- `src/pages/HoyPage.jsx` — queda como envoltorio de 5 líneas.

## Decisiones

- **Sin endpoint nuevo.** El prompt de Sprint 4 pedía
  `GET /api/eventos/{id}/progreso`, y ese endpoint **no existe** en el backend. Se optó por
  calcularlo en cliente con `getTaskMetrics()`, que ya está escrito y probado: introducir
  ese endpoint era trabajo de backend y quedaba fuera del alcance. Los datos no viajan
  por la red, así que no hay nada que sincronizar ni que pueda quedar desactualizado.
- **El límite diario se pide al backend, no se cuenta en el cliente.** `limite_horas_diarias`
  vive en el usuario, no en el navegador. `api.getCapacity(today)` da el límite real, que
  es el mismo número con el que el backend responde 409.
- **Si la capacidad no llega, no se afirma nada.** Un fallo al pedir el límite deja el
  panel intacto y sin alerta: es información secundaria y no puede tumbar la pantalla. No
  se inventa un umbral.
- **El aviso desaparece solo.** La comparación es `>` y no `>=` porque quedarse justo en
  el límite no es estar sobrecargado: el backend lo acepta. Al completar una gestión, las
  horas no ejecutadas bajan, la cifra se recalcula y el aviso se retira sin tocarlo.
- **Las horas no se restan a mano.** `getHoursByDate` ya excluye `ejecutada`, así que el
  número baja por sí solo. Duplicar el cálculo en la vista haría que la cifra de la
  pantalla dejara de coincidir con la que usa el backend para el 409.
- **La extracción de `/hoy` se hizo antes que la funcionalidad.** `pages/HoyPage.jsx` tenía
  547 líneas de lógica, contra la convención del repo de que las páginas son envoltorios
  y la lógica vive en `views/`. Se movió primero, se verificó con `build`, y solo después
  se añadió lo nuevo: mezclar el refactor con la funcionalidad habría hecho imposible
  atribuir un fallo a una u otra.

## Verificación

- `npm run lint` → exit 0; `npm run test` → **18 archivos, 185 pruebas**; `npm run build` ✅.
- `src/views/HoyView.test.jsx` cubre el aviso de sobrecarga (aparece con 2 h y límite 1 h)
  y su retirada al completar, que es la parte que ningún test de lógica puede ver.

## Pendiente

- **Los colores literales de las vistas siguen sin migrar a tokens.** `/hoy` ya usa tokens,
  pero `EventDetailView`, `CreateEventView` y las páginas de login y registro conservan
  hex; en tema oscuro se ven a medio migrar. Agravado por esto: la barra de Progreso de
  hoy y la del detalle son el mismo componente con distinto acento, y solo una se ve bien
  en oscuro.
- `/configuracion` ya edita el límite diario; la segunda tarjeta sigue siendo un
  «Próximamente».