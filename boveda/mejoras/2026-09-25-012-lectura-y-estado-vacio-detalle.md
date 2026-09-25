---
tipo: mejora
---

# Lectura y estado vacío del detalle de evento

- **Fecha:** 2026-09-25
- **Área:** interfaz / UX / accesibilidad
- **Estado:** hecha

## Descripción

Se reforzó el modo lectura de `/evento/:id`: la información consolidada usa un grid responsive con iconos contextuales, mientras el formulario solo aparece al activar la edición. El estado vacío de las gestiones ahora oculta la barra de progreso y ofrece directamente la acción de crear la primera gestión.

## Cambios

- `src/views/EventDetailView.jsx` — botón superior de retorno, grid estático, mapa de iconos por tipo, iconos de fecha/cliente/lugar y badges de subtareas.
- `src/components/states/EmptyState.jsx` — soporte opcional de un emoji visual accesible.
- `src/utils/eventTypeIcons.js` — diccionario reutilizable de tipos de evento.
- La barra `ProgressBar` solo se renderiza cuando existen subtareas.

## Verificación

- `npm test` ✅
- `npm run lint` ✅
- `npm run build` ✅
- `npx prettier --check` ✅
