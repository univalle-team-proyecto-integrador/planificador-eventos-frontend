---
tipo: mejora
---

# Orden de las acciones de una gestión

- **Fecha:** 2026-10-15
- **Área:** interfaz / UX
- **Estado:** hecha

## Descripción

La fila de acciones de cada gestión en `/evento/:id` tenía este orden:

```
Reprogramar → Eliminar → Editar → Completar/Reabrir
```

`Eliminar` —la única acción irreversible— quedaba **en segunda posición**, entre dos acciones
editoras. Es la posición donde más fácil se pulsa por inercia, y es la única que no se puede
deshacer.

Ahora el orden es **Editar, Completar/Reabrir, Reprogramar, Eliminar**: de la acción más
frecuente a la más destructiva.

## Cambios

- `src/views/EventDetailView.jsx` — reordenados los cuatro `<Button>` de la fila de cada
  gestión. Se conservan intactos `variant`, `TASK_ACTION_CLASS`, `disabled`, `aria-label`,
  iconos y handlers: es un cambio de posición, no de comportamiento.
- `src/views/EventDetailView.jsx` — el comentario de `TASK_ACTION_CLASS` estaba
  desactualizado y describía «editar, completar, reabrir y eliminar» como cuatro acciones
  separadas, cuando **Completar y Reabrir son el mismo botón** según el estado de la gestión.
  Ahora describe el orden y esa condición.
- `AGENTS.md` — el orden queda registrado como parte del contrato de la vista.

## Decisiones

- **Completar y Reabrir ocupan la misma posición.** Es un botón que cambia de texto e icono
  (`Check`/`Completar` frente a `Undo2`/`Reabrir`) según `subtask.state`, no dos botones. Va
  en segundo lugar, que es lo que pedía el orden de referencia.
- **No se tocó el bloque de acciones del evento.** Tiene solo *Editar evento* y *Eliminar
  evento`: no hay Completar ni Reprogramar para un evento, así que el orden de cuatro no
  aplica. Editar ya iba antes que Eliminar.
- **Sin test del orden.** La posición de un botón no es un comportamiento que justifique un
  test que se rompe con un cambio legítimo de diseño. Los tests existentes localizan «Editar»
  por `aria-label`, no por posición, así que no se ven afectados.

## Verificación

- `npm run test` → **16 archivos, 153 pruebas** en verde.
- `npm run lint` → exit 0; `npm run build` ✅; `npx prettier --check` ✅.

## Pendiente

- Con cuatro botones de `w-28` más un badge de horas y otro de estado, la fila es ancha. En
  móvil con `flex-wrap` pasan a dos líneas; no se ha revisado cómo queda.
