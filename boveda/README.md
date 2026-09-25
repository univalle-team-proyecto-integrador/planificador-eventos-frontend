# Bóveda Obsidian — Planificador de Eventos (Frontend)

Esta carpeta es la bóveda de Obsidian del frontend. Registra decisiones, mejoras y evidencia de trabajo sin duplicar los documentos canónicos del producto.

## Documentos canónicos

Estos archivos permanecen en la raíz del repositorio y son la fuente de verdad:

- `../PRD.md` — visión, alcance, historias y criterios de aceptación.
- `../DESIGN_SYSTEM.md` — tokens visuales, componentes y accesibilidad.
- `../ARCHITECTURE.md` — capas, contrato HTTP, entidades y configuración.
- `../docs/` — decisiones UX, microcopy y auditoría de accesibilidad.

## Estructura

- `lienzo-maestro.canvas` — mapa visual del frontend y sus mejoras.
- `mejoras/` — un registro por mejora o decisión relevante.
- `mejoras/plantilla-mejora.md` — plantilla para nuevos registros.
- `mejoras/README.md` — índice de registros.

## Flujo de trabajo

1. Realiza el cambio en el repositorio frontend.
2. Crea un registro en `mejoras/` siguiendo la plantilla.
3. Añade el registro al índice.
4. Añade un nodo al `lienzo-maestro.canvas`.
5. Verifica el cambio con los comandos del proyecto y anota el resultado.

## Relación con el backend

La bóveda del frontend registra cambios de interfaz, UX, accesibilidad e integración desde el punto de vista del cliente. La bóveda del backend registra cambios de servidor, persistencia e infraestructura. Los contratos compartidos se documentan en `ARCHITECTURE.md` y en los registros de integración de ambos repositorios.

Todos los textos de esta bóveda están escritos en español.
