---
tipo: mejora
---

# El sistema de botones pasa a variables CSS por tema

- **Fecha:** 2026-10-15
- **Área:** interfaz / accesibilidad / consistencia visual
- **Estado:** hecha

## Commits relacionados

- `c31d424`, `2a5ee30` (2026-10-09) — sistema de botones en CSS puro, unificado en
  variables por tema.
- `50640aa`, `f047783`, `e2c4793` (2026-10-13) — botones dirigidos por variables y foco en
  `@layer base`; hover rojo fuerte con texto negro; se quita el relleno en reposo del botón
  de peligro.

Seis commits en dos tandas, del 9 y del 13 de octubre, todos sobre el mismo archivo de
estilos. Ninguno estaba registrado.

## Descripción

Las variantes de `Button` se armaban con utilidades de Tailwind dentro del propio
componente. Funcionaba en claro, pero en oscuro obligaba a duplicar clases o a introducir
variantes `dark:` justo en el archivo donde menos corresponden.

Los colores del producto **ya vivían como tokens semánticos** en `src/index.css`, así que el
sistema de botones podía consumir esos mismos tokens y no inventar una segunda fuente de
verdad. El resultado es `src/styles/buttons.css`: una base `.btn` y una clase `.btn--*` por
variante, con los colores tomados de `index.css`, resueltos por `data-theme` sin duplicar
nada por tema.

## Cambios

- `src/styles/buttons.css` — base `.btn` con la reacción de agarre (`cursor-pointer`,
  elevación al hover, hundido al presionar) y una clase por variante: `.btn--primary`,
  `.btn--success`, `.btn--danger`, `.btn--neutral` y las de contorno.
- `src/main.jsx` — el CSS se carga una sola vez.
- `src/components/ui/Button.jsx` — deja de construir variantes con utilidades: **solo
  traduce `variant` a la clase `.btn--*`**.
- `src/components/ui/ButtonCss.jsx` — eliminado; era la primera implementación y quedó
  sustituida.
- `src/views/ConfiguracionView.jsx` — la vista previa del sistema de botones usó `Button`
  mientras vivió, y se retiró después (`a468fcd`) al quedar ya integrado en el producto.
- `examples/button-system.html` — ejemplo autocontenido para revisar el sistema sin levantar
  la app.
- `AGENTS.md` — documenta que el sistema vive en `buttons.css` y que el componente no lleva
  colores por variante.

## Decisiones

- **El `:focus-visible` del sistema se mueve a `@layer base`.** El anillo global de
  `index.css` es sin capa y, por precedencia, le ganaba a cualquier regla dentro de
  `@layer components`. Sacándolo de la capa, el anillo de cada variante manda sin tener que
  subir especificidad con `!important` en todas partes.
- **`.btn--danger` no se rellena de color en reposo.** `--danger` es blanco en claro y un rojo
  apagado en oscuro: un botón destructivo macizo dominaba la pantalla. El borde y el texto
  llevan el rojo y el hover baja a `--danger-soft`.
- **El borde neutro usa `--text-muted` y no `--border-strong`.** Este último se queda en
  1.47:1 sobre la superficie, y un borde así es justo el caso que 1.4.11 marca: el borde es
  lo único que identifica el control.
- **`danger-dark-text` nació de una necesidad real:** el botón de eliminar evento debe verse
  sin dominar. No lleva relleno; lleva borde rojo y texto de alto contraste.

## Correcciones aplicadas (2026-10-15)

- **`danger-dark-text` nunca se registró en `Button.jsx`.** El CSS la definía y
  `EventDetailView` la usaba para «Eliminar evento», pero `VARIANTS` no la conocía: el `||`
  de `getButtonClassName` la devolvía a `btn--neutral` y el botón se pintaba **gris en vez de
  rojo**. Cinco commits tocando este archivo y la variante se quedó fuera del mapa.
- **Su color era `#000000` fijo.** Como `--surface-raised` es blanco en claro y `#12191f` en
  oscuro, en tema oscuro el texto quedaba negro sobre casi negro (≈1.1:1). Ahora usa
  `var(--text-primary)`: 17:1 en claro y 15:1 en oscuro.

Ambas correcciones van con el registro de la variante en `AGENTS.md`.

## Verificación

- `npm run test` → **148 pruebas** en verde.
- `npm run lint` → exit 0; `npm run build` ✅.
- Contraste de `.btn--danger-dark-text` medido en los dos temas tras la corrección.

## Pendiente

- **`DESIGN_SYSTEM.md` sigue describiendo los «tokens» como nombres mapeados a clases de
  Tailwind por defecto** (`blue-700`…). Ya no es así: manda la sección «Color y tema» de
  `AGENTS.md`. Ese capítulo está desactualizado y es la referencia que contradice al código.
- Las vistas de `src/views/` (salvo login y registro) siguen con colores literales, así que
  en tema oscuro se ven a medio migrar.
- Auditar los contrastes del sistema de botones con axe una vez que las vistas estén
  migradas.
