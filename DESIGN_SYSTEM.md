# Design System — Planificador de Eventos

**Versión:** 1.0 · **Fecha:** 2026-09-24 · **Ámbito:** SPA React + Tailwind CSS 4 · **Enfoque:** escritorio primero, adaptable a pantallas estrechas

## 1. Principios

- Claridad antes que decoración.
- Una acción destructiva siempre se distingue y se confirma.
- Los estados vacío, error y carga son parte normal de cada flujo.
- Los mensajes explican qué pasó y cómo corregirlo.
- La interfaz no depende únicamente del color.
- Los componentes deben ser reutilizables y composables.
- La navegación por teclado y el foco visible son obligatorios.

## 2. Paleta de colores

Los nombres corresponden a las clases Tailwind actualmente utilizadas.

### Marca y acciones

| Token         | HEX       | Uso                                   |
| ------------- | --------- | ------------------------------------- |
| `primary-50`  | `#EFF6FF` | Fondos suaves de marca y badges       |
| `primary-500` | `#3B82F6` | Elementos secundarios de marca        |
| `primary-600` | `#2563EB` | Botones primarios, enlaces y progreso |
| `primary-700` | `#1D4ED8` | Hover de acciones principales         |
| `primary-800` | `#1E40AF` | Énfasis de marca en textos            |

### Neutros y superficies

| Token         | HEX       | Uso                                     |
| ------------- | --------- | --------------------------------------- |
| `white`       | `#FFFFFF` | Tarjetas, superficies elevadas y contenido |
| `neutral-50`  | `#F9FAFB` | Fondo general de la aplicación          |
| `neutral-100` | `#F3F4F6` | Fondos de formularios y estados vacíos  |
| `neutral-200` | `#E5E7EB` | Bordes y separadores                    |
| `neutral-300` | `#D1D5DB` | Bordes de controles                     |
| `neutral-500` | `#6B7280` | Texto secundario y placeholders         |
| `neutral-600` | `#4B5563` | Texto de apoyo                          |
| `neutral-700` | `#374151` | Labels y texto de controles             |
| `neutral-900` | `#111827` | Títulos y texto principal               |

### Error y alerta

| Token        | HEX       | Uso                                       |
| ------------ | --------- | ----------------------------------------- |
| `danger-50`  | `#FEF2F2` | Fondo de error y acción destructiva suave |
| `danger-100` | `#FEE2E2` | Borde de estado de error                  |
| `danger-500` | `#EF4444` | Iconos de error                           |
| `danger-600` | `#DC2626` | Botón destructivo y texto de error        |
| `danger-700` | `#B91C1C` | Hover destructivo                         |

### Éxito y advertencia

Estas familias comunican avance, aciertos y advertencias sin reemplazar la semántica de los estados.

| Token         | HEX       | Uso                                       |
| ------------- | --------- | ----------------------------------------- |
| `success-50`  | `#ECFDF5` | Fondo de éxito y badges de tarea completada |
| `success-500` | `#10B981` | Borde de campo con valor válido           |
| `success-600` | `#059669` | Botón Completar, tarea completada y texto de acierto |
| `success-700` | `#047857` | Hover de acciones de éxito                |
| `warning-50`  | `#FFFBEB`  | Fondo de advertencia                      |
| `warning-600` | `#D97706`  | Advertencias de conflicto o tiempo        |

## 3. Tipografía

La fuente actual es el stack del sistema con `Inter` como primera opción:

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  sans-serif;
```

| Uso                 | Clase Tailwind          | Tamaño / peso  |
| ------------------- | ----------------------- | -------------- |
| Título principal    | `text-3xl font-bold`    | 30 px / 700    |
| Título de sección   | `text-2xl font-bold`    | 24 px / 700    |
| Título de tarjeta   | `text-lg font-semibold` | 18 px / 600    |
| Texto principal     | `text-sm` o `text-base` | 14–16 px / 400 |
| Label de formulario | `text-sm font-medium`   | 14 px / 500    |
| Texto secundario    | `text-xs text-gray-500` | 12 px / 400    |
| Botón               | `text-sm font-semibold` | 14 px / 600    |

Reglas:

- Máximo dos niveles de jerarquía dentro de una tarjeta.
- No usar color como único indicador.
- Los mensajes de error deben tener contraste suficiente y texto explicativo.

## 4. Espaciado y layout

Se utiliza la escala estándar de Tailwind:

| Clase | Valor | Uso típico                   |
| ----- | ----: | ---------------------------- |
| `1`   |  4 px | Ajuste interno pequeño       |
| `2`   |  8 px | Gap entre controles          |
| `3`   | 12 px | Padding de badges            |
| `4`   | 16 px | Padding de tarjetas y labels |
| `5`   | 20 px | Separación de campos         |
| `6`   | 24 px | Padding de contenido         |
| `8`   | 32 px | Separación entre secciones   |
| `10`  | 40 px | Bloques grandes              |
| `12`  | 48 px | Espaciado excepcional        |

Reglas de composición:

- Contenedor principal: `max-w-7xl`, centrado y con `p-6` a `p-10` según el viewport.
- Formulario principal: `max-w-3xl`.
- Detalle de evento: `max-w-5xl`.
- Tarjetas: usar `Card` con fondo blanco, borde `border-gray-200`, esquinas `rounded-xl` y sombra suave.
- Layout de escritorio: barra lateral de `250px` y área principal flexible; en viewport estrecho la navegación pasa a una fila superior.
- No usar espaciado menor que `gap-2` entre acciones principales.

## 5. Componentes

### 5.1 Botón

Archivo: `src/components/ui/Button.jsx`

Variantes:

| Variante  | Uso                                    | Comportamiento                    |
| --------- | -------------------------------------- | --------------------------------- |
| `primary` | Guardar, crear, editar                 | Fondo azul, texto blanco          |
| `success` | Completar una gestión                   | Fondo verde, texto blanco          |
| `neutral` | Cancelar, volver, acciones secundarias | Fondo blanco, borde gris          |
| `danger`  | Eliminar                               | Fondo rojo, solo con confirmación |

Propiedades obligatorias:

- `type="button"` por defecto.
- `disabled` para operaciones en curso.
- Foco visible mediante `focus-visible`.
- Soporte de `aria-busy`, `aria-label` y demás atributos.
- Para navegación usar `Button as={Link}`; nunca anidar un botón dentro de un enlace.

### 5.2 Tarjeta

Archivo: `src/components/ui/Card.jsx`

- Fondo blanco, borde `border-gray-200`, `rounded-xl` y sombra `0 4px 6px rgba(0,0,0,0.05)`.
- Usar `Card` para eventos, tareas, paneles y futuras superficies repetibles.
- Puede renderizar otro elemento mediante `as`, por ejemplo `Card as="article"` o `Card as="li"`.
- El padding y la estructura interna corresponden a la pantalla; la superficie visual no se duplica en cada vista.

### 5.3 Badge

Archivo: `src/components/ui/Badge.jsx`

- Forma de píldora con `rounded-full`, texto de 12 px y padding horizontal breve.
- Variantes: `neutral`, `info`, `pending` y `success`.
- El estado siempre incluye texto visible; el color solo refuerza la semántica.

### 5.4 Campo de texto y select

- Label visible y asociado con `htmlFor`/`id`.
- `name` coherente con el DTO cuando aplique.
- `required` para campos obligatorios.
- `aria-invalid="true"` cuando existe error.
- `aria-describedby` apunta al mensaje inline.
- Placeholder como ejemplo, nunca como sustituto del label.
- Los formularios se agrupan con `fieldset` y `legend` según la intención del usuario.
- Fechas de evento y objetivo: `<input type="date" min={getToday()}>`; el calendario y la validación de envío rechazan fechas pasadas.
- La fecha del evento se convierte a `LocalDateTime`; la fecha objetivo se envía como `LocalDate`.
- Horas: `<input type="number" min="1" step="1">`.

Mensajes de validación:

```text
Qué ocurrió + cómo corregirlo.
```

Estado de campo válido:

- Después de que la persona toca el campo (blur), un valor válido resalta el borde en `success-500`, muestra un check decorativo y un mensaje breve de acierto (`FieldSuccess`).
- El acierto ocupa el lugar del error; nunca coexisten en el mismo campo.
- Usar `role="status"` para la felicitación y `role="alert"` para el error; el color por sí solo nunca comunica el estado.
- Cambiar de `aria-describedby` entre error y felicitación según el estado del campo.

### 5.5 Estados

| Componente        | Contrato                                            |
| ----------------- | --------------------------------------------------- |
| `SimulatedLoader` | `role="status"`, `aria-live="polite"` y `aria-busy` |
| `EmptyState`      | Explica qué falta y ofrece una acción; admite un icono decorativo opcional de Lucide |
| `ErrorState`      | `role="alert"`, explica el error y ofrece reintento; los fallos del catálogo de tipos interrumpen la creación |
| `ProgressBar`     | `role="progressbar"` con valores 0–100              |

### 5.6 Modal de confirmación

Archivo: `src/components/ui/ConfirmModal.jsx`

- `role="dialog"`.
- `aria-modal="true"`.
- `aria-labelledby` y `aria-describedby`.
- Foco inicial dentro del diálogo.
- Tab y Shift+Tab permanecen dentro del modal.
- `Escape` cancela cuando no hay una operación en curso.
- El foco vuelve al elemento que abrió el modal.
- No se permite cerrar accidentalmente durante una eliminación.

### 5.7 Layout y navegación

Archivo: `src/components/ui/Layout.jsx`

- Barra lateral persistente de `250px` en escritorio y navegación superior en móvil.
- `nav` con etiqueta accesible y enlaces a Hoy, Progreso y Crear Evento.
- El detalle del evento incluye un botón neutral `Volver a eventos` que navega a `/progreso`.
- El CTA de creación se separa visualmente de los enlaces de navegación.
- `main` usa `flex: 1` y padding de hasta `40px` (`p-10`) en pantallas amplias.
- Enlace `Saltar al contenido`.
- `Outlet` para renderizar la pantalla activa.

### 5.8 Notificación de éxito (toast)

Archivos: `src/components/ui/Toast.jsx`, `src/components/ui/ToastContainer.jsx`.

- Aparece en la esquina superior derecha deslizándose desde la derecha (`toast-in`).
- Se retira solo después de 3.5 s deslizándose de vuelta a la derecha (`toast-out`); también puede cerrarse con el botón `×`.
- El ícono varía según la acción: `check` (guardar/añadir/completar), `edit` (actualizar), `trash` (eliminar), `undo` (reabrir).
- Iconos Lucide como componentes React, con `aria-hidden="true"` y badge de color suave por tipo.
- Cada toast usa `role="status"`; la información nunca se comunica solo mediante el ícono, siempre lleva texto.
- Soporta `prefers-reduced-motion` (intercambia el deslizamiento por un fade breve).
- La API se expone a las vistas mediante `useNotifications().notifySuccess({ icon, message })` del `NotificationsProvider`.

### 5.9 Modal de error cognitivo

Archivo: `src/components/ui/ErrorModal.jsx`

- Reemplaza los avisos de error de acciones (guardar, editar, eliminar, alternar estado).
- Paleta suave: badge `amber-50`/`amber-600`, sin rojos intensos.
- Iconografía Lucide simple (alerta), título claro y no alarmante, un solo botón `Entendido`.
- `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby` y `aria-describedby`.
- El foco entra al diálogo, `Escape` lo cierra y el foco vuelve al elemento que lo abrió.
- Se abre mediante `useNotifications().notifyError({ title, message })`.
- Los errores de carga inicial de una pantalla siguen usando `ErrorState` con reintento; solo los errores de acciones usan el modal.

### 5.10 Resúmenes y tarjetas operativas

Archivos: `src/components/ui/MetricCard.jsx`, `src/components/ui/WorkloadSummary.jsx`, `src/components/ui/TaskCard.jsx`.

- `MetricCard` muestra una métrica con etiqueta visible, valor numérico y un icono decorativo opcional.
- `WorkloadSummary` prioriza horas estimadas, completadas y restantes; la cantidad de tareas es secundaria.
- `TaskCard` muestra nombre, evento, fecha, horas, estado y acceso al evento mediante `Button as={Link}`.
- Las tareas atrasadas usan advertencia visual, badge `Atrasada` y etiqueta relativa de vencimiento.
- Las listas de Hoy muestran como máximo 5 tareas por sección y comunican el total cuando hay elementos ocultos.
- `ProgressBar` representa el porcentaje de horas completadas, no solo el porcentaje de tareas.

### 5.11 Campo válido (FieldSuccess)

Archivo: `src/components/ui/FieldSuccess.jsx`

- Aviso breve de acierto con icono `Check` de Lucide (`aria-hidden="true"`) y texto en `success-600`.
- Se renderiza como `<p role="status">` con `id` para `aria-describedby`.
- Debe existir un mensaje de éxito por campo (ver `docs/guia-microcopy.md`).

### 5.12 Tarjeta de evento y acento por evento

Archivo: `src/components/ui/EventCard.jsx` · Util: `src/utils/eventAccent.js`

- Cada evento recibe un acento único de la paleta mediante `getEventAccent(id)`. El color es determinístico: se repite entre el panel de progreso y la vista de detalle para mantener la identidad del evento.
- Paleta de acentos (hex / fondo suave / glow): indigo `#4F46E5`/`#EEF2FF`, teal `#0D9488`/`#F0FDFA`, ámbar `#D97706`/`#FFFBEB`, rosa `#DB2777`/`#FDF2F8`, violeta `#7C3AED`/`#F5F3FF` y cian `#0891B2`/`#ECFEFF`.
- La tarjeta incluye el acento en el badge, la barra de progreso (`accentColor`) y las variables CSS `--accent`, `--accent-soft` y `--accent-glow`.
- Interacción: al pasar el cursor (o enfocar con teclado, `:focus-within`) la tarjeta crece un 3 % (`scale(1.03)`) y proyecta la sombra de color `--accent-glow`; con `prefers-reduced-motion` se omiten el escalado y las transiciones largas.
- El acento es decorativo: no sustituye a ningún indicador textual o semántico.

## 6. Reglas de accesibilidad

- Mantener contraste mínimo AA en texto normal.
- No comunicar estados exclusivamente mediante color.
- Proporcionar texto visible para errores.
- Mantener foco visible en todos los controles.
- Respetar el orden natural de tabulación.
- No eliminar el foco sin reemplazarlo por un elemento equivalente.
- Cuando un envío falle por validación, enfocar el primer campo inválido.
- Usar `aria-hidden="true"` en iconos decorativos.
- Usar `role="status"` para progreso y avisos de acierto; `role="alert"` para errores.
- Evitar animaciones que bloqueen la interacción.
- Las animaciones de transformación deben respetar `prefers-reduced-motion`.

## 7. Ejemplos de uso

```jsx
<Button type="submit" variant="primary" disabled={isSubmitting}>
  {isSubmitting ? 'Guardando...' : 'Guardar evento'}
</Button>
```

```jsx
<Card className="p-5">
  <Badge variant="pending">Pendiente</Badge>
</Card>
```

```jsx
<ErrorState
  title="No pudimos cargar el evento"
  message="Revisa tu conexión e inténtalo de nuevo."
  onRetry={reload}
/>
```

```jsx
<ConfirmModal
  open={Boolean(deleteTarget)}
  title="Eliminar gestión"
  message="Esta acción no se puede deshacer."
  onCancel={closeModal}
  onConfirm={deleteSubtask}
  confirmLabel="Eliminar"
/>
```

```jsx
<Card className="event-card p-5">
  <FieldSuccess id="event-name-success">¡Listo! Nombre válido.</FieldSuccess>
</Card>
```

```jsx
<Card
  as="article"
  className="event-card p-5"
  style={{
    '--accent': accent.hex,
    '--accent-soft': accent.soft,
    '--accent-glow': accent.glow,
  }}
>
  <ProgressBar value={progress} accentColor={accent.hex} label="Progreso por horas" />
</Card>
```

## 8. Mantenimiento

Cualquier nuevo color, espaciado, componente o patrón de microcopy debe documentarse aquí antes de consolidarse en la interfaz.
