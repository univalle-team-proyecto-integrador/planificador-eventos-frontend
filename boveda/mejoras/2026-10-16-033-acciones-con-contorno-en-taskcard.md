---
tipo: mejora
---

# Las acciones rápidas de la tarjeta se distinguen por el borde, no por el relleno

- **Fecha:** 2026-10-16
- **Área:** interfaz / accesibilidad / consistencia visual
- **Estado:** hecha

## Descripción

Los botones rápidos de `TaskCard` (*Hecha*, *Posponer*, *Reprogramar*) se pintaban con
**relleno de color**: verde sólido, ámbar sólido y morado sólido. Tres bloques de color
encima de una tarjeta que ya tiene dos badges y un borde de acento.

Pasaron a **contorno**: fondo del tema y solo el borde con el color de la acción. El botón
se funde con la superficie y la acción sigue identificándose por el color, igual que el
resto de controles de la interfaz.

## Cambios

- `src/styles/buttons.css` — dos variantes nuevas:
  - `.btn--warning-outline` (borde ámbar). No existía ninguna de warning: *Posponer* usaba
    la variante de relleno y no había forma de darle contorno.
  - `.btn--primary-outline` (borde morado). *Reprogramar* usaba el relleno primario.
- `src/components/ui/Button.jsx` — mapeadas las dos variantes en `VARIANTS`.
- `src/components/ui/TaskCard.jsx` — *Hecha* pasa a `success-outline`, *Posponer* a
  `warning-outline` y *Reprogramar* a `primary-outline`.
- `AGENTS.md` — se documentan las nueve variantes y el criterio del token `-text` para los
  bordes.

## Decisiones

- **El borde usa el token `-text`, no el del relleno.** Medido contra `--surface-raised`:

  | Token | Claro | Oscuro |
  | --- | --- | --- |
  | `--warning` | 5.02:1 | 10.62:1 |
  | **`--warning-text`** | **7.09:1** | **12.29:1** |
  | `--primary` | 3.42:1 | 7.37:1 |
  | **`--primary-text`** | **7.06:1** | **9.26:1** |

  Los cuatro pasan el 3:1 de 1.4.11, pero `--primary` en claro queda en 3.42:1: pasa por los
  pelos y el hover lo convertiría en el borde real. Los tokens `-text` están hechos para
  leerse sobre superficie, que es exactamente lo que hace un borde.

- **Una gestión ya completada sigue en neutro, no en `success-outline`.** El botón cambia a
  "Completada" y queda deshabilitado; un borde verde en un control que no hace nada se lee
  como acción disponible.

- **"Ver evento" se queda en neutro.** No es una acción de estado, es navegación, y no
  tiene color que transmitir.

- **El hover sí se rellena**, como en las demás variantes de contorno: en reposo anticipa
  la acción con el borde, al pasar el mouse confirma con el color.

## Verificación

- `npm run lint` → **exit 0**; `npm run build` ✅; `npx prettier --check` ✅.
- `npm run test` → **200 de 201 en verde**. El fallo es
  `panel de hoy: reprogramar una gestión pospuesta` en `src/views/HoyView.test.jsx`, que
  **ya estaba roto antes de este cambio** (se comprobó con `git stash` sobre el árbol
  limpio): espera el texto "Pospuestas" y el panel ya no lo pinta.

## Pendiente

- **La comprobación visual no está hecha: no hay browser automation.** Las cifras de
  contraste están calculadas sobre los valores de los tokens, pero que el hover y el
  estado deshabilitado se vean bien en los dos temas hay que mirarlo a mano.
- El test de `HoyView` roto debería arreglarse en su propia nota, no aquí.
