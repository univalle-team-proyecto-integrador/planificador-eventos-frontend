# planificador-eventos-frontend

Frontend del Planificador de Eventos. React 19 + Vite 8 + React Router 7, JS/JSX puro y Tailwind CSS 4. Los textos de UI, comentarios y documentación están en español.

## Comandos

- `npm run dev` — servidor de desarrollo con HMR.
- `npm run build` — build de producción en `dist/`.
- `npm run preview` — sirve el build generado.
- `npm run lint` — **oxlint** (no ESLint); configuración en `.oxlintrc.json`.
- `npm run test` — **vitest**; tests unitarios de lógica pura en `src/**/*.test.js` (hoy `src/services/api.test.js`). Los tests no arrancan navegador (entorno `node` de vitest).
- No hay typecheck. No ejecutar `tsc`.
- Formatear de forma ad hoc con `npx prettier --write <archivo>`.

## Estructura y convenciones

- Las rutas viven en `src/routes/AppRoutes.jsx` y `src/App.jsx` solo monta el enrutador.
- Las pantallas tienen una entrada en `src/pages/` y la lógica de las vistas nuevas en `src/views/`.
- Las rutas se registran bajo `Layout`, que usa `Outlet` y el Header global.
- Cada ruta se carga con `React.lazy` + `Suspense` (`fallback: <RouteLoader />` en `AppRoutes.jsx`); las páginas de `src/pages/` además del export nombrado deben tener un `export default` para que resuelva el `lazy`. Las vistas manejan sus estados de red reales con `ErrorState` y mensajes `aria-live`.
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

- Evento: `idUsuario`, `idTipoEvento`, `nombre`, `cliente`, `fechaEvento`, `lugar`. El detalle `GET /api/eventos/{id}` incluye además `subtareas`: lista de `SubtareaDTO` (solo lectura; las vistas siguen consultando `GET /api/eventos/{id}/subtareas`).
- Tipo de evento: `idTipoEvento`, `nombre`; el catálogo se obtiene de `/api/tipos-evento`.
- Subtarea: `idEvento`, `nombreGestion`, `horasEstimadas`, `fechaObjetivo`, `estado`.

La fecha del evento de `<input type="date">` se convierte a `LocalDateTime`; la fecha objetivo de una subtarea se envía como `LocalDate`. No marcar la API como verificada hasta ejecutar una prueba contra los endpoints reales.

## Documentación de producto y arquitectura

La fuente de verdad de producto, diseño y arquitectura está en los archivos de la raíz:

- `PRD.md` — visión, alcance, historias y criterios de aceptación.
- `DESIGN_SYSTEM.md` — tokens visuales, componentes y reglas de accesibilidad.
- `ARCHITECTURE.md` — capas, API, entidades, configuración y despliegue.

Antes de cambiar textos o interacciones, revisar también `docs/decisiones-ux.md`, `docs/guia-microcopy.md` y `docs/auditoria-a11y.md`.

## Bóveda del proyecto

La bóveda del frontend se mantiene en `boveda/` y registra mejoras de interfaz, UX, accesibilidad e integración desde el punto de vista del cliente. La documentación funcional canónica continúa en la raíz mediante `PRD.md`, `DESIGN_SYSTEM.md` y `ARCHITECTURE.md`.

La bóveda del backend se mantiene en `planificador-eventos-backend/boveda/` para registrar mejoras de backend, persistencia e integración.
