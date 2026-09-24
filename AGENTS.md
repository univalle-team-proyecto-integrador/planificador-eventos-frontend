# planificador-eventos-frontend

Frontend del Planificador de Eventos. React 19 + Vite 8 + React Router 7, JS/JSX puro y Tailwind CSS 4. Los textos de UI, comentarios y documentación están en español.

## Comandos

- `npm run dev` — servidor de desarrollo con HMR.
- `npm run build` — build de producción en `dist/`.
- `npm run preview` — sirve el build generado.
- `npm run lint` — **oxlint** (no ESLint); configuración en `.oxlintrc.json`.
- No hay framework de tests ni typecheck. No ejecutar `npm test` ni `tsc`.
- Formatear de forma ad hoc con `npx prettier --write <archivo>`.

## Estructura y convenciones

- Las rutas viven en `src/routes/AppRoutes.jsx` y `src/App.jsx` solo monta el enrutador.
- Las pantallas tienen una entrada en `src/pages/` y la lógica de las vistas nuevas en `src/views/`.
- Las rutas se registran bajo `Layout`, que usa `Outlet` y el Header global.
- Cada ruta se envuelve con `SimulatedLoader`; las vistas manejan sus estados de red reales con `ErrorState` y mensajes `aria-live`.
- La ruta de detalle es `/evento/:id`; no usar `/actividad`.
- Los componentes compartidos de interfaz viven en `src/components/ui/` y los estados visuales en `src/components/states/`.
- No anidar un `button` dentro de un `Link`; usar `Button as={Link}`.
- Las acciones destructivas usan `ConfirmModal` y deben tener confirmación, `Escape`, focus trap y restauración del foco.
- Los formularios deben asociar `label`/`input`, usar `aria-invalid`/`aria-describedby` y mensajes con la regla “qué pasó + cómo corregirlo”.
- Las llamadas HTTP se centralizan en `src/services/api.js`; no usar URLs hardcodeadas en las vistas.
- No guardar secretos en el frontend. Usar `VITE_API_URL` y `VITE_USER_ID` solo para configuración no sensible.
- `vercel.json` mantiene el fallback de React Router para recargas directas en Vercel.

## API y datos

El contrato de frontend debe coincidir con los DTO del backend:

- Evento: `idUsuario`, `idTipoEvento`, `nombre`, `cliente`, `fechaEvento`, `lugar`.
- Subtarea: `idEvento`, `nombreGestion`, `horasEstimadas`, `fechaObjetivo`, `estado`.

La fecha de `<input type="date">` se convierte a `LocalDateTime` en `src/services/api.js`. No marcar la API como verificada hasta ejecutar una prueba contra los endpoints reales.

## Documentación UX

Antes de cambiar textos o interacciones, revisar `docs/decisiones-ux.md` y `docs/guia-microcopy.md`. Toda nueva decisión o regla de mensajes debe quedar documentada.

## Bóveda del proyecto

La bóveda Obsidian compartida vive en el repositorio hermano `planificador-eventos-backend/boveda/`, no en este repositorio. Las mejoras de frontend que afecten el contrato con backend deben registrarse allí en la rama `backend/lead`, siguiendo su índice y `lienzo-maestro.canvas`.
