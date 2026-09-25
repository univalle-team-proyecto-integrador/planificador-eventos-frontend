---
tipo: mejora
---

# Cierre del modal de eliminación de eventos

- **Fecha:** 2026-09-25
- **Área:** interfaz / UX
- **Estado:** hecha

## Descripción

Se corrigió el flujo de eliminación de eventos para cerrar el modal de confirmación después de que la API responda correctamente. Si la operación falla, el modal permanece abierto para mostrar el error y permitir reintentar o cancelar.

## Cambios

- `src/views/EventDetailView.jsx` — se cierra `isEventDeleteOpen` y se limpia el error antes de navegar al progreso después de un `DELETE` exitoso.

## Verificación

- `npm run lint` ✅
- `npm run build` ✅
- La eliminación y la navegación deben verificarse nuevamente en el entorno desplegado.
