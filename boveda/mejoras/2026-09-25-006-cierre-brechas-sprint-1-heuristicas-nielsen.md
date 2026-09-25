---
tipo: mejora
---

# Cierre de brechas Sprint 1: heurísticas de Nielsen y actualizaciones confirmadas

- **Fecha:** 2026-09-25
- **Área:** UX / documentación
- **Estado:** hecha

## Descripción

Para cumplir la tarea SCRUM-1-UX-2 (bitácora de decisiones justificadas bajo heurísticas de Nielsen) se añadió un anexo que mapea cada decisión de UX a las 10 heurísticas de Jakob Nielsen. Además, para satisfacer SCRUM-9-FE-1 la edición de subtareas se documentó como «confirmada por el servidor» (no optimista), alineada con la arquitectura existente.

## Cambios

- `docs/decisiones-ux.md` — nueva decisión **D-007 «Actualizaciones confirmadas por el servidor»** (justifica el no-optimismo) y **Anexo A «Mapeo a las heurísticas de Nielsen»** con la tabla decisión → heurística y el detalle por heurística.
- `boveda/mejoras/README.md` — fila 006.
- `boveda/lienzo-maestro.canvas` — nodo enlazado.

## Decisiones

- Se mantiene la actualización tras respuesta exitosa del backend; los toasts y el modal de error aportan el feedback inmediato.
- El backend valida de forma estricta (horas > 0, estados permitidos, límite diario), por lo que un optimismo real exigiría duplicar esas reglas en el cliente.

## Verificación

- Revisión de consistencia del anexo con las decisiones D-001..D-007 y con `DESIGN_SYSTEM.md` (§5.6 y §5.7).
- No requiere cambios de código: las vistas ya implementan los patrones documentados.