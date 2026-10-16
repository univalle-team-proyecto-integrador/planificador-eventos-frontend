---
tipo: mejora
---

# Borrador automático, paginación en Hoy, fin de los destellos de tema y confirmaciones

- **Fecha:** 2026-10-15
- **Área:** interfaz / UX / accesibilidad
- **Estado:** hecha

## Commits relacionados

- `5eaa85e` (2026-10-09) — mejoras UX: auto-save del borrador, validación de capacidad
  diaria, fix de destellos de tema, paginación en Hoy y modales de confirmación.

**Reaplicado sobre `38fa9af` (2026-10-14).** El commit original no llegó nunca a `origin`;
este contenido se recuperó de la rama local y se integró sobre el estado actual del
repositorio. Ver «Nota de reaplicación» al final.

## Descripción

Cuatro problemas de uso diaria que afectaban a la misma sesión de trabajo del usuario:

1. **Perder el formulario.** Un error de red, un `⌘R` o un cierre accidental borraban todo lo
   escrito en el alta y en la edición de evento. Ahora se autoguarda.
2. **Destellos al cambiar de tema.** Los tokens de `index.css` cambian en un solo
   `data-theme`, pero cada elemento con transición anima su color por separado y la pantalla
   «parpadea» de arriba abajo.
3. **Listas largas.** El panel Hoy tenía un tope fijo de cinco y comunicaba «Mostrando 5 de
   23» sin forma de ver el resto.
4. **Salidas sin confirmar.** «Cancelar» en el alta de evento y «Cancelar» en las tres
   ediciones del detalle descartaban lo escrito sin preguntar.

## Cambios

- `src/utils/borrador.js` (**nuevo**) — persistencia en `localStorage` con la clave
  `eventflow.borradorEvento`, en el mismo estilo que `theme.js`, `rangoPreximas.js` y
  `tokenStorage.js`: `try/catch` alrededor del almacenamiento y funciones puras sin
  dependencias de React. Si no hay ningún dato válido **borra** la clave en vez de guardar un
  objeto vacío; si el JSON está corrupto, lo limpia y devuelve `null`.
- `src/views/CreateEventView.jsx` — el estado inicial se hidrata desde el borrador;
  autoguardado con debounce de 500 ms; `clearBorrador()` al crear con éxito y al confirmar
  la cancelación; `ConfirmModal` de «¿Cancelar creación?» que solo aparece si hay algo
  escrito. El `select` de tipo de evento pasa de `disabled` a `cursor-not-allowed opacity-50`:
  `disabled` sacaba el campo del orden de tabulación sin explicar por qué.
- `src/views/EventDetailView.jsx` — autoguardado del formulario de edición de evento,
  `clearBorrador()` al guardar o eliminar el evento; tres modales de confirmación de
  cancelación (editar evento, nueva gestión, editar gestión) y doble confirmación para borrar
  gestión y evento.
- `src/utils/taskMetrics.js` — `getHoursByDate(tasks, dateKey)`: horas no ejecutadas de una
  fecha, excluyendo `ejecutada`.
- `src/pages/HoyPage.jsx` — paginación por bloques de `PAGE_SIZE = 5` con botón «Ver más (N
  restantes)» por sección, como estado local de `TaskSection`.
- `src/index.css` — clase `.theme-changing` que anula transiciones y animaciones con
  `!important` mientras dura el cambio; se retira la transición de fondo y color del `body`.
- `src/utils/theme.js` — `applyTheme` añade `theme-changing` antes de cambiar `data-theme` y
  la quita 100 ms después.

## Decisiones

- **Debounce de 500 ms.** Escribir en `localStorage` en cada tecla serializa el estado
  entero en cada pulsación; 500 ms es imperceptible para el usuario y evita eso.
- **La transición se anula, no se acorta.** Meter un número más pequeño en la transición
  dejaba el mismo número de elementos animándose a la vez. La clase `!important` desactiva
  el motor entero durante el cambio.
- **`clearBorrador()` también al cancelar, no solo al guardar.** Cancelar y confirmar es
  explícito; dejar el borrador vivo convertiría la cancelación en un no-op y el formulario
  reaparecería completo en la siguiente visita.
- **La paginación es local, no del servidor.** La pantalla Hoy ya trae todas las subtareas sin
  filtrar por fecha, así que no hay nada que pedir: es cuestión de cuántas se pintan.
- **Doble confirmación para borrar.** El `ConfirmModal` ya cubría el borrado; el segundo paso
  solo aparece tras elegir borrar, para que el clic accidental más común no destruya nada.

## Correcciones aplicadas (2026-10-15)

- **`.btn--danger-dark-text` no estaba mapeada en `Button.jsx`.** La vista de detalle la usa
  para «Eliminar evento» y el CSS la define, pero `VARIANTS` no la conocía: el `||` de
  `getButtonClassName` la devolvía a `btn--neutral` y el botón se pintaba **gris en vez de
  rojo**. Registrada en `VARIANTS`.
- **Esa variante tenía `color: #000000` fijo.** Como `--surface-raised` es blanco en claro y
  `#12191f` en oscuro, en tema oscuro el texto quedaba negro sobre casi negro (≈1.1:1).
  Ahora usa `var(--text-primary)`: 17:1 en claro y 15:1 en oscuro.
- **`npm run lint` estaba roto.** `.oxlintrc.json` activa `"no-undef": "error"` con
  `env.browser`, y `shell.test.jsx` usaba el global de Node `global`, que ese entorno no
  declara: el comando salía con `exit 1`. Se cambió a `globalThis`, que existe en navegador
  y en Node. Se ajustó el test y **no** la regla: `no-undef` acababa de encontrar una
  referencia rota, que es justo lo que se quería.

## Nota de reaplicación (2026-10-15)

Este trabajo se había hecho sobre `760bb0c`, en una línea local que nunca se subió. Mientras
estaba pendiente, el equipo subió a `main` 18 commits que rehacieron partes del sistema de
botones y **mantuvieron** la reprogramación con su `ConflictoModal`. Al integrar, este
contenido se reaplicó sobre `38fa9af` y se descartaron tres partes suyas:

- **`utils/capacity.js` y la validación `validateDailyHours`** — el archivo leía el límite de
  `localStorage`, mientras el backend ya expone la capacidad real y el cliente la pide por
  `PUT /api/users/capacity`. Validar contra un valor local habría contradicho al servidor.
- **`getHoursByDate` y el consumo en `EventDetailView`** — el 409 real del backend ya
  produce el `ConflictoModal` con las cifras oficiales; duplicar el cálculo en el cliente
  daría dos fuentes de verdad.
- **Los tests de esa validación** — por la misma razón.

El resto del commit (borrador, paginación, anti-destello, confirmaciones) no tocaba nada de
lo que el equipo rehízo y se conservó íntegro.

## Verificación

- `npm run lint` → **exit 0**. Queda un único warning (`react/set-state-in-effect` en el
  efecto que abre el modal de la regla), preexistente.
- `npm run test` → **16 archivos, 148 pruebas** en verde.
- `npm run build` ✅ y `npx prettier --check` ✅ sobre los diez archivos tocados.

## Pendiente

- El autoguardado no distingue dos pestañas abiertas del mismo formulario: la última que
  escribe gana. Resolverlo exigiría `storage` o un `BroadcastChannel`.
- La doble confirmación no está cubierta por el test de render del shell; es el flujo más
  destructivo de la vista y merece uno propio.
