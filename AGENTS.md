# planificador-eventos-frontend

Sprint 0 MVP. React 19 + Vite + React Router 7 (`react-router-dom`), plain JSX (no TypeScript). UI text, comments, and commit messages are in Spanish.

## Commands
- `npm run dev` — Vite dev server (HMR)
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the built app
- `npm run lint` — **oxlint** (not ESLint); config in `.oxlintrc.json`. A second ESLint config (`eslint.config.js`) exists but no script runs it.
- No test framework or typecheck script — don't run `npm test` or `tsc`
- No format script; Prettier config is `.prettierrc` (single quotes, semicolons, width 80). Format ad-hoc with `npx prettier --write <file>`

## Structure & conventions
- One page component per file in `src/pages/` (named exports, e.g. `HoyPage`), each mapping to a screen from Sprint 0 tasks (T1–T4, US-11).
- Routes are defined in `src/routes/AppRoutes.jsx`, mounted by `src/App.jsx`; unknown paths redirect to `/login`. Every route element is wrapped in `SimulatedLoader` (a brief spinner, `src/components/SimulatedLoader.jsx`) to fake an initial loading state.
- `/hoy` (`HoyPage.jsx`) renders a simulated empty state with a CTA linking to `/crear`; the exact copy is business-accepted text kept editable in that file.
- `src/App.css` is leftover Vite template styling and `src/index.css` only holds global styles plus the `spin` keyframe used by the loader — new UI doesn't need to reuse them.
- No component library; UI uses inline styles.
- Naming convention: `:id` param routes use `/evento/:id` (not `/actividad`).

## Gotchas
- `.env` exists locally but is gitignored; values are placeholders and none are `VITE_`-prefixed, so Vite never exposes them to the app.
- Active work is on local branch `frontend/lead` (pushed to `origin/frontend/lead`); `main` tracks `origin/main`.