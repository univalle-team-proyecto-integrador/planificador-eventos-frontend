---
tipo: auditoria-a11y
---

# Auditoría de accesibilidad

## Verificación realizada

- El documento declara `lang="es"`.
- Existe un enlace de salto al contenido principal.
- El Header utiliza navegación semántica y los enlaces no contienen botones anidados.
- Los botones tienen foco visible, estado `disabled` y variantes con intención visual.
- Los campos tienen `label`, `id`, `aria-invalid` y `aria-describedby` cuando existe error.
- Los estados de carga, vacío y error usan `role="status"` o `role="alert"` y mensajes en español.
- El modal de eliminación usa `role="dialog"`, `aria-modal`, foco inicial, cierre con `Escape` y focus trap.
- Las barras de progreso exponen `aria-valuemin`, `aria-valuemax` y `aria-valuenow`.
- Los iconos decorativos están ocultos con `aria-hidden`.
- Los mensajes de red no se comunican solo mediante color.

## Validación recomendada antes de publicar

1. Recorrer todos los formularios únicamente con teclado.
2. Comprobar que el foco permanece dentro del modal mientras está abierto.
3. Ejecutar un lector de pantalla sobre creación, error y eliminación.
4. Verificar zoom al 200 % y navegación en viewport móvil.
5. Ejecutar Lighthouse o axe en la URL de Vercel después del despliegue.

## Alcance

Esta auditoría cubre el frontend actual. La automatización depende del entorno de despliegue y no forma parte de los scripts del proyecto, que no incluyen un framework de tests.
