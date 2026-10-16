---
tipo: mejora
---

# La gestión vencida se pinta de rojo, no solo se rodea

- **Fecha:** 2026-10-16
- **Área:** interfaz / accesibilidad
- **Estado:** hecha

## Descripción

El anillo rojo de la mejora 029 y el aviso por fecha de la 030 no terminaban de
comunicar. La tarjeta vencida pasa ahora a **fondo rojo** además de llevar el anillo, para que
se lea de un vistazo sin depender de un contorno de 3px.

El color pedido fue `#E3566B`, pero **no se puede usar plano**: con él, tres de los cuatro
textos de la tarjeta quedan por debajo de AA.

## Cambios

- `src/index.css` — token `--alerta-fondo: #e3566b` en `:root`, publicado como
  `--color-alerta-fondo` en `@theme inline`. `--ring-alerta` de claro pasa de `#ef4444` a
  `#dc2626`.
- `src/components/ui/TaskCard.jsx` — la vencida gana `bg-alerta-fondo/30`; la fecha sube de
  `text-muted-text` a `text-secondary-text`; desaparece el tinte ámbar `bg-warning-soft/50`.
- `src/views/HoyView.test.jsx` — las dos pruebas del aviso se actualizan al fondo rojo.

## Decisiones

- **El fondo va al 30%, no plano.** Medido: `#E3566B` al 100% deja la fecha en **1.40:1**, el
  nombre del evento en 1.95:1 y el badge en 1.96:1. Al 30% el peor texto queda en 4.88:1
  (claro) y 4.73:1 (oscuro). El 30% es además el tinte más fuerte que pasa AA en tema oscuro:
  al 35% cae a 4.36:1.
- **La fecha sube de tono solo en la tarjeta roja.** `--text-muted` sobre el tinte queda en
  3.9:1 y no pasa; con `--text-secondary` sube a 4.6:1. En el resto de tarjetas no cambia
  nada, para no alterar el gris que ya se usa en toda la app.
- **El anillo se oscureció a `#dc2626`.** Con la tarjeta ya rosada, `#ef4444` quedaba en
  **2.60:1 contra la propia tarjeta** y fallaba 1.4.11. `#dc2626` da 3.34:1 contra la tarjeta
  y 4.45:1 contra la página. El oscuro (`#f87171`) aguanta bien en los dos lados y no se toca.
- **El tinte ámbar desaparece.** Dos fondos de aviso a la vez no significan nada y el rojo es
  el que se pidió. `isOverdue` se queda únicamente con el badge "Atrasada", que sí aporta
  información: una pospuesta vencida lleva el fondo rojo pero no el badge, porque no está en
  el grupo de vencidas.
- **Un solo valor de token para los dos temas.** El tinte se mezcla con la superficie de
  cada tema, así que el mismo `#e3566b` al 30% da resultados distintos y válidos en cada uno;
  no hace falta redefinirlo en `[data-theme='dark']`.
- **El aviso en texto sigue ahí.** El fondo no puede ser la única señal: badge "Atrasada",
  icono de aviso y rótulo de días continúan (WCAG 1.4.1).

## Verificación

- `npm run lint` → exit 0; `npm run test` → **19 archivos, 200 pruebas**; `npm run build` ✅.
- Comprobado en el CSS compilado que `bg-alerta-fondo/30` se emite como
  `color-mix(in oklab, var(--alerta-fondo) 30%, transparent)` dentro de `@supports`. La
  regla que aparece antes es el fallback para navegadores sin `color-mix`, que Tailwind
  genera para toda opacidad de la app.

## Pendiente

- **Sigue sin resolverse por qué el anillo no se veía en producción** antes de este cambio.
  El código estaba desplegado y correcto, y las pruebas lo verificaban, así que la causa
  queda fuera del repositorio: caché del navegador o del `index.html` de Vercel. Con el
  fondo rojo el síntoma deja de depender de un contorno, pero conviene confirmar que quien
  lo vea tiene la última versión.
- La apertura de una pospuesta hacia atrás sigue rota (botón "Completar" en vez de
  "Reabrir"), y la UI sigue sin permitir crear una gestión con fecha pasada.