---
tipo: mejora
---

# Microcopy de acceso al evento

- **Fecha:** 2026-09-25
- **Área:** UX / accesibilidad
- **Estado:** hecha

## Descripción

Las tarjetas de la vista Progreso ahora comunican que la acción abre el evento completo, no únicamente su plan logístico. El texto coincide con el patrón usado en la vista Hoy.

## Cambio

- `src/components/ui/EventCard.jsx` — `Ver plan` cambiado a `Ver evento`.
- El enlace incluye `aria-label="Ver evento {nombre}"` para conservar un nombre accesible específico.
- `docs/guia-microcopy.md` — se registra el texto aprobado.

## Verificación

- `npm test` ✅
- `npm run lint` ✅
- `npm run build` ✅
