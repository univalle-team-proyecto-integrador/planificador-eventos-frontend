---
tipo: mejora
---

# Sistema de iconos Lucide

- **Fecha:** 2026-09-25
- **Área:** interfaz / accesibilidad / consistencia visual
- **Estado:** hecha

## Descripción

Se unificó la iconografía de la interfaz con `lucide-react`, eliminando emojis y SVG inline dispersos. Los iconos mantienen el mismo trazo, tamaño y comportamiento visual en navegación, acciones, estados, notificaciones y detalle del evento.

## Cambios

- `package.json` y `package-lock.json` — dependencia `lucide-react`.
- `src/components/ui/Layout.jsx` — iconos de navegación y CTA.
- `src/components/ui/Toast.jsx`, `ErrorModal.jsx` y `states/ErrorState.jsx` — iconos de notificación, alerta y error.
- `src/components/states/EmptyState.jsx` — icono base `Inbox` y soporte para componentes Lucide.
- `src/utils/eventTypeIcons.js` — mapa reutilizable de iconos por tipo de evento.
- `src/views/EventDetailView.jsx`, `pages/HoyPage.jsx` y `ui/EventCard.jsx` — iconos de retorno, edición, completar, eliminar, ubicación y enlaces.
- Todos los iconos decorativos usan `aria-hidden="true"`; los botones de solo icono mantienen nombre accesible.

## Verificación

- `npm test` ✅ — 15 pruebas
- `npm run lint` ✅ — 0 advertencias y 0 errores
- `npm run build` ✅
- `npx prettier --check` ✅
