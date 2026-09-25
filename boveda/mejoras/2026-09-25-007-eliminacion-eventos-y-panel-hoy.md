---
tipo: mejora
---

# Eliminación de eventos y corrección del panel Hoy

- **Fecha:** 2026-09-25
- **Área:** interfaz / UX / integración
- **Estado:** hecha

## Descripción

Se agregó la eliminación segura de eventos desde su detalle y se conectó la vista `/hoy` con la consulta de gestiones no ejecutadas cuya fecha objetivo corresponde al día local del organizador. El panel ahora muestra la gestión, el evento, la fecha objetivo, las horas y el estado, y permite abrir el detalle del evento.

## Cambios

- `src/services/api.js` — se agregaron `deleteEvent` y `listTodaySubtasks`.
- `src/views/EventDetailView.jsx` — se agregó el botón de eliminación de evento, su `ConfirmModal`, manejo de error y redirección al progreso.
- `src/pages/HoyPage.jsx` — se reemplazó el estado vacío estático por una consulta con estados de carga, error, vacío y listado de tareas.
- `README.md`, `ARCHITECTURE.md`, `PRD.md` y `docs/guia-microcopy.md` — se documentaron el endpoint, el flujo y los textos nuevos.

## Decisiones

- La eliminación de evento solo se ejecuta después de confirmar en el modal existente.
- El endpoint de hoy excluye las gestiones `ejecutada` y mantiene `pendiente` y `pospuesta`, de acuerdo con la consulta JPQL existente.
- La fecha se envía explícitamente desde el navegador para evitar depender de la zona horaria del servidor.

## Verificación

- `npm run lint` ✅
- `npm run build` ✅
- `npx prettier --check src/pages/HoyPage.jsx src/services/api.js src/views/EventDetailView.jsx` ✅ después del formateo de `HoyPage.jsx`.
- La persistencia y la consulta contra el backend real siguen requiriendo una prueba end-to-end en el entorno configurado.
