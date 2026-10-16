---
tipo: mejora
---

# El cambio de tema se anima en lugar de saltar

- **Fecha:** 2026-10-15
- **Área:** accesibilidad / interfaz
- **Estado:** hecha

## Descripción

El paso de tema claro a oscuro era un **salto instantáneo**: la clase `theme-changing` anulaba
todas las transiciones con `!important` justo durante el cambio, precisamente para que no
hubiera animación.

Medido, ese salto es un cambio de luminancia de **x108 sobre el 100% de la pantalla**
(`#ffffff`, L = 1.0000 → `#12191f`, L = 0.0092). Un solo cambio brusco no es un destello —
un destello es un ciclo, y aquí no hay ninguno. Pero si alguien alterna el tema varias veces
seguidas, varios cambios completos caen dentro del mismo segundo, y eso sí roza el límite de
**WCAG 2.3.1** (máx. 3 destellos por segundo). No había ninguna protección.

Ahora el cambio **se reparte en 400 ms**. El tema sigue cambiando, pero la luminancia viaja de
forma continua en vez de dar un salto.

## Cambios

- `src/index.css` — los **31 tokens de color** se registran con `@property` (`syntax:
  '<color>'`, `inherits: true`). Sin esto la transición no existe: una custom property no es
  animable por defecto y `transition: --surface` es un no-op silencioso.
- `src/index.css` — la transición vive en `:root`, no en `*`. Los tokens heredan el valor
  interpolado, así que **todo el documento se mueve en una sola pasada de estilo** en vez de
  animar cada elemento por su cuenta.
- `src/index.css` — `.theme-animating` sustituye a `.theme-changing`. La nueva clase marca
  "estamos transicionando": `<html>` conserva la transición de los tokens y los descendientes
  la anulan, porque cada elemento tiene además sus propias transiciones de hover y focus que
  harían que el cambio se viera escalonado.
- `src/index.css` — `prefers-reduced-motion: reduce` baja la transición a `0.01ms`. El tema
  **se aplica igual**: negar el cambio a quien lo pidió sería peor que saltárselo.
- `src/utils/theme.js` — `THEME_TRANSITION_MS = 400` con nombre, y el temporizador se guarda
  en una variable de módulo para que un segundo cambio cancele al primero en vez de acumular
  timers y dejar la clase pegada.
- `src/utils/theme.js` — `applyTheme` fuerza un reflow (`offsetHeight`) antes de escribir el
  atributo. Sin un valor previo con el que interpolar, el navegador resuelve el cambio de
  golpe y la transición no se ve.
- `src/providers/ThemeProvider.jsx` — `toggleTheme` ignora un clic dentro de la ventana de
  transición. El umbral es `THEME_TRANSITION_MS`, no un número aparte: si se aceptara el
  segundo clic, se solaparían dos transiciones a mitad.

## Correcciones aplicadas (2026-10-15)

- **El selector antiguo no cubría al elemento que llevaba la clase.** Era
  `.theme-changing *`, y `X *` son los **descendientes** de `X`, no `X`. La clase se ponía
  sobre `<html>`, así que `html` mismo quedaba fuera del escudo. Hoy no pasaba nada porque
  `body` ya no tiene transición de color, pero era una trampa.
- **`npm run lint` estaba roto** por el mismo patrón que se vio en la nota 023: `shell.test.jsx`
  usaba el global de Node `global`, que `env.browser` no declara, y `no-undef` lo marcaba como
  error. Corregido a `globalThis`.

## Decisiones

- **Animar los tokens y no las propiedades de cada elemento.** Transicionar
  `background-color` en `*` habría movido cada elemento por separado, con retardos distintos, y
  además habría ralentizado los hovers. Los tokens se interpolan una vez y todos los
  consumidores leen el mismo valor.
- **`inherits: true` en todos los `@property`.** Los tokens se leen como `var(--surface)` en
  descendientes; sin herencia el valor interpolado no llegaría a ellos.
- **El tope va en `toggleTheme`, no en `applyTheme`.** El servicio tiene que poder aplicar el
  tema al arrancar sin verse bloqueado por un umbral de frecuencia.
- **Se respeta `prefers-reduced-motion` acortando, no cancelando.** Es una preferencia de
  movimiento, no una prohibición de cambiar de tema.

## Verificación

- `npm run lint` → **exit 0**.
- `npm run test` → **16 archivos, 153 pruebas** en verde (148 antes).
- `npx prettier --check` y `npm run build` limpios.
- **Las pruebas nuevas se comprobaron por mutación**, porque un test que no puede fallar no
  prueba nada:
  - Quitar `clearTimeout(transitionTimer)` → falla `un segundo cambio cancela el temporizador
    del anterior`.
  - No quitar nunca la clase → fallan los 3 tests de transición.
  - Dejar el tope del provider en `false` → falla `el interruptor ignora un segundo clic
    dentro de la transición`.

## Pendiente

- **La comprobación visual no está hecha: el repositorio no tiene browser automation** (ni
  Playwright ni Puppeteer), así que los tests verifican la lógica —clase, temporizadores, tope—
  y no el render. Que la transición se vea suave en los dos temas hay que comprobarlo a mano.
- Si se añade un token de color nuevo, hay que registrarlo con `@property` **y** añadirlo a las
  dos listas de `transition` de `index.css`. Si no, ese token salta mientras el resto se mueve.
- `THEME_TRANSITION_MS` y el `400ms` del CSS están en archivos distintos: si uno cambia y el
  otro no, la clase se queda puesta o se quita antes de tiempo.
