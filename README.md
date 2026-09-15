# Planificador de Eventos — Frontend

Frontend del MVP (Sprint 0) para el planificador de eventos dirigido a organizadores independientes. Permite gestionar el plan de trabajo logístico de cada evento, ver las tareas del día, la reprogramación ante conflictos de horas y el progreso global de preparativos.

## Stack

- **React 19 + Vite 8** — JS/JSX puro, sin TypeScript
- **React Router 7** (`react-router-dom`) — SPA con rutas centralizadas en un solo archivo
- **oxlint** — linter principal (config en `.oxlintrc.json`)
- **Prettier** — formato (config en `.prettierrc`)

## Comandos

| Comando           | Descripción                                              |
| ----------------- | -------------------------------------------------------- |
| `npm run dev`     | Levanta el servidor de desarrollo con HMR                |
| `npm run build`   | Genera el build de producción en `dist/`                 |
| `npm run preview` | Sirve el build generado                                  |
| `npm run lint`    | Ejecuta oxlint (`eslint.config.js` no se usa en scripts) |

No hay script de formato; se formatea ad-hoc con `npx prettier --write <archivo>`. No existe framework de tests ni typecheck.

## Estructura del proyecto

La aplicación está desacoplada por responsabilidad: cada pantalla vive en un archivo propio de `src/pages/`, el router centraliza todas las rutas en `src/routes/` y los componentes compartidos van en `src/components/`.

```
src/
├── main.jsx                   # Bootstrap de React
├── App.jsx                    # Monta las rutas
├── pages/                     # Una pantalla por archivo (Sprint 0)
│   ├── HoyPage.jsx             # Panel del día (T2): estado vacío + CTA a /crear
│   ├── CrearPage.jsx           # Crear evento (T1)
│   ├── DetallePage.jsx         # Detalle y reprogramación de un evento (T3)
│   ├── ProgresoPage.jsx        # Barra de avance de preparativos (T4)
│   └── LoginPage.jsx           # Acceso de organizadores (US-11)
├── routes/
│   └── AppRoutes.jsx          # BrowserRouter + todas las rutas de la SPA
└── components/
    └── SimulatedLoader.jsx    # Spinner que simula la carga inicial en cada ruta
```

## Rutas

| Ruta          | Pantalla                                   | Componente     |
| ------------- | ------------------------------------------ | -------------- |
| `/hoy`        | Panel principal del día                    | `HoyPage`      |
| `/crear`      | Crear evento                               | `CrearPage`    |
| `/evento/:id` | Detalle de evento                          | `DetallePage`  |
| `/progreso`   | Progreso del evento                        | `ProgresoPage` |
| `/login`      | Inicio de sesión                           | `LoginPage`    |
| `*`           | Cualquier otra ruta → `/login` (`replace`) | `Navigate`     |

## Convenciones

- Textos de UI, comentarios y mensajes de commit en español
- JS/JSX puro, sin TypeScript
- Una pantalla = un archivo en `src/pages/`, con export nombrado
- Todas las rutas se envuelven en `SimulatedLoader` para simular coherencia visual de carga inicial
- Sin librería de componentes: la UI usa estilos inline
- La ruta de detalle usa el parámetro `/evento/:id` (no `/actividad`)
