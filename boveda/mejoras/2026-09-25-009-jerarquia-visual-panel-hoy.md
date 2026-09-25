---
tipo: mejora
---

# Jerarquía visual del panel Hoy

- **Fecha:** 2026-09-25
- **Área:** interfaz / UX
- **Estado:** hecha

## Descripción

Se reforzó la jerarquía visual de la cabecera de `/hoy`. La fecha actual y el texto de apoyo ahora aparecen dentro de un bloque destacado, con mayor contraste, tamaño y una etiqueta de fecha que facilita la lectura.

## Cambios

- `src/pages/HoyPage.jsx` — se añadió un encabezado visual con fondo azul claro, icono de calendario, etiqueta “Fecha de hoy” y fecha con inicial mayúscula.
- Se mantuvo el elemento `<time>` y el texto de apoyo para no perder semántica ni contexto.

## Verificación

- `npm run lint` ✅
- `npm run build` ✅
- `npx prettier --check src/pages/HoyPage.jsx` ✅
