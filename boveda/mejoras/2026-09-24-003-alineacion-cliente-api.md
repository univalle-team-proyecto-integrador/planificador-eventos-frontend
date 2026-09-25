---
tipo: mejora
---

# Alineación inicial del cliente con la API

- **Fecha:** 2026-09-24
- **Área:** integración / API
- **Estado:** hecha

## Descripción

Se conectó el cliente HTTP del frontend con el contrato de eventos y subtareas del backend, usando el servicio centralizado y mensajes de error basados en `ProblemDetail`.

## Cambios

- `src/services/api.js` — métodos para eventos, subtareas, actualización de estado y eliminación.
- `src/views/EventDetailView.jsx` — lectura de eventos y subtareas, edición de evento y mutaciones.
- `src/pages/ProgresoPage.jsx` — consulta de eventos y cálculo de progreso.
- `README.md` y `ARCHITECTURE.md` — contrato HTTP y configuración de `VITE_API_URL`/`VITE_USER_ID`.

## Commits relacionados

- `56b359a` — alinea el cliente con la API de eventos.

## Verificación

- `npm run lint` ✅
- `npm run build` ✅
- La persistencia real queda pendiente de validar contra el backend desplegado.
