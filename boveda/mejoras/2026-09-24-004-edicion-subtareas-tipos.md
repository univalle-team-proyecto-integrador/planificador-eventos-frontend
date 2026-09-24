---
tipo: mejora
---

# Edición de subtareas y catálogo de tipos

- **Fecha:** 2026-09-24
- **Área:** interfaz / integración / accesibilidad
- **Estado:** hecha

## Descripción

Se completó la edición de subtareas y se eliminó la dependencia de IDs de tipos hardcodeados. Las mutaciones solo actualizan la interfaz después de recibir un DTO persistido por el servidor.

## Cambios

- `src/services/api.js` — `GET /api/tipos-evento` y `PUT /api/subtareas/{id}`.
- `src/views/CreateEventView.jsx` — carga dinámica del catálogo y estados de carga/error.
- `src/views/EventDetailView.jsx` — edición de nombre, fecha y horas; validación de fechas; respuesta obligatoria del servidor.
- `AGENTS.md`, `ARCHITECTURE.md`, `PRD.md` y `README.md` — contrato y criterios actualizados.

## Commits relacionados

- `1142e25` — completa la edición de subtareas y tipos.

## Verificación

- `npm run lint` ✅
- `npm run build` ✅
- El flujo E2E queda pendiente hasta que Render y Vercel apunten al backend correcto.
