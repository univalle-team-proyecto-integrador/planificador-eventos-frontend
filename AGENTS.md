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

- `vite.config.js` **sí** tiene bloque `test`, con `environment: 'jsdom'` (la sesión vive en `localStorage`, así que `window` tiene que existir). **`jsdom` está instalado**; `@testing-library` y `happy-dom` no.
- Cobertura actual: **10 archivos, 86 tests** — `api`, `authService`, `tokenStorage`, `dateValidation`, `emailValidation`, `passwordValidation`, `taskMetrics`, `taskSearch`, `theme` y `components/layout/shell.test.jsx`.
- Dos patrones conviven:
  - **Lógica pura** en `src/utils/` y `src/services/`. Es el patrón mayoritario y el preferido.
  - **Un test de render** en `src/components/layout/shell.test.jsx` monta el árbol real con `createRoot` + `act` de `react` (sin testing-library) y comprueba el shell: rutas, ítem activo, nombre de usuario, persistencia del tema y menú de perfil. Existe porque un fallo de cableado de providers deja la app en blanco y ningún test de lógica lo detecta.
- En tests de render hay que dejar que los `React.lazy` resuelvan antes de mirar el DOM: usar `vi.waitFor`, no un `setTimeout` fijo.
- `api.test.js` stubbea `global.fetch` y fija `BASE = 'https://planificador-eventos-backend-1.onrender.com'`; sigue ese patrón al añadir casos.

## Entorno (trampa importante)

- `.env` está en `.gitignore` pero **existe en local y apunta a la API real en Render**: `VITE_API_URL=https://planificador-eventos-backend-1.onrender.com`. Ya no existe `VITE_USER_ID`: el propietario sale del token.
- `src/services/api.js` además **cae a esa URL de Render** si falta `VITE_API_URL`. Consecuencia: `npm run dev` sin `.env` opera contra producción y escribe datos reales (crear/eliminar eventos). No apuntar a `localhost:8080` ni inventar endpoints sin avisar antes.
- El backend solo habilita CORS para `https://*.vercel.app` y `http://localhost:5173`. Cambiar el puerto de Vite rompe la SPA.
- `api.js` usa timeout de 15 s y **reintenta una vez los `GET`** por el cold start del plan free de Render. No eliminarlo sin motivo.
- Nunca poner secretos en variables `VITE_*` (van al bundle).

## Autenticación (US-11)

- Es **JWT propio del backend**, no Supabase. `PRD.md` §alcance y §límites todavía la describen como pendiente y mencionan el flujo de Supabase: **eso está desactualizado**, no lo copies.
- `src/services/tokenStorage.js` es la única capa que toca `localStorage`, con las claves `eventflow.token` y `eventflow.sesion`. No tiene dependencias a propósito: `authService` lo importa y al revés crearía un ciclo.
- `src/services/authService.js` expone `requestLogin`, `requestRegister`, `requestProfile`, `getToken`, `getSession`, `setToken`, `clearToken`, `isAuthenticated`.
- `SessionProvider` expone `usuario`, `login`, `register`, `logout`. `LoginView`/`RegisterView` llaman al servicio; el resto de la app solo lee `usuario`.
- Un `401` dispara `onSessionExpired` → `SessionProvider` limpia la sesión y `RequireSession` manda a `/login`. `AppRoutes` tiene dos guards: `RequireSession` y su inverso para `/login` y `/registro`.

## Estructura y cableado

- `src/main.jsx` monta `App`; `src/App.jsx` envuelve con `NotificationsProvider` → `ThemeProvider` → `SessionProvider` → `SearchProvider` → `AppRoutes`. **El orden importa**: el shell consume `useTheme` y `useTaskSearch`.
- `src/routes/AppRoutes.jsx` contiene el `BrowserRouter`, el `Suspense` y las rutas. Usa la API clásica de React Router (`Routes`/`Route`/`Outlet`), no data APIs.
- Cada ruta va con `React.lazy`. Las pantallas de `src/pages/` son envoltorios de 5 líneas y **deben tener export nombrado y `export default`** para que resuelva el `lazy`; la lógica nueva va en `src/views/`.
- Rutas: `/login`, `/registro`, `/` → `/hoy`, `/hoy`, `/crear`, `/evento/:id`, `/progreso`, `/configuracion`, `*` → `/hoy`. La ruta de detalle es `/evento/:id`; no usar `/actividad`.
- `/configuracion` es un placeholder ("Próximamente") dentro del shell, no una pantalla real todavía.
- El shell vive en `src/components/layout/`: `Layout.jsx` (composición + `<Outlet />`), `Topbar`, `Sidebar`, `SearchBar`, `ProfileMenu`, `ThemeToggle`, `InfoTip`. `Layout` es el único punto que compone topbar + lateral + `<Outlet />`.
- El interruptor de tema **no** está en la topbar: vive dentro de `ProfileMenu`, en una fila "Apariencia" sobre "Cerrar sesión". Es una preferencia de la cuenta, no una acción del trabajo. Conserva `role="switch"` + `aria-checked`, así que `shell.test.jsx` tiene que abrir el menú antes de buscarlo.
- `src/components/ui/CalendarModal.jsx` y el botón "Ver calendario" de `src/pages/HoyPage.jsx` vienen del PR #4 y se fusionaron con este shell. Dependen solo de `Button` y `Link`, así que sobreviven a los cambios de tokens; `shell.test.jsx` cubre que abra y cierre.
- `src/components/ui/` = interfaz compartida reutilizable (`Button`, `Card`, `Badge`, `ConfirmModal`, `ErrorModal`, `TaskCard`, `EventCard`, `Toast`, `ProgressBar`, `MetricCard`, `WorkloadSummary`, `FieldSuccess`); `src/components/states/` = `EmptyState` / `ErrorState`.
- `src/utils/` = lógica pura y testeable (normalizadores, métricas, validación, foco, tema, búsqueda). `src/hooks/` = `useDebouncedValue` y `useClickOutside`.
- Los contextos están separados del `.jsx` a propósito: `react/only-export-components` es `warn` en `.oxlintrc.json`. Mantener esa separación (`*-context.js` + `*Provider.jsx`).
- `src/views/EventDetailView.jsx` tiene ~1700 líneas concentrando lectura, edición, subtareas, progreso y borrado del evento. Editarlo con cuidado y en pasos verificables.
- Archivos muertos, no los reimportes: `src/App.css`, `src/assets/*`, `src/img/Logo_h1.png`, `public/icons.svg`, `dist/` (gitignored).

## Convenciones de interfaz

- `Button` acepta `as` para navegación: `Button as={Link}`. **Nunca anidar un `button` dentro de un `Link`.**
- Variantes de `Button`: `primary`, `success`, `neutral`, `danger`, y las de contorno `success-outline`, `danger-outline`, `neutral-outline`. Las de `Badge` son un set distinto: `neutral`, `info`, `pending`, `success`. No cruzarlos.
- La base de `Button` lleva la "reacción de agarre": `cursor-pointer`, elevación al pasar el mouse y hundido al presionar. Ojo con la transición: hay que animar `transform` y `box-shadow` además del color, o no se ve. Los botones de tarea de `EventDetailView` comparten `TASK_ACTION_CLASS` (`w-28 rounded-full`) para que la fila no se vea desigual; el ancho va en esa constante, no repetido por botón.
- Todo hover que desplace elementos lleva `motion-reduce:transform-none motion-reduce:transition-none`.
- Acciones destructivas: `ConfirmModal` con confirmación explícita, cierre por `Escape`, focus trap y restauración del foco. `src/utils/focusTrap.js` es el focus trap compartido; `Sidebar` y `ConfirmModal` lo reutilizan.
- Formularios: `label`/`input` asociados por `id`, `aria-invalid` + `aria-describedby`, y mensajes con la regla "qué pasó + cómo corregirlo" (`docs/guia-microcopy.md`).
- Carga y errores de red: `ErrorState` / `EmptyState` con `role="status"` y `aria-live`.
- **No uses `NavLink` para la barra lateral.** React Router 7 calcula su propio `aria-current` desde `to` y sobrescribe el que le pases, así que un ítem que cubre varias rutas (como "Eventos / Progreso" en `/evento/:id`) nunca se anunciaría como sección actual. Usa `Link` con un predicado propio sobre `useLocation()`.
- La sidebar es `fixed` en móvil (drawer con velo, focus trap y cierre por `Escape`) y `sticky` en escritorio. Su posición depende de `--topbar-height`: si cambias la altura de la topbar, cambia también esa variable.

## Color y tema (esto cambió, leer antes de tocar estilos)

- Los colores son **tokens CSS semánticos**, no hex. Viven como variables en `:root` y en `[data-theme='dark']` dentro de `src/index.css`, y se publican como utilidades de Tailwind con `@theme inline`. Por eso `.bg-surface-raised` compila a `background-color: var(--surface-raised)`: resuelve en tiempo de ejecución y cambiar de tema no requiere recompilar ni duplicar clases.
- **No escribas variantes `dark:`** ni hex en los componentes. Para ajustar un color se edita la variable en los dos bloques.
- `--topbar-height` también es token, pero **no** pasa por `@theme`: se usa como `var(--topbar-height)`.
- Tokens: `surface`, `surface-raised`, `surface-sunken`, `surface-overlay`, `border`, `border-strong`, `text-primary`, `text-secondary`, `text-muted`, `text-inverted`, `primary`, `primary-hover`, `primary-soft`, `primary-contrast`, `primary-text`, y las ternas `success`/`warning`/`danger`/`info` con sus `-soft` y `-text`, más `focus-ring`.
- `success` y `danger` tienen además un `-contrast` para el texto sobre el **relleno** de color (`--success-contrast`, `--danger-contrast`). No es lo mismo que `-text`, que es para el tinte `-soft`. Hace falta porque los verdes y rojos se invierten entre temas: en claro el relleno es oscuro y admite blanco, en oscuro es aclarado y lo admite oscuro. Con `--primary-contrast` el botón de tarea quedaba en 2.95:1 en claro, y con blanco fijo en 1.92:1 en oscuro. `warning` e `info` no lo tienen porque aún no hay ningún botón que se rellene con ellos.
- `--border-strong` **no** llega a 3:1 contra `--surface-raised` (1.47:1 en claro, 1.79:1 en oscuro): sirve como filete decorativo, no como borde de control. Para el borde de un botón hay que usar el color del propio tono (`border-success`, `border-danger`) o `border-muted-text`, que sí pasa de 3:1.
- Utilidades: `bg-surface`, `bg-surface-raised`, `text-primary-text`, `text-secondary-text`, `text-muted-text`, `border-border`, `bg-primary`, `text-primary-contrast`, `bg-primary-soft`, `bg-danger-soft`, `text-danger-text`, `bg-[var(--surface-overlay)]`…
- La paleta es la del PR #4 (rama `frontend/lead`): `brand` turquesa `#4eb0d1`, `accent` periwinkle `#8581d9` y `canvas` crema `#f7f6ed`, que ahora es `--surface`. Ya no queda morado en el producto: login y registro se repintaron solos porque sus colores literales se habían convertido en tokens.
- `--primary-text` es un turquesa **oscuro** (`#17697f`), no el de los rellenos. El turquesa de marca con blanco encima se queda en 2.48:1, así que sirve como fondo pero no como texto ni como anillo de foco. En oscuro `--primary-contrast` también es texto oscuro, porque un relleno aclarado ya no admite blanco. Si cambias `--primary`, vuelve a medir ese par.
- `brand`, `accent` y `canvas` se publican como alias de `--primary-text`, `--primary-text` y `--surface` para que los archivos que vienen del PR #4 (`CalendarModal`, `HoyPage`, `CreateEventView`, `EventDetailView`) no tengan que reescribirse. Si en algún momento reescribes esos archivos con tokens semánticos, borra los alias.
- Contraste: los pares de texto pasan AA en los dos temas (el más bajo, el texto apagado sobre superficie, queda en 4.68:1). **`--border` no llega a 3:1** (1.24:1 claro, 1.36:1 oscuro): es un filete decorativo y por eso se acepta, pero un input cuyo borde sea lo único que lo identifica sí incumple 1.4.11. Si lo endureces, sube `--border-strong`.
- `index.html` tiene un script inline que aplica `data-theme` **antes del primer render** leyendo `eventflow.tema`, para que no haya destello. Si tocas el nombre de la clave o los valores válidos (`light`/`dark`), actualiza a la vez `src/utils/theme.js` y ese script.
- `ThemeProvider` cae a `prefers-color-scheme` si no hay preferencia guardada, y envuelve `localStorage` en `try/catch`.

## API y datos

Todo el HTTP pasa por `src/services/api.js`; nunca hardcodear URLs en las vistas. DTOs:

- Evento: `idTipoEvento`, `nombre`, `cliente`, `fechaEvento`, `lugar`. El `idUsuario` es opcional y el backend lo ignora (el propietario sale del token). `GET /api/eventos/{id}` además trae `subtareas` (las vistas siguen usando `GET /api/eventos/{id}/subtareas`).
- Tipo de evento: `idTipoEvento`, `nombre`, desde `/api/tipos-evento`.
- Subtarea: `idEvento`, `nombreGestion`, `horasEstimadas`, `fechaObjetivo`, `estado` (`pendiente` | `ejecutada` | `pospuesta`).
- Perfil: `GET /api/users/profile` (`api.getProfile`), usado por `SessionProvider` para recuperar el nombre cuando la sesión guardada no lo trae.

`fechaEvento` se manda como `LocalDateTime` (`toApiDateTime`); `fechaObjetivo` como `LocalDate`. Las mutaciones solo actualizan la UI tras respuesta persistida del servidor. Las respuestas pueden venir envueltas en `{ data: ... }` (`unwrapData`).

### Buscador global (trampa importante)

- **No existe endpoint de búsqueda en el backend.** `EventoService.obtenerTodos()` devuelve `subtareas: []`, así que `GET /api/eventos` no sirve para buscar tareas.
- `src/services/taskSearchService.js` arma el índice con un **N+1**: `GET /api/eventos` y luego `GET /api/eventos/{id}/subtareas` por evento. Se cachea en `SearchProvider`, se carga bajo demanda al escribir (no al montar) y se invalida desde `EventDetailView` y `CreateEventView` cuando cambian los datos.
- `src/utils/taskSearch.js` es la lógica pura (normalización acentos/mayúsculas, ranking, orden por fecha) y la única que necesita tests.
- La solución de fondo es un endpoint `GET /api/subtareas/buscar?search={texto}&limite=20` que devuelva tarea, `idEvento` y `eventoNombre`, filtrado por el usuario del JWT. Si lo añades, `SearchProvider` es el único punto a tocar.

## Git y entrega

- Rama de trabajo `frontend/lead`, se integra a `main` por merge. El backend es un repo aparte y sigue el mismo patrón con `backend/lead`. **`main` es la rama de integración y Vercel auto-despliega desde ella**: un push a `frontend/lead` no publica nada, hay que fusionar a `main` para que salga a producción. No commitear directo a `main`.
- Antes de empezar a trabajar, `git fetch` y arrancar desde `frontend/lead` al día, para no partir de una copia vieja.
- Mensajes de commit en español con prefijos conventional: `feat:`, `fix:`, `docs:`, `style:`, `test:`, `merge:`. Con cuerpo cuando el _porqué_ no se entiende leyendo el diff; el cuerpo dice qué cambió y por qué, no el qué.
- El backend es un **repo git aparte** en `../planificador-eventos-backend` (no es submódulo). `./mvnw test`, `./mvnw spring-boot:run` (puerto 8080). Render despliega desde su `main`; su rama de desarrollo es `backend/lead`.
- Bóveda: crear un registro en `boveda/mejoras/` solo para mejoras notables (interfaz, UX, a11y, integración), no por cada commit. Al crearlo hay que actualizar también el índice `boveda/mejoras/README.md` y añadir el nodo en `boveda/lienzo-maestro.canvas`. Numeración usada: 001–016 (falta 009); el backend ya va por 021.

## Documentos de referencia

Raíz (fuente de verdad): `PRD.md` (alcance y criterios de aceptación), `DESIGN_SYSTEM.md` (componentes y accesibilidad), `ARCHITECTURE.md` (capas, contrato HTTP, despliegue). Antes de tocar textos o interacciones, ver también `docs/decisiones-ux.md`, `docs/guia-microcopy.md` y `docs/auditoria-a11y.md`.

Sabido desactualizado: `PRD.md` describe la autenticación como pendiente y menciona Supabase, y su tabla de rutas no incluye `/registro` ni `/configuracion`. `DESIGN_SYSTEM.md` documenta "tokens" como si fueran nombres mapeados a clases Tailwind por defecto (`blue-700`…); ya no es así, manda la sección **Color y tema** de este archivo.

## Pendientes conocidos

- US-11 (autenticación) ya está implementado y desplegado; falta evidencia en Jira.
- Falta evidencia en Jira y la validación end-to-end contra Render.
- Modo oscuro en dos fases: el shell y los componentes compartidos ya usan tokens. **Las vistas de `src/views/` (excepto login y registro) todavía tienen colores literales**, así que en tema oscuro se ven a medio migrar.
- `/configuracion` es un placeholder; falta decidir qué va dentro.
- Auditorías Lighthouse/axe pendientes sobre el despliegue de Vercel.
