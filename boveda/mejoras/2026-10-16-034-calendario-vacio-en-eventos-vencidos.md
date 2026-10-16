---
tipo: mejora
---

# El calendario de fecha límite se quedaba vacío en los eventos ya vencidos

- **Fecha:** 2026-10-16
- **Área:** interfaz / UX / accesibilidad
- **Estado:** hecha

## Descripción

Al abrir una gestión de un evento **cuya fecha ya había pasado**, el selector de «Fecha
límite» no ofrecía **ningún día**: el calendario nativo aparecía sin nada seleccionable y
el campo quedaba inutilizable.

Es justo el caso más habitual en la vista `/hoy`, donde casi todas las gestionadas son de
días anteriores.

## La causa

El input combinaba dos restricciones que se anulaban entre sí:

```jsx
<input type="date" min={getToday()} max={fechaMaxGestion || undefined} />
```

`min` es siempre hoy, y `max` era la fecha del evento. Cuando el evento ya pasó, `max`
quedaba **por detrás** de `min`:

```
min = 2026-10-16   (hoy)
max = 2026-10-10   (evento vencido)

rango seleccionable: 0 días
```

El navegador no dibuja el rango inverso: simplemente no ofrece nada. La fecha se podía
escribir a mano, pero el selector —que es como se usa el campo — no servía.

El comentario del código daba por hecho lo contrario: «El `max` del input deja el calendario
del navegador limitado», sin considerar que el límite podía quedar antes del `min`.

## Cambios

- `src/utils/dateValidation.js` — nueva función pura `maxGestionDate(fechaEvento, hoy)`:
  devuelve el día del evento, o `null` si ese tope dejaría el calendario vacío.
- `src/views/EventDetailView.jsx` — `fechaMaxGestion` usa la función. Cubre los **dos**
  campos de fecha límite: el de alta (`subtask-date`) y el de edición
  (`edit-subtask-date`), que comparten la misma variable.
- `src/views/EventDetailView.jsx` — `capGestionDate` aplica el mismo criterio, para que la
  fecha escrita a mano tampoco se recorte contra un tope inválido.
- `src/views/EventDetailView.jsx` — el texto de ayuda menciona el tope cuando existe:
  «Selecciona hoy o una fecha futura, hasta el día del evento (2026-11-20)».
- `src/utils/dateValidation.test.js` — 5 pruebas nuevas, incluida una que comprueba la
  **propiedad** del arreglo: para cualquier fecha de evento, el rango entre hoy y el tope
  tiene al menos un día seleccionable.

## Decisiones

- **Se corta el tope, no el `min`.** La alternativa era dejar abrir fechas pasadas, y eso
  choca con la regla del producto y con `isDateInPast`. Perder el tope es menos dañino que
  perder el campo: el usuario puede Reprogramar la gestión a otra fecha, pero no puede
  elegir un día si no hay días.

- **La lógica sale del componente.** `maxGestionDate` vive en `dateValidation.js` con
  `getToday` e `isDateInPast`, que es donde ya vive la lógica de fechas. En el componente
  eran tres líneas dentro de un `useMemo` de un archivo de más de 2.000 líneas, sin forma
  de probarlas.

- **El texto de ayuda pasa a ser variable.** Antes decía «Selecciona hoy o una fecha
  futura» y no mencionaba el tope. Ahora lo nombra solo cuando existe, que es cuando
  aplica.

## Verificación

- `npm run lint` → **exit 0**; `npm run build` ✅; `npx prettier --check` ✅.
- `npm run test` → **205 de 206 en verde** (201 antes).
- **Las pruebas nuevas se comprobaron por mutación**: devolver siempre la fecha del
  evento, sin mirar si ya pasó, hace fallar `no acota cuando el evento ya pasó` y
  `el rango resultante siempre tiene al menos un día seleccionable`. Un test que no puede
  fallar no protege nada.

## Pendiente

- El fallo de `src/views/HoyView.test.jsx` («reprogramar una gestión pospuesta», espera el
  texto «Pospuestas») **sigue roto**. No lo introdujo este cambio —se verificó con
  `git stash` sobre el árbol limpio— y debería arreglarse en su propia nota.
- Falta comprobar el campo a mano en un evento vencido: los tests cubren la regla, no el
  render del calendario nativo.
