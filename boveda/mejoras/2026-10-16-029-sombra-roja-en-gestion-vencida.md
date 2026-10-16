---
tipo: mejora
---

# La gestión vencida se sombrea de rojo

- **Fecha:** 2026-10-16
- **Área:** interfaz / accesibilidad
- **Estado:** hecha

## Descripción

El panel de hoy separa las gestiones en Vencidas, Para hoy y Próximas, pero las
vencidas se distinguían por lo mismo que las demás: el título de la sección y un badge
ámbar. La prioridad se notaba, la urgencia no.

Ahora la tarjeta vencida lleva además un **halo rojo**, visible en reposo y no solo al
pasar el mouse. Es la señal que faltaba para escanear el panel de un vistazo.

## Cambios

- `src/index.css` — `--glow-alerta` y `--shadow-card-alerta` en `:root` y en
  `[data-theme='dark']`, más la clase `.event-card--vencida` junto a `.event-card`.
- `src/components/ui/TaskCard.jsx` — añade `event-card--vencida` cuando `isOverdue` y
  deja de pasar el `--accent-glow` del evento en ese caso.
- `src/views/HoyView.test.jsx` — dos pruebas nuevas sobre el aviso de vencida.

## Decisiones

- **Solo la sombra es roja; el ámbar se queda.** Borde, fondo, icono y badge "Atrasada"
  siguen en `--warning`. Se pidió expresamente no unificar, y además el rojo ya está
  usado en el producto para lo destructivo (botón "Eliminar evento", tokens
  `--danger`): recuperarlo entero para "vencido" habría diluido esa señal. Un aviso
  que necesita atención y una acción que destruye datos no son lo mismo.
- **El halo sale del mismo mecanismo que el color del evento.** La clase redirige
  `--accent-glow` a `--glow-alerta`, y como `.event-card:hover` tiene más
  especificidad y usa `--shadow-card-hover`, el hover sale rojo sin escribir una
  segunda regla de sombra.
- **Por eso el estilo inline deja de pasar el color del evento cuando está vencida.**
  El inline gana a cualquier clase: si siguiera, el hover volvería a brillar con el
  color del evento. Hay una prueba que lo fija.
- **No se registra `--glow-alerta` con `@property` ni se añade a las listas de
  `transition`.** La regla de `AGENTS.md` es condicional ("si quieres que se anime con
  el tema"). Aquí no se quiere: es una sombra, y las sombras tampoco se animan — le pasa
  igual a `--shadow-card` y `--shadow-card-hover`, que también cambian con el tema y no
  están registradas. Al cambiar de tema el halo da un salto, como las demás sombras.
- **La sombra neutra se conserva como segunda capa** de `--shadow-card-alerta`, para que
  la tarjeta no pierda profundidad: solo gana el halo por encima.
- **El aviso en texto no se quita.** El rojo es una señal visual y la violetaría el
  color; el badge "Atrasada", el icono de aviso y el rótulo "Vencida hace N días"
  siguen ahí, así que la urgencia nunca depende solo del color (WCAG 1.4.1). Es lo que
  permite que la sombra sea lo único que se añada.

## Verificación

- `npm run lint` → exit 0; `npm run test` → **19 archivos, 199 pruebas**; `npm run build` ✅.
- Las dos pruebas nuevas comprueban lo que sí es comprobable desde vitest: que la clase
  llega solo a la tarjeta vencida y que el estilo inline del color del evento no se
  cuela en ella. El color en sí lo pone el CSS y requiere revisión visual en los dos
  temas.

## Pendiente

- **Falta la revisión visual.** Este registro no puede affirmar que el halo rojo se lea
  bien junto al ámbar de la misma tarjeta: es justo la mezcla que se eligió
  conscientemente, y si al verlo en pantalla resulta recargado, unificar a rojo es
  borrar dos líneas de `TaskCard`. Nadie lo ha mirado todavía en claro ni en oscuro.