---
tipo: mejora
---

# Navegación desde el detalle de eventos

- **Fecha:** 2026-09-25
- **Área:** interfaz / UX / accesibilidad
- **Estado:** hecha

## Descripción

Se centralizó la navegación de retorno al listado de eventos y se corrigió el flujo del botón “Volver a eventos”. La navegación ahora utiliza el enrutador de React y reemplaza la entrada actual del historial para evitar regresar accidentalmente al detalle después de cambiar de vista.

## Cambios

- `src/views/EventDetailView.jsx` — se centralizó `goToProgress`, se actualizó el botón de retorno y se mantuvo la redirección después de eliminar un evento.

## Verificación

- `npm run lint` ✅
- `npm run build` ✅
- La navegación debe verificarse en el despliegue de Vercel después del merge a `main`.
