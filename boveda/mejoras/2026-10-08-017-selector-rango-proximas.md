---
tipo: mejora
---

# Selector de rango para el grupo Próximas del panel Hoy

- **Fecha:** 2026-10-08
- **Área:** interfaz / UX
- **Estado:** hecha

## Descripción

El panel Hoy tenía el número de días de "Próximas" fijo en el código: `DEFAULT_UPCOMING_DAYS = 7`
en `taskMetrics.js`, y `HoyPage` llamaba a `classifyTasksByDate` sin argumentos, así que siempre
usaba ese 7. No había forma de planificar más allá de una semana sin tocar código.

Ahora hay un selector **"Mostrar próximos"** con 7, 14 y 30 días. Cambiarlo reagrupa al
instante, sin recargar la página, y la preferencia se recuerda entre visitas.

## Cambios

- `src/utils/taskMetrics.js` — se agregó `UPCOMING_RANGES`, que empareja cada rango con su
  propio tope (7→5, 14→8, 30→15). `DEFAULT_UPCOMING_DAYS` y `DEFAULT_TASK_LIMIT` se derivan de
  la primera opción para no dejar dos fuentes de verdad. Se agregó `rangoDeDias`, que devuelve
  la opción de un número de días o la predeterminada si el valor no existe.
- `src/utils/taskMetrics.js` — `classifyTasksByDate` cambió su parámetro `upcomingDays` por
  `days`, para que la opción de `UPCOMING_RANGES` se pueda pasar tal cual.
- `src/utils/rangoPreximas.js` (nuevo) — lectura y escritura de la preferencia en
  `localStorage`, en el mismo estilo que `theme.js` y `tokenStorage.js`, con la misma clave
  `eventflow.*` y el mismo manejo de almacenamiento bloqueado.
- `src/pages/HoyPage.jsx` — estado del rango inicializado desde `localStorage`, selector junto
  a "Ver calendario", y `groups` pasando la opción completa.
- `src/pages/HoyPage.jsx` — la descripción de la sección Próximas pasó de texto fijo
  ("Lo que viene en los próximos siete días") a dinámica, y el modal de la regla de orden
  menciona el selector.
- `src/utils/taskMetrics.test.js` — 5 pruebas nuevas.
- `src/utils/rangoPreximas.test.js` (nuevo) — 5 pruebas de la persistencia.

## Decisiones

- **Solo frontend.** El enunciado original suponía que el backend estaba limitado a 7 días y
  había que abrirlo. No era así: el 7 vivía en el cliente y la pantalla Hoy trae *todas* las
  subtareas sin filtrar por fecha (`listEvents` + `getSubtasks` por evento). No hubo que tocar
  ninguna ruta. `GET /api/subtareas/hoy/agrupado` ya acepta `fecha`, pero el frontend no lo
  consume y usa un `plusDays(30)` fijo: queda fuera de alcance.
- **El tope escala con el rango.** Con 7 días un tope de 5 quita ruido; con 30 escondería casi
  todo lo que el usuario pidió ver al ampliar. Un tope fijo hubiera hecho inútil la ampliación,
  y quitarlo del todo habría hecho la pantalla muy larga. 7→5, 14→8, 30→15.
- **Rango y tope viajan juntos** en una sola opción, para que no se puedan desincronizar.
- **Se recuerda en `localStorage`:** recargar no devuelve al usuario a 7 días si estaba
  consultando 30. Un valor guardado que ya no exista en `UPCOMING_RANGES` se descarta, porque
  las opciones pueden cambiar entre despliegues.
- **Selector nativo `<select>`** con label visible: teclado y lector de pantalla sin código
  extra, y sin inventar un componente nuevo.
- **Solo en el panel Hoy.** `EventDetailView` conserva su comportamiento.
- El nombre del parámetro pasó de `upcomingDays` a `days` porque, al pasar el objeto de rango
  tal cual, `days` era el nombre que ya tenía. Con `upcomingDays` el rango se ignoraba en
  silencio y el agrupado se quedaba en 7: un fallo que no da error, solo menos datos de los
  pedidos.

## Verificación

- `npm test` ✅ — 98 pruebas en verde (93 antes).
- `npm run build` ✅.
- `npx prettier --check` ✅ sobre los cinco archivos tocados.
- `npm run lint` ✅ — queda un único warning (`react/set-state-in-effect` en el efecto que
  abre el modal de la regla) que ya existía antes de este cambio.

## Pendiente

- **`HoyPage` hace una petición por evento** (`listEvents` y luego `getSubtasks` por cada uno).
  Con 30 días llega más volumen de datos al cliente. No se tocó aquí, pero queda como deuda.