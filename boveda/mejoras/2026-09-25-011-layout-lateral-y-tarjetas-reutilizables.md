---
tipo: mejora
---

# Layout lateral y tarjetas reutilizables

- **Fecha:** 2026-09-25
- **Área:** interfaz / UX / accesibilidad
- **Estado:** hecha

## Descripción

Se reorganizó la aplicación alrededor de una barra lateral de 250 px en escritorio y un área principal flexible. La vista Hoy y las tarjetas de eventos adoptaron una superficie visual compartida, con badges y jerarquía tipográfica consistentes para evitar estilos duplicados en futuras vistas.

## Cambios

- `src/components/ui/Layout.jsx` — layout flexible, navegación lateral, CTA de creación y adaptación móvil.
- `src/components/ui/Card.jsx` — superficie reutilizable para paneles, eventos y tareas.
- `src/components/ui/Badge.jsx` — variantes reutilizables para neutral, informativo, pendiente y exitoso.
- `src/pages/HoyPage.jsx` — encabezado y tarjetas de hoy con la jerarquía visual acordada.
- `src/components/ui/EventCard.jsx` — migración al componente `Card` compartido.
- `DESIGN_SYSTEM.md`, `README.md` y `ARCHITECTURE.md` — documentación de los nuevos contratos visuales.

## Decisiones

- Las tarjetas futuras deben usar `Card` y `Badge`; no se replicarán sombras, radios y píldoras directamente en cada vista.
- La barra lateral se convierte en una fila superior en mobile para mantener accesibles la navegación y el CTA.
- El contenido conserva su semántica, enlaces y estados de carga/error/vacío.

## Verificación

- `npm test` ✅
- `npm run lint` ✅
- `npm run build` ✅
