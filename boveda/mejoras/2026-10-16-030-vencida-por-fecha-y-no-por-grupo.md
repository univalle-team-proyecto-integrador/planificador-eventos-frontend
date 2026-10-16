---
tipo: mejora
---

# El aviso de vencida depende de la fecha, no del grupo

- **Fecha:** 2026-10-16
- **Área:** interfaz / accesibilidad
- **Estado:** hecha

## Descripción

El anillo rojo de la mejora 029 se ataba a `isOverdue`, que es un booleano de
**sección**: solo lo recibían las tarjetas del grupo "Gestiones vencidas". El resultado fue que
una gestión pospuesta con fecha de ayer no mostraba nada, y era el caso más claro de todos:
está vencida, se nota en su propio rótulo ("Vencida hace 1 día") y no tenía aviso.

La causa es conceptual: **"vencida" es una fecha, no un lugar**. Con un solo booleano no se
podían expresar dos cosas distintas que hasta entonces iban juntas.

## Cambios

- `src/utils/taskMetrics.js` — `esVencida(task, today)`, que compara solo fechas. No mira
  el estado: una pospuesta no compromete horas, pero sí está atrasada, y ese es el aviso
  que hace falta.
- `src/components/ui/TaskCard.jsx` — prop nueva `esVencida` (dibuja el anillo rojo), separada
  de `isOverdue` (tinte ámbar y badge "Atrasada").
- `src/views/HoyView.jsx` — `TaskSection` recibe `esVencida` como predicado por gestión en
  lugar de un booleano, y se les pasa a los cuatro grupos, Pospuestas incluido.
- `src/views/HoyView.test.jsx` — prueba del caso que fallaba y `renderHoy` parametrizado.

## Decisiones

- **El aviso se pasa a los cuatro grupos.** Pospuestas, Para hoy y Próximas lo reciben
  también; en la práctica solo lo activan las fechas ya pasadas. Pasarlo a todos evita
  tener que recordar añadirlo cada vez que aparece un grupo nuevo.
- **`esVencida` es un predicado y no un booleano de sección** porque dentro de un mismo
  grupo puede variar: en Pospuestas unas tienen la fecha pasada y otras no.
- **`isOverdue` no se tocó.** El tinte ámbar y el badge "Atrasada" siguen siendo propios
  del grupo de vencidas. Una pospuesta con fecha pasada gana el anillo rojo pero no un
  badge "Atrasada" que antes no tenía: atar el ámbar a la fecha habría cambiado una
  pantalla que nadie pidió cambiar.
- **El borde ámbar sigue sin volver.** Con el anillo presente, un `border-warning` de 1px
  queda pegado al rojo y se ve como dos contornos. El anillo sustituye ese papel de
  contorno.
- **Los dos temas siguen igual**: `--ring-alerta` es `#ef4444` en claro (3.47:1) y
  `#f87171` en oscuro (5.05:1), y los compuestos se declaran una sola vez en `:root`
  apuntando a ese token. No hubo que tocar nada de color en este cambio.

## Verificación

- `npm run lint` → exit 0; `npm run test` → **19 archivos, 200 pruebas**; `npm run build` ✅.
- La prueba nueva monta exactamente el caso reportado: una gestión `pospuesta` con fecha
  de ayer en el grupo Pospuestas, y verifica que lleva `event-card--vencida` y **no** el
  tinte ámbar del grupo de vencidas.
- Comprobado en el CSS compilado que los dos temas siguen declarando su `--ring-alerta`.

## Pendiente

- **La apertura de una pospuesta hacia atrás sigue rota.** En `/evento/:id`, una gestión
  pospuesta muestra el botón "Completar" porque el código solo mira si el estado es
  `ejecutada` (`EventDetailView.jsx`), y `handleToggleSubtask` la pasaría a `ejecutada` en
  vez de a `pendiente`. Desde la interfaz no hay forma de devolver una pospuesta al plan
  sin reprogramarla a una fecha futura. No es de este Sprint y no se ha tocado.
- **La UI sigue sin permitir crear una gestión con fecha pasada** (`min={getToday()}` en
  los tres inputs de fecha). Solo se puede comprobar el caso "vencida" con una gestión
  creada días atrás.