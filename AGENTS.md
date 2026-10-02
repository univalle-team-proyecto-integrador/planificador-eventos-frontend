# planificador-eventos-frontend

Frontend del Planificador de Eventos. React 19 + Vite 8 + React Router 7, JS/JSX puro (sin TypeScript) y Tailwind CSS 4. UI, comentarios y documentación están en español.

## Verificación

Orden usado antes de dar por terminado un cambio (PRD §8):

```bash
npm run lint    # oxlint; sale en silencio si no encuentra nada
npm run test    # vitest run
npm run build   # vite build -> dist/
```

- Un solo archivo de tests: `npx vitest run src/utils/taskMetrics.test.js`
- Formatear: `npx prettier --write <archivo>` (80 cols, comillas simples, punto y coma). Prettier no tiene script propio.
- **No hay typecheck.** No ejecutar `tsc`.
- `npm run lint` es **oxlint**, no ESLint. `eslint.config.js` y las devDependencies de `eslint*` son residuales: no ejecutarlos ni "arreglarlos".
- No hay CI (`.github/` no existe en este repo). La verificación es manual.

## Tests

- `vite.config.js` no tiene bloque `test`: vitest corre con entorno `node`. **No hay `jsdom`, `happy-dom` ni `@testing-library` instalados**, así que solo se puede testear lógica pura.
- Cobertura actual: 3 archivos, 24 tests — `src/services/api.test.js`, `src/utils/dateValidation.test.js`, `src/utils/taskMetrics.test.js`.
- Patrón: la lógica testeable vive en `src/utils/` y `src/services/`; las vistas no se renderizan en tests.
- `api.test.js` stubbea `global.fetch` y fija `BASE = 'https://planificador-eventos-backend-1.onrender.com'`; sigue ese patrón al añadir casos.

## Entorno (trampa importante)

- `.env` está en `.gitignore` pero **existe en local y apunta a la API real en Render**: `VITE_API_URL=https://planificador-eventos-backend-1.onrender.com`. Ya no existe `VITE_USER_ID`: el propietario sale del token.
- `src/services/api.js` además **cae a esa URL de Render** si falta `VITE_API_URL`. Consecuencia: `npm run dev` sin `.env` opera contra producción y escribe datos reales (crear/eliminar eventos). No apuntar a `localhost:8080` ni inventar endpoints sin avisar antes.
- El backend solo habilita CORS para `https://*.vercel.app` y `http://localhost:5173`. Cambiar el puerto de Vite rompe la SPA.
- `api.js` usa timeout de 15 s y **reintenta una vez los `GET`** por el cold start del plan free de Render. No eliminarlo sin motivo.
- Nunca poner secretos en variables `VITE_*` (van al bundle).

## Estructura y cableado

- `src/main.jsx` monta `App`; `src/App.jsx` solo envuelve con `NotificationsProvider` + `AppRoutes`.
- `src/routes/AppRoutes.jsx` contiene el `BrowserRouter`, el `Suspense` y las rutas. Usa la API clásica de React Router (`Routes`/`Route`/`Outlet`), no data APIs.
- Cada ruta va con `React.lazy`. Las pantallas de `src/pages/` son envoltorios de 5 líneas y **deben tener export nombrado y `export default`** para que resuelva el `lazy`; la lógica nueva va en `src/views/`.
- Rutas: `/` → `/hoy`, `/hoy`, `/crear`, `/evento/:id`, `/progreso`, `/login`, `*` → `/login`. La ruta de detalle es `/evento/:id`; no usar `/actividad`.
- `src/components/ui/` = interfaz compartida; `src/components/states/` = `EmptyState` / `ErrorState`; `src/utils/` = lógica pura y testeable (normalizadores, métricas, validación de fechas, foco).
- `src/providers/notifications-context.js` está separado del `.jsx` a propósito: `react/only-export-components` es `warn` en `.oxlintrc.json`. Mantener esa separación.
- `src/views/EventDetailView.jsx` tiene ~1700 líneas concentrando lectura, edición, subtareas, progreso y borrado del evento. Editarlo con cuidado y en pasos verificables.
- Archivos muertos, no los reimportes: `src/App.css`, `src/assets/*`, `public/icons.svg`, `dist/` (gitignored).

## Convenciones de interfaz

- `Button` acepta `as` para navegación: `Button as={Link}`. **Nunca anidar un `button` dentro de un `Link`.**
- Variantes de `Button`: `primary`, `success`, `neutral`, `danger`. Las de `Badge` son un set distinto: `neutral`, `info`, `pending`, `success`. No cruzarlos.
- Acciones destructivas: `ConfirmModal` con confirmación explícita, cierre por `Escape`, focus trap y restauración del foco.
- Formularios: `label`/`input` asociados por `id`, `aria-invalid` + `aria-describedby`, y mensajes con la regla "qué pasó + cómo corregirlo" (`docs/guia-microcopy.md`).
- Carga y errores de red: `ErrorState` / `EmptyState` con `role="status"` y `aria-live`.
- `DESIGN_SYSTEM.md` documenta "tokens" que son **nombres mapeados a clases Tailwind por defecto** (`blue-700`, `emerald-700`…). `src/index.css` solo hace `@import 'tailwindcss'`, sin `@theme`: clases como `bg-primary-600` no existen.

## API y datos

Todo el HTTP pasa por `src/services/api.js`; nunca hardcodear URLs en las vistas. DTOs:

- Evento: `idTipoEvento`, `nombre`, `cliente`, `fechaEvento`, `lugar`. El `idUsuario` es opcional y el backend lo ignora (el propietario sale del token). `GET /api/eventos/{id}` además trae `subtareas` (las vistas siguen usando `GET /api/eventos/{id}/subtareas`).
- Tipo de evento: `idTipoEvento`, `nombre`, desde `/api/tipos-evento`.
- Subtarea: `idEvento`, `nombreGestion`, `horasEstimadas`, `fechaObjetivo`, `estado` (`pendiente` | `ejecutada` | `pospuesta`).

`fechaEvento` se manda como `LocalDateTime` (`toApiDateTime`); `fechaObjetivo` como `LocalDate`. Las mutaciones solo actualizan la UI tras respuesta persistida del servidor. Las respuestas pueden venir envueltas en `{ data: ... }` (`unwrapData`).

## Git y entrega

- Rama activa `main`; `frontend/lead` ya está fusionada. **Vercel auto-despliega `main`**: un push a `main` publica producción.
- Mensajes de commit en español con prefijos conventional: `feat:`, `fix:`, `docs:`, `style:`, `test:`, `merge:`.
- El backend es un **repo git aparte** en `../planificador-eventos-backend` (no es submódulo). `./mvnw test`, `./mvnw spring-boot:run` (puerto 8080). Render despliega desde su `main`; su rama de desarrollo es `backend/lead`.
- Bóveda: crear un registro en `boveda/mejoras/` solo para mejoras notables (interfaz, UX, a11y, integración), no por cada commit. Al crearlo hay que actualizar también el índice `boveda/mejoras/README.md` y añadir el nodo en `boveda/lienzo-maestro.canvas`. Numeración usada: 001–016 (falta 009); el backend ya va por 021.

## Documentos de referencia

Raíz (fuente de verdad): `PRD.md` (alcance y criterios de aceptación), `DESIGN_SYSTEM.md` (componentes y accesibilidad), `ARCHITECTURE.md` (capas, contrato HTTP, despliegue). Antes de tocar textos o interacciones, ver también `docs/decisiones-ux.md`, `docs/guia-microcopy.md` y `docs/auditoria-a11y.md`.

## Pendientes conocidos

- US-11 (autenticación) ya está implementado y desplegado; falta evidencia en Jira.
- Falta evidencia en Jira y la validación end-to-end contra Supabase/Render.
- Auditorías Lighthouse/axe pendientes sobre el despliegue de Vercel.
