---
tipo: documento-ux
---

# Decisiones de UX y UI

## Propósito

Estas decisiones registran los criterios visuales y de interacción utilizados en el frontend del Planificador de Eventos. La interfaz debe ser clara, accesible y coherente para organizadores independientes que necesitan completar tareas logístico con rapidez.

## Decisiones activas

### D-001 — Layout persistente

El encabezado y la navegación permanecen visibles mientras cambia el contenido de la aplicación. Las rutas se organizan bajo un `Layout` con `Outlet` para evitar duplicar la estructura general.

**Consecuencia:** cada pantalla solo debe encargarse de su contenido principal.

### D-002 — Botón multivariante

Las acciones usan `Button` con variantes `primary`, `neutral` y `danger`. Las variantes expresan intención: acción principal, acción secundaria y acción destructiva.

**Regla:** no usar botones destructivos sin confirmación y sin una consecuencia visible para la persona usuaria.

### D-003 — Estados visuales explícitos

Cada flujo que puede iniciar, fallar o no tener datos debe comunicar su estado:

- `SimulatedLoader` comunica el inicio de carga.
- `EmptyState` explica qué falta y ofrece una acción siguiente.
- `ErrorState` explica qué ocurrió y ofrece un reintento.

### D-004 — Feedback de formularios

Los mensajes de validación deben responder dos preguntas: **qué pasó** y **cómo corregirlo**. Los campos se asocian mediante `label`, `id`, `aria-invalid` y `aria-describedby`.

### D-005 — Acciones reversibles y destructivas

Marcar una subtarea como completada es una acción inmediata y reversible. Eliminar una subtarea requiere un modal de confirmación con foco controlado, cierre mediante `Escape` y restauración del foco al elemento que lo abrió.

### D-006 — Integración por API

El frontend no debe inventar un contrato de datos. Los nombres de campos y los tipos se alinean con los DTO del backend. La URL base se configura mediante `VITE_API_URL` y la autenticación temporal se documenta mediante `VITE_USER_ID`.

## Revisión

Este documento debe actualizarse cuando cambien las rutas, los estados globales o el contrato de la API.
