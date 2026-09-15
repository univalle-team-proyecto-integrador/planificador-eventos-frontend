# planificador-eventos-frontend

Sprint 0 MVP. React 19 + Vite + React Router 7 (`react-router-dom`), plain JSX (no TypeScript). UI text, comments, and commit messages are in Spanish.

## Commands
- `npm run dev` — Vite dev server (HMR)
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the built app
- `npm run lint` — **oxlint** (not ESLint); config in `.oxlintrc.json`
- No test framework or typecheck script — don't run `npm test` or `tsc`
- No format script; Prettier config is `.prettierrc` (single quotes, semicolons, width 80). Format ad-hoc with `npx prettier --write <file>`

## Structure & conventions
- All routes live in `src/routes/AppRoutes.jsx`, mounted by `src/App.jsx`; unknown paths redirect to `/login`. Screens are currently inline stub components in that same file (tasks T1–T4, US-11).
- `src/App.css` and `src/index.css` are leftover Vite template styles, and `src/App.jsx` still imports unused template assets — new UI doesn't need to reuse them.
- No component library; stubs use inline styles.

## Gotchas
- `.env` exists locally but is gitignored; values are placeholders and none are `VITE_`-prefixed, so Vite never exposes them to the app.
- Active work is on local branch `frontend/lead` (unpushed); `main` tracks `origin/main`.