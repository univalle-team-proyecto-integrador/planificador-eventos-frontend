# Planificador de Eventos — Frontend

Frontend del MVP para el planificador de eventos dirigido a organizadores independientes. Permite crear eventos, organizar su plan logístico y consultar el avance de las tareas.

## Stack

- **React 19 + Vite 8** — JS/JSX puro, sin TypeScript.
- **React Router 7** (`react-router-dom`) — SPA con rutas centralizadas.
- **Tailwind CSS 4** — estilos visuales de la interfaz.
- **oxlint** — linter principal (configuración en `.oxlintrc.json`).
- **Prettier** — formato ad hoc (configuración en `.prettierrc`).

## Comandos

| Comando           | Descripción                                |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Levanta el servidor de desarrollo con HMR. |
| `npm run build`   | Genera el build de producción en `dist/`.  |
| `npm run preview` | Sirve el build generado.                   |
| `npm run lint`    | Ejecuta oxlint.                            |

No existe framework de tests ni script de typecheck. Para formatear un archivo concreto:

```bash
npx prettier --write <archivo>
```

## Estructura

```text
src/
├── main.jsx                    # Bootstrap de React
├── App.jsx                     # Monta el enrutador
├── routes/
│   └── AppRoutes.jsx           # Rutas, layout y carga inicial simulada
├── pages/
│   ├── HoyPage.jsx             # Panel del día
│   ├── CrearPage.jsx           # Entrada de creación de evento
│   ├── DetallePage.jsx         # Entrada del detalle de evento
│   ├── ProgresoPage.jsx        # Vista de progreso
│   └── LoginPage.jsx           # Acceso de organizadores
├── views/
│   ├── CreateEventView.jsx     # Formulario US-01
│   └── EventDetailView.jsx     # Detalle, subtareas y progreso US-02/US-03
├── components/
│   ├── states/                 # Empty, Error y Loading
│   └── ui/                     # Layout, Card, Badge, Button, Modal y componentes compartidos
├── services/
│   └── api.js                  # Cliente HTTP y contrato de API
└── index.css                   # Tailwind y estilos globales
```

La bóveda de Obsidian del frontend está en `boveda/` y registra sus mejoras sin duplicar los documentos canónicos.

La documentación principal del proyecto está en:

- `PRD.md` — visión, alcance, historias y criterios de aceptación.
- `DESIGN_SYSTEM.md` — sistema visual, componentes y accesibilidad.
- `ARCHITECTURE.md` — arquitectura frontend/backend, API, entidades y despliegue.
- `docs/decisiones-ux.md` — decisiones de UX.
- `docs/guia-microcopy.md` — guía de textos.
- `docs/auditoria-a11y.md` — checklist de accesibilidad.

## Rutas

| Ruta          | Pantalla               | Componente                        |
| ------------- | ---------------------- | --------------------------------- |
| `/`           | Redirección a `/hoy`   | `Navigate`                        |
| `/hoy`        | Panel del día          | `HoyPage`                         |
| `/crear`      | Crear evento           | `CrearPage` / `CreateEventView`   |
| `/evento/:id` | Detalle y subtareas    | `DetallePage` / `EventDetailView` |
| `/progreso`   | Progreso global        | `ProgresoPage`                    |
| `/login`      | Acceso                 | `LoginPage`                       |
| `*`           | Redirección a `/login` | `Navigate`                        |

## API

El cliente utiliza `VITE_API_URL`, con `http://localhost:8080` como valor local por defecto. Copiar `.env.example` a `.env` y ajustar los valores:

```bash
cp .env.example .env
```

Variables disponibles para Vite:

| Variable       | Uso                                                                          |
| -------------- | ---------------------------------------------------------------------------- |
| `VITE_API_URL` | URL base del backend Spring Boot.                                            |
| `VITE_USER_ID` | Identificador temporal del organizador mientras se implementa autenticación. |

El frontend espera el contrato de eventos, tipos y subtareas definido por el backend. La fecha del evento se convierte a `LocalDateTime`; la fecha objetivo de una subtarea se envía como `LocalDate`. La vista `/hoy` consulta `GET /api/subtareas/hoy` con la fecha local y el identificador del organizador. Las mutaciones, incluida la eliminación de eventos, solo actualizan la vista después de recibir una respuesta persistida del servidor.

## Despliegue

`vercel.json` incluye la reescritura de rutas para que React Router funcione al recargar una URL directa de la SPA en Vercel. El build de Vercel debe usar `npm run build` y publicar `dist/`.

## Estado actual

- La interfaz de creación, detalle, panel de hoy, estados visuales, validaciones y eliminación segura está implementada.
- El layout usa una barra lateral de 250 px en escritorio y los componentes `Card` y `Badge` para mantener consistencia visual en las tarjetas.
- La eliminación de eventos usa `DELETE /api/eventos/{id}` y redirige al listado de progreso.
- La capa de API está conectada mediante `src/services/api.js`.
- La persistencia real depende de que el backend exponga los endpoints de eventos y subtareas con el contrato documentado.
- La autenticación y la selección definitiva del organizador siguen fuera de alcance; `VITE_USER_ID` es una configuración temporal de desarrollo.
