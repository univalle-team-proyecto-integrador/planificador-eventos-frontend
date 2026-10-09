---
tipo: mejora
---

# Arregla la reprogramación y añade la marca de desfase

- **Fecha:** 2026-10-09
- **Área:** servicios, vistas, componentes de UI
- **Estado:** hecha

## Descripción

La reprogramación **no funcionaba**, y la causa no era un bug suelto: el frontend
y el backend habían implementado contratos distintos mientras el documento
puente describía un tercero, inventado.

El backend devuelve `409` con un `ProblemDetail`; el frontend esperaba un `200`
con `{ conflicto: true }`. Consecuencias:

1. **El camino feliz fallaba siempre.** El backend responde `200 SubtareaDTO`
   plana; la vista leía `respuesta.subtarea`, que era `undefined`, y
   `requireSubtaskResponse` lanzaba *"La respuesta del servidor no incluye la
   subtarea actualizada"*. Da igual las horas: siempre fallaba.
2. **`ConflictoModal` era código muerto.** El 409 hace que `request()` lance
   `ApiError` antes de llegar a `esConflicto()`, así que el modal nunca abría.
3. **El límite diario tampoco se guardaba.** `updateProfileLimit` llamaba
   `PATCH /api/users/profile`, ruta que no existe (el backend expone
   `PUT /api/users/capacity` y responde `CapacidadDTO`). El comentario *"Pendiente
   de backend"* era falso: el backend sí lo tenía, en otra ruta y otra forma.

**Por qué los 121 tests pasaban:** el mock implementaba la forma antigua, así que
los tests nunca tocaron el contrato real. Un mock que se aparta del backend hace
que la suite sea verde con la aplicación rota.

Además se agrega la marca de **postergada / adelantada**, que requiere la
`fechaObjetivoOriginal` que ahora expone el backend (mejora 032 de este repo).

## Convergencia con 9954b17 / 998cfab

Mientras se trabajaba, **`9954b17` y `998cfab` de `frontend/lead` arreglaron el
mismo bug** en paralelo: identificaron bien el 409, la `SubtareaDTO` plana y la
ruta `PUT /api/users/capacity`. Su diagnóstico del backend era correcto.

Su `normalizarConflicto409`, sin embargo, leía `horasTotalesCalculadas`,
`horasALiberar` y `horasPlanificadas`: **ninguno de esos campos existe** en la
respuesta real, que trae `horasPlanificadasTotales` y `excedente`. Ejecutando
ambas implementaciones contra el 409 capturado del backend:

```
9954b17  →  horasTotales = undefined  →  "quedaría con 0 h y tu límite es 2 h"
esta     →  horasTotales = 16, excedente = 14  →  "quedaría con 16 h ..."
```

Mostrar "0 h" es el peor resultado posible: parece un dato real. La causa de
fondo es que se probó contra la spec de OpenAPI, que no documenta el body del
409, en vez de contra la respuesta real.

Al integrar se conservaron de su trabajo lo que era único y correcto (el badge
de `PUT /api/users/capacity`, el manejo de la subtarea envuelta o suelta,
`getCapacity`) y se quedó con la lectura verificada del 409. Se corrigió
`normalizarConflicto409` para aceptar los nombres reales primero y usar
`excedente` como respaldo, y `esConflicto` ahora acepta las dos formas
(`status === 409` y el objeto normalizado).

## Cambios

- `utils/reprogramacion.js` — reescrito contra la forma real. `esConflicto`
  mira `status === 409`; `getLimiteDiario` / `getHorasTotales` leen
  `limiteDiario` y `horasPlanificadasTotales`; `getExceso` usa `excedente` del
  servidor y solo recalcula si falta. Aceptan tanto el `ApiError` como el cuerpo
  suelto.
- `services/api.js` — `updateProfileLimit` va a `PUT /api/users/capacity`; se
  añade `getCapacity`. `reprogramarSubtask` deja de pasar por `unwrapData`.
- `services/reprogramacionService.js` — `reprogramarSubtask` devuelve la
  respuesta cruda para poder distinguir 200 de 409.
- `services/mocks/reprogramacion.js` — **el mock ahora imita al backend**:
  lanza `ApiError` 409 con las claves aplanadas y devuelve la `SubtareaDTO` pelada
  en el éxito. También simula la línea base.
- `utils/taskMetrics.js` — `normalizeSubtask` lee `fechaObjetivoOriginal`;
  `getDesfase(task)` deriva `{ tipo, dias }` comparando fechas.
- `components/ui/TaskCard.jsx` — badge con `CalendarClock` y los días de desfase.
  Aparece en Hoy, Próximas y el detalle, porque las tres ya usan `TaskCard`.
- `views/EventDetailView.jsx` — éxito lee la DTO plana (combinada con la
  subtarea en pantalla para no perder `eventName`); en `catch`, un 409 abre
  `ConflictoModal`.
- `components/ui/ConflictoModal.jsx`, `views/ConfiguracionView.jsx` —
  comentarios corregidos.
- `docs/contrato-reprogramacion.md` — reescrito contra respuestas reales
  capturadas del backend, con los dos detalles que rompen la integración
  destacados y la regla de que el mock imita al backend.

## Verificación

- `npm test` → **143 pruebas, 0 fallos** (121 antes, +22; incluye las pruebas que
  trajeron `9954b17`/`998cfab` y las que fijan el cuerpo real del 409).
- `npm run lint` → 1 warning, **preexistente** (se comprobó con `git stash` que
  no lo introduce este cambio).
- `npm run build` → correcto.
- Se reprodujeron las respuestas reales del backend (200 plano, 409 aplanado)
  contra los accesores reales del frontend: `esConflicto(409)` da `true`,
  `getLimiteDiario` da 2, `getExceso` da 14, y `getDesfase` clasifica
  postergada +15d / adelantada +2d / sin marca.

## Notas

- El documento `docs/contrato-reprogramacion.md` afirmaba que *"no se usa 409"*.
  Era el origen del bug: se escribió sobre un plan, no sobre el código que se
  mergeó. Conviene contrastar el contrato con la respuesta real antes de
  escribirlo.
- `PATCH /api/users/profile` responde **405**, no 404: la ruta `/profile` existe
  pero no acepta PATCH. Un 405 es fácil de leer como "todo bien" en un log.
