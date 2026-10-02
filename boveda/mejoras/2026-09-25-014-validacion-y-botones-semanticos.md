---
tipo: mejora
---

# Validación de fechas y botones semánticos

- **Fecha:** 2026-09-25
- **Área:** formularios / UX / accesibilidad / consistencia visual
- **Estado:** hecha

## Descripción

Se reforzó la prevención de fechas pasadas y la carga cognitiva de los formularios de eventos y gestiones. Los campos están agrupados por intención, muestran ejemplos y errores contextuales, y el foco se desplaza al primer campo inválido cuando se bloquea un envío.

## Cambios

- `src/utils/dateValidation.js` — fecha local de referencia, detección de fechas pasadas y microcopy común.
- `src/utils/formFocus.js` — foco automático en el primer campo inválido.
- `src/views/CreateEventView.jsx` — agrupación por intención, estado crítico para `typesError`, ayuda de fecha y validación en creación.
- `src/views/EventDetailView.jsx` — retorno a `/progreso`, validaciones de fechas en alta/edición, placeholders, agrupación y estados de botón.
- `src/components/ui/Button.jsx` — nueva variante `success` verde para `Completar`.
- `DESIGN_SYSTEM.md` — reglas de fechas, agrupación, foco y variantes de botón.

## Criterios

- Las fechas de evento y fecha objetivo no pueden ser anteriores a hoy.
- El calendario usa `min` y la escritura manual se valida en el campo y al enviar.
- `Crear`, `Guardar` y `Editar` usan azul; `Completar` usa verde; `Eliminar` usa rojo; `Cancelar`, `Volver` y `Reintentar` son neutrales.

## Verificación

- `npm test` ✅
- `npm run lint` ✅
- `npm run build` ✅
- `npx prettier --check` ✅
