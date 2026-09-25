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

### D-007 — Actualizaciones confirmadas por el servidor

Las mutaciones (crear, editar, eliminar, cambiar estado) no se aplican de forma optimista en la interfaz: el estado local solo se actualiza después de que el backend responde con éxito. Si la petición falla, se muestra un mensaje de error y el estado previo permanece.

**Justificación:** el backend valida campos y estados de forma estricta (horas > 0, estados permitidos, límite diario), por lo que un cambio optimista exigiría replicar esa validación en el cliente y revertir ante un rechazo. La edición en línea ya da intervención directa, y los toasts y el modal de error aportan el feedback inmediato. Esto evita estados locales inconsistentes con la fuente de datos.

## Revisión

Este documento debe actualizarse cuando cambien las rutas, los estados globales o el contrato de la API.

## Anexo A — Mapeo a las heurísticas de Nielsen

Las decisiones anteriores se justifican bajo las 10 heurísticas de usabilidad de Jakob Nielsen. Mapa de decisión → heurística:

| Decisión | Heurística de Nielsen |
| --- | --- |
| D-003 — Estados visuales explícitos | 1. Visibilidad del estado del sistema |
| D-002 — Botón multivariante | 4. Consistencia y estándares |
| D-005 — Acciones reversibles y destructivas | 5. Prevención de errores; 3. Control y libertad del usuario |
| D-004 — Feedback de formularios | 9. Ayuda a reconocer, diagnosticar y recuperarse de los errores |
| D-001 — Layout persistente | 6. Reconocimiento antes que recuerdo |
| D-006 / D-007 — Contrato API y actualizaciones confirmadas | 4. Consistencia y estándares; 10. Ayuda y documentación |
| Toasts y `ErrorModal` (DESIGN_SYSTEM §5.6 y §5.7) | 1. Visibilidad del estado del sistema; 9. Reconocer y recuperarse de errores |

Detalle por heurística:

1. **Visibilidad del estado del sistema:** `SimulatedLoader`, `EmptyState`, `ErrorState` y los toasts comunican en todo momento en qué punto está cada flujo.
2. **Correspondencia con el mundo real:** la terminología de los mensajes ("qué pasó + cómo corregirlo") usa frases cotidianas, no técnicas.
3. **Control y libertad del usuario:** marcar/desmarcar una subtarea es reversible y las acciones destructivas exigen confirmación explícita.
4. **Consistencia y estándares:** `Button` con variantes fijas (`primary`, `neutral`, `danger`) y patrones repetibles en todos los formularios.
5. **Prevención de errores:** validación en vivo de horas y fechas, y `ConfirmModal` antes de acciones destructivas.
6. **Reconocimiento antes que recuerdo:** el encabezado persistente mantiene el contexto en cada pantalla.
7. **Flexibilidad y eficiencia de uso:** edición en línea de subtareas sin pasos intermedios.
8. **Estética y diseño minimalista:** el contenido relevante domina cada pantalla sobre el adorno.
9. **Ayudar a reconocer, diagnosticar y recuperarse de los errores:** mensajes de validación con causa y corrección, asociados con `aria-invalid` y `aria-describedby`.
10. **Ayuda y documentación:** la guía de microcopy y este anexo sirven de referencia para nuevos flujos.
