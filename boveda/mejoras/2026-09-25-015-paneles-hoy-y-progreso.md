---
tipo: mejora
---

# Paneles de Hoy y Progreso

- **Fecha:** 2026-09-25
- **Área:** UX / métricas / seguimiento
- **Estado:** hecha

## Descripción

Se amplió la panelización existente sin cambiar las rutas ni el diseño general. `Hoy` ahora muestra el resumen del día, tareas atrasadas, tareas de hoy y tareas próximas. `Progreso` muestra un resumen global basado en horas y el detalle horario de cada evento. El detalle de evento incorpora la misma carga de trabajo.

## Decisiones

- Las tareas de hoy incluyen `pendiente` y `pospuesta`.
- Las atrasadas son tareas no ejecutadas con fecha anterior a hoy.
- Las próximas abarcan mañana y los siguientes siete días.
- Las listas de Hoy muestran máximo cinco tareas y comunican el total restante.
- El progreso principal se calcula con horas; el conteo de tareas es secundario.
- `pospuesta` cuenta como horas restantes.
- El campo responsable queda fuera porque no existe en el modelo actual.

## Cambios

- `src/utils/taskMetrics.js` — normalización, clasificación y cálculos de carga.
- `src/components/ui/MetricCard.jsx` — métrica reutilizable.
- `src/components/ui/WorkloadSummary.jsx` — resumen de carga por horas.
- `src/components/ui/TaskCard.jsx` — tarjeta reutilizable de tarea.
- `src/pages/HoyPage.jsx` — resumen, atrasadas, hoy y próximas.
- `src/pages/ProgresoPage.jsx` — resumen global y progreso por horas.
- `src/components/ui/EventCard.jsx` — detalle de horas por evento.
- `src/views/EventDetailView.jsx` — carga horaria del evento.

## Verificación

- `npm test` ✅ — 24 pruebas
- `npm run lint` ✅
- `npm run build` ✅
